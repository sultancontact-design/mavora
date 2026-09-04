/**
 * Advanced Image Processor
 * Handles image optimization, resizing, thumbnails, and format conversion
 * 
 * @module lib/storage/image-processor
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  quality: number;
}

export interface ThumbnailConfig {
  width: number;
  height: number;
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpeg' | 'webp' | 'avif';
}

export interface WatermarkOptions {
  text?: string;
  imagePath?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  size?: number; // font size for text, or width for image
  color?: string;
}

export interface ImageProcessorConfig {
  // Size limits
  maxWidth?: number;
  maxHeight?: number;
  
  // Compression
  jpegQuality?: number;
  webpQuality?: number;
  pngCompressionLevel?: number;
  avifQuality?: number;
  
  // Auto-convert options
  convertPngToJpeg?: boolean; // For large PNGs without transparency
  pngSizeThreshold?: number; // In bytes, above this convert to JPEG
  
  // Thumbnail presets
  thumbnails?: {
    small?: ThumbnailConfig;
    medium?: ThumbnailConfig;
    large?: ThumbnailConfig;
  };
  
  // Watermark (optional)
  watermark?: WatermarkOptions;
  
  // Metadata handling
  stripExif?: boolean; // Strip EXIF data for privacy
  preserveColorProfile?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ImageProcessorConfig = {
  maxWidth: 1920,
  maxHeight: 1920,
  jpegQuality: 82,
  webpQuality: 80,
  pngCompressionLevel: 9,
  avifQuality: 60,
  convertPngToJpeg: true,
  pngSizeThreshold: 500000, // 500KB
  thumbnails: {
    small: { width: 150, height: 150, fit: 'cover', quality: 70, format: 'webp' },
    medium: { width: 400, height: 400, fit: 'cover', quality: 75, format: 'webp' },
    large: { width: 800, height: 800, fit: 'inside', quality: 78, format: 'webp' },
  },
  stripExif: true,
  preserveColorProfile: false,
};

/**
 * Check if Sharp is available
 */
async function getSharp() {
  try {
    const sharp = await import('sharp');
    return sharp.default || sharp;
  } catch {
    console.warn('[ImageProcessor] Sharp not available, using fallback');
    return null;
  }
}

/**
 * Get image dimensions from buffer
 */
export async function getImageDimensions(buffer: Buffer): Promise<ImageDimensions | null> {
  try {
    const sharp = await getSharp();
    if (!sharp) return null;

    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch (error) {
    console.warn('[ImageProcessor] Could not get dimensions:', error);
    return null;
  }
}

/**
 * Check if image has transparency/alpha channel
 */
export async function hasTransparency(buffer: Buffer): Promise<boolean> {
  try {
    const sharp = await getSharp();
    if (!sharp) return false;

    const metadata = await sharp(buffer).metadata();
    
    // PNG with alpha, or WebP with alpha
    if (metadata.format === 'png' || metadata.format === 'webp') {
      const info = await sharp(buffer).stats();
      // Check if alpha channel has non-opaque values
      // This is a simplified check - full check would require pixel inspection
      return metadata.channels && metadata.channels > 3;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Process/optimize an image according to config
 */
export async function processImage(
  inputBuffer: Buffer,
  originalMimeType: string,
  config: ImageProcessorConfig = {}
): Promise<ProcessedImage> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const sharp = await getSharp();

  // If Sharp is not available, return original
  if (!sharp) {
    return {
      buffer: inputBuffer,
      width: 0,
      height: 0,
      format: originalMimeType.split('/')[1] || 'unknown',
      size: inputBuffer.length,
      quality: 100,
    };
  }

  try {
    let pipeline = sharp(inputBuffer);
    
    // Get metadata
    const metadata = await pipeline.metadata();
    const { width = 0, height = 0, format = 'jpeg' } = metadata;

    // Determine output format
    let outputFormat = 'jpeg';
    let outputOptions: Record<string, unknown> = {};

    switch (originalMimeType) {
      case 'image/png':
        // Check if we should convert large PNGs to JPEG
        if (cfg.convertPngToJpeg && inputBuffer.length > (cfg.pngSizeThreshold || 500000)) {
          const transparent = await hasTransparency(inputBuffer);
          if (!transparent) {
            outputFormat = 'jpeg';
            outputOptions = { quality: cfg.jpegQuality, mozjpeg: true };
          } else {
            outputFormat = 'png';
            outputOptions = { compressionLevel: cfg.pngCompressionLevel };
          }
        } else {
          outputFormat = 'png';
          outputOptions = { compressionLevel: cfg.pngCompressionLevel };
        }
        break;
        
      case 'image/webp':
        outputFormat = 'webp';
        outputOptions = { quality: cfg.webpQuality };
        break;
        
      case 'image/avif':
        outputFormat = 'avif';
        outputOptions = { quality: cfg.avifQuality };
        break;
        
      case 'image/gif':
        // Keep GIF as-is for animated, convert first frame otherwise
        const gifMetadata = await sharp(inputBuffer).metadata();
        if ((gifMetadata.pages || 1) > 1) {
          // Animated GIF - keep as is
          return {
            buffer: inputBuffer,
            width,
            height,
            format: 'gif',
            size: inputBuffer.length,
            quality: 100,
          };
        }
        outputFormat = 'webp';
        outputOptions = { quality: cfg.webpQuality };
        break;
        
      case 'image/jpeg':
      default:
        outputFormat = 'jpeg';
        outputOptions = { quality: cfg.jpegQuality, mozjpeg: true };
    }

    // Resize if exceeds max dimensions
    if (width > (cfg.maxWidth || 1920) || height > (cfg.maxHeight || 1920)) {
      pipeline = pipeline.resize(cfg.maxWidth || 1920, cfg.maxHeight || 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Strip EXIF data if configured
    if (cfg.stripExif !== false) {
      pipeline = pipeline.withoutExif();
    }

    // Apply format and options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipeline = (pipeline as any)[outputFormat](outputOptions);

    // Process the image
    const outputBuffer = await pipeline.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: outputMetadata.width || width,
      height: outputMetadata.height || height,
      format: outputFormat,
      size: outputBuffer.length,
      quality: typeof outputOptions.quality === 'number' ? outputOptions.quality : 100,
    };
  } catch (error) {
    console.error('[ImageProcessor] Processing error:', error);
    // Return original on error
    return {
      buffer: inputBuffer,
      width: 0,
      height: 0,
      format: originalMimeType.split('/')[1] || 'unknown',
      size: inputBuffer.length,
      quality: 100,
    };
  }
}

/**
 * Generate a thumbnail from an image
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  thumbnailConfig: ThumbnailConfig
): Promise<ProcessedImage> {
  const sharp = await getSharp();

  if (!sharp) {
    throw new Error('Sharp is required for thumbnail generation');
  }

  try {
    let pipeline = sharp(inputBuffer);

    // Resize to thumbnail dimensions
    pipeline = pipeline.resize(thumbnailConfig.width, thumbnailConfig.height, {
      fit: thumbnailConfig.fit,
      withoutEnlargement: true,
    });

    // Apply format
    const format = thumbnailConfig.format || 'webp';
    const quality = thumbnailConfig.quality || 75;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipeline = (pipeline as any)[format]({ quality });

    const outputBuffer = await pipeline.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: metadata.width || thumbnailConfig.width,
      height: metadata.height || thumbnailConfig.height,
      format,
      size: outputBuffer.length,
      quality,
    };
  } catch (error) {
    console.error('[ImageProcessor] Thumbnail generation error:', error);
    throw new Error(`Failed to generate thumbnail: ${(error as Error).message}`);
  }
}

/**
 * Generate multiple thumbnail sizes
 */
export async function generateThumbnails(
  inputBuffer: Buffer,
  configs: Record<string, ThumbnailConfig>
): Promise<Record<string, ProcessedImage>> {
  const results: Record<string, ProcessedImage> = {};
  
  for (const [name, config] of Object.entries(configs)) {
    try {
      results[name] = await generateThumbnail(inputBuffer, config);
    } catch (error) {
      console.error(`[ImageProcessor] Failed to generate ${name} thumbnail:`, error);
    }
  }
  
  return results;
}

/**
 * Add watermark to image
 */
export async function addWatermark(
  inputBuffer: Buffer,
  options: WatermarkOptions
): Promise<Buffer> {
  const sharp = await getSharp();

  if (!sharp) {
    console.warn('[ImageProcessor] Sharp not available, skipping watermark');
    return inputBuffer;
  }

  try {
    let pipeline = sharp(inputBuffer);
    const { width = 1000, height = 1000 } = await pipeline.metadata();

    if (options.text) {
      // Text watermark
      const svgText = `
        <svg width="${Math.min(width, 400)}" height="80" xmlns="http://www.w3.org/2000/svg">
          <style>
            .watermark { 
              fill: ${options.color || 'rgba(255,255,255,0.5)'}; 
              font-family: Arial, sans-serif; 
              font-size: ${options.size || 24}px; 
              font-weight: bold;
            }
          </style>
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="watermark">
            ${options.text}
          </text>
        </svg>
      `;

      const textBuffer = Buffer.from(svgText);

      // Calculate position
      const left = options.position.includes('left') ? 20 : 
                   options.position.includes('right') ? width - Math.min(width, 380) : 
                   (width - Math.min(width, 360)) / 2;
      const top = options.position.includes('top') ? 20 : 
                  options.position.includes('bottom') ? height - 100 : 
                  (height - 80) / 2;

      pipeline = pipeline.composite([{
        input: textBuffer,
        left: Math.round(left),
        top: Math.round(top),
      }]);
    } else if (options.imagePath) {
      // Image watermark would require loading from storage
      console.warn('[ImageProcessor] Image watermark not yet implemented');
    }

    return await pipeline.toBuffer();
  } catch (error) {
    console.error('[ImageProcessor] Watermark error:', error);
    return inputBuffer;
  }
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round((1 - compressedSize / originalSize) * 100);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
