/**
 * Storage Manager
 * Central manager for all storage operations with automatic adapter selection
 * 
 * @module lib/storage/manager
 */

import { IStorageAdapter, StorageConfig, ProcessedUploadResult } from './adapter';
import { SupabaseStorageAdapter } from './supabase-adapter';
import { LocalStorageAdapter } from './local-adapter';
import {
  processImage,
  generateThumbnails,
  addWatermark,
  getImageDimensions,
  calculateCompressionRatio,
  ImageProcessorConfig,
} from './image-processor';
import { generateUniqueFilename, sanitizeFilename } from '@/lib/image-validation';

// Singleton instance
let storageManagerInstance: StorageManager | null = null;

export interface UploadContext {
  userId: string;
  entityType?: 'listing' | 'avatar' | 'document' | 'banner' | 'general';
  entityId?: string;
}

export interface AdvancedUploadOptions {
  /** Original filename */
  originalName?: string;
  /** MIME type */
  mimeType: string;
  /** Skip image processing */
  skipProcessing?: boolean;
  /** Custom processor config */
  processorConfig?: ImageProcessorConfig;
  /** Generate thumbnails */
  generateThumbnails?: boolean;
  /** Add watermark */
  watermark?: boolean;
  /** Custom path (overrides auto-generation) */
  customPath?: string;
}

export interface UploadResult extends ProcessedUploadResult {
  /** Storage adapter used */
  provider: string;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Context information */
  context: UploadContext;
}

/**
 * Storage Manager - Main entry point for all storage operations
 */
export class StorageManager {
  private adapter: IStorageAdapter;
  private config: StorageConfig;
  
  private constructor(adapter: IStorageAdapter, config: StorageConfig) {
    this.adapter = adapter;
    this.config = config;
  }

  /**
   * Initialize and get the singleton instance
   */
  static async getInstance(config?: Partial<StorageConfig>): Promise<StorageManager> {
    if (storageManagerInstance && !config) {
      return storageManagerInstance;
    }

    // Determine which adapter to use
    const fullConfig: StorageConfig = {
      provider: config?.provider || process.env.STORAGE_PROVIDER as StorageConfig['provider'] || 'supabase',
      bucket: config?.bucket || process.env.STORAGE_BUCKET || 'listing-images',
      region: config?.region || process.env.STORAGE_REGION,
      credentials: config?.credentials || {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accountName: process.env.AZURE_ACCOUNT_NAME,
        accountKey: process.env.AZURE_ACCOUNT_KEY,
      },
      options: config?.options || {
        publicUrl: process.env.STORAGE_PUBLIC_URL,
        cdnUrl: process.env.CDN_URL,
      },
    };

    let adapter: IStorageAdapter;

    switch (fullConfig.provider) {
      case 'local':
        adapter = new LocalStorageAdapter({
          basePath: process.env.LOCAL_STORAGE_PATH || './uploads',
          baseUrl: fullConfig.options?.publicUrl || '/uploads',
        });
        break;
        
      case 'supabase':
      default:
        adapter = new SupabaseStorageAdapter({
          bucket: fullConfig.bucket || 'listing-images',
          publicUrl: fullConfig.options?.publicUrl,
        });
        break;
      
      // Future: S3, Azure, GCS adapters
      // case 's3':
      //   adapter = new S3StorageAdapter(fullConfig);
      //   break;
    }

    storageManagerInstance = new StorageManager(adapter, fullConfig);
    return storageManagerInstance;
  }

  /**
   * Get the current adapter
   */
  getAdapter(): IStorageAdapter {
    return this.adapter;
  }

  /**
   * Get adapter name
   */
  getProviderName(): string {
    return this.adapter.name;
  }

  /**
   * Generate storage path for a file
   */
  generateStoragePath(
    context: UploadContext,
    originalFilename: string,
    variant?: string
  ): string {
    const sanitized = sanitizeFilename(originalFilename);
    const uniqueName = generateUniqueFilename(sanitized);
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Build path: /entityType/entityId/year/month/filename
    const parts = [
      context.userId,
      context.entityType || 'general',
      year.toString(),
      month,
    ];

    if (context.entityId) {
      parts.splice(2, 0, context.entityId);
    }

    if (variant) {
      const ext = uniqueName.includes('.') ? uniqueName.split('.').pop() : 'jpg';
      const baseName = uniqueName.replace(`.${ext}`, '');
      parts.push(`${baseName}_${variant}.${ext}`);
    } else {
      parts.push(uniqueName);
    }

    return parts.join('/');
  }

  /**
   * Upload and process an image with full optimization pipeline
   */
  async uploadImage(
    buffer: Buffer,
    options: AdvancedUploadOptions,
    context: UploadContext
  ): Promise<UploadResult> {
    const startTime = Date.now();
    const originalSize = buffer.length;

    // 1. Process/optimize the image
    let processedBuffer = buffer;
    let processedImage = await processImage(buffer, options.mimeType, options.processorConfig);
    processedBuffer = processedImage.buffer;

    // 2. Add watermark if requested
    if (options.watermark && this.config.options) {
      // Default watermark config could come from settings
      processedBuffer = await addWatermark(processedBuffer, {
        text: 'MAVORA',
        position: 'bottom-right',
        opacity: 0.3,
      });
    }

    // 3. Generate storage path
    const mainPath = options.customPath || 
                     this.generateStoragePath(context, options.originalName || 'image.jpg');

    // 4. Upload to storage
    const uploadResult = await this.adapter.upload(mainPath, processedBuffer, {
      contentType: `image/${processedImage.format}`,
      cacheControl: '31536000', // 1 year
      metadata: {
        originalName: options.originalName,
        originalSize: originalSize.toString(),
        width: processedImage.width.toString(),
        height: processedImage.height.toString(),
        optimized: (!options.skipProcessing).toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    // 5. Generate thumbnails if requested
    let thumbnailUrl: string | undefined;
    let variants: UploadResult['variants'];

    if (options.generateThumbnails !== false) {
      const thumbnailConfigs = {
        small: { width: 150, height: 150, fit: 'cover' as const, quality: 70, format: 'webp' as const },
        medium: { width: 400, height: 400, fit: 'cover' as const, quality: 75, format: 'webp' as const },
        large: { width: 800, height: 800, fit: 'inside' as const, quality: 78, format: 'webp' as const },
      };

      const thumbnails = await generateThumbnails(buffer, thumbnailConfigs);
      
      variants = {};
      
      for (const [size, thumbnail] of Object.entries(thumbnails)) {
        const thumbPath = this.generateStoragePath(context, options.originalName || 'image.jpg', size);
        
        try {
          const thumbUpload = await this.adapter.upload(thumbPath, thumbnail.buffer, {
            contentType: `image/${thumbnail.format}`,
            cacheControl: '31536000',
          });
          
          variants[size] = thumbUpload.path;
          
          if (size === 'medium') {
            thumbnailUrl = thumbUpload.url;
          }
        } catch (error) {
          console.error(`[StorageManager] Failed to upload ${size} thumbnail:`, error);
        }
      }
    }

    // 6. Build result
    const result: UploadResult = {
      ...uploadResult,
      originalSize,
      compressionRatio: calculateCompressionRatio(originalSize, processedBuffer.length),
      optimized: processedBuffer.length < originalSize * 0.95, // At least 5% savings
      dimensions: {
        width: processedImage.width,
        height: processedImage.height,
      },
      thumbnailUrl,
      variants,
      provider: this.adapter.name,
      uploadedAt: new Date(),
      context,
    };

    console.log(`[StorageManager] Image uploaded in ${Date.now() - startTime}ms`, {
      original: formatBytes(originalSize),
      final: formatBytes(processedBuffer.length),
      savings: `${result.compressionRatio}%`,
      provider: this.adapter.name,
    });

    return result;
  }

  /**
   * Simple file upload without processing
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    context: UploadContext
  ): Promise<StorageFile> {
    const path = this.generateStoragePath(context, filename);
    
    return this.adapter.upload(path, buffer, {
      contentType: mimeType,
      cacheControl: '31536000',
    });
  }

  /**
   * Delete a file and its variants
   */
  async deleteWithVariants(mainPath: string): Promise<void> {
    const pathsToDelete = [mainPath];

    // Try to find and delete thumbnail variants
    const variants = ['small', 'medium', 'large'];
    for (const variant of variants) {
      const variantPath = mainPath.replace(/(\.[^.]+)$/, `_${variant}$1`);
      pathsToDelete.push(variantPath);
    }

    await this.adapter.deleteMany(pathsToDelete);
  }

  /**
   * Get URL for a file
   */
  getUrl(path: string): string {
    return this.adapter.getPublicUrl(path);
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    if (this.adapter.generateSignedUrl) {
      return this.adapter.generateSignedUrl(path, expiresIn);
    }
    // Fallback to public URL
    return this.adapter.getPublicUrl(path);
  }

  /**
   * Check storage health
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    provider: string;
    details?: string;
  }> {
    const result = await this.adapter.healthCheck();
    return {
      ...result,
      provider: this.adapter.name,
    };
  }
}

/**
 * Helper function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Convenience function to get storage manager instance
 */
export async function getStorageManager(config?: Partial<StorageConfig>) {
  return StorageManager.getInstance(config);
}
