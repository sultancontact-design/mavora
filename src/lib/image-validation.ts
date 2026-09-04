/**
 * Image Validation Utilities
 * Validates uploaded images for type, size, and security
 * 
 * @module lib/image-validation
 */

// Allowed MIME types for image uploads
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

// Maximum file size (5MB)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Minimum file size (1KB - prevents empty/corrupt files)
export const MIN_IMAGE_SIZE = 1024;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] as const;

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFilename?: string;
}

export interface ImageFile {
  name?: string;
  type: string;
  size: number;
  buffer?: Buffer;
}

/**
 * Validate an uploaded image file
 */
export function validateImage(file: Partial<ImageFile>): ImageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if file exists
  if (!file || (!file.type && !file.name)) {
    return {
      valid: false,
      errors: ['No file provided'],
      warnings,
    };
  }

  // Validate MIME type
  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    errors.push(
      `نوع الملف غير مدعوم: ${file类型}. الأنواع المسموحة: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }

  // Validate file size
  if (file.size !== undefined) {
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      errors.push(`حجم الملف كبير جداً: ${sizeMB} ميجابايت. الحد الأقصى: 5 ميجابايت`);
    }

    if (file.size > 0 && file.size < MIN_IMAGE_SIZE) {
      warnings.push('الصورة صغيرة جداً، قد تكون تالفة');
    }
  }

  // Validate extension
  let sanitizedFilename: string | undefined;
  
  if (file.name) {
    const ext = extractExtension(file.name);
    
    if (ext && !ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
      errors.push(`امتداد الملف غير مسموح: .${ext}`);
    }
    
    sanitizedFilename = sanitizeFilename(file.name);
    
    if (sanitizedFilename !== file.name) {
      warnings.push('تم تعديل اسم الملف للأمان');
    }
  }

  // Check for potentially dangerous content
  if (file.buffer) {
    // Check for common malicious patterns at start of file
    const header = file.buffer.slice(0, 4).toString('hex');
    
    // Common image file signatures
    const imageSignatures = [
      'ffd8ff', // JPEG
      '89504e47', // PNG
      '47494638', // GIF
      '52494646', // WebP/RIFF
      '3c3f786d', // SVG (starts with <?xml)
      '3c73766', // SVG (starts with <svg)
    ];
    
    const isValidImageHeader = imageSignatures.some(sig => header.startsWith(sig));
    
    if (!isValidImageHeader && file.type !== 'image/svg+xml') {
      warnings.push('ملف الصورة قد لا يكون صالحاً');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedFilename,
  };
}

/**
 * Extract file extension from filename
 */
function extractExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return null;
  }
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove null bytes
  filename = filename.replace(/\0/g, '');
  
  // Remove path traversal characters
  filename = filename.replace(/\.\./g, '').replace(/[\\/]/g, '_');
  
  // Remove non-alphanumeric characters except safe ones
  filename = filename.replace(/[^a-zA-Z0-9_\-.\u0600-\u06FF\s]/g, '_');
  
  // Replace spaces with underscores
  filename = filename.replace(/\s+/g, '_');
  
  // Prevent empty filenames
  if (!filename.trim()) {
    return `upload_${Date.now()}.jpg`;
  }
  
  // Ensure it has an extension
  if (!filename.includes('.')) {
    filename += '.jpg';
  }
  
  // Limit length
  if (filename.length > 255) {
    const ext = extractExtension(filename);
    const nameWithoutExt = ext ? filename.substring(0, filename.length - ext!.length - 1) : filename;
    const safeExt = ext || 'jpg';
    filename = nameWithoutExt.substring(0, 255 - safeExt.length - 1) + '.' + safeExt;
  }
  
  return filename;
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = extractExtension(originalName) || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}.${ext}`;
}

/**
 * Get dimensions of an image buffer (if possible)
 * Requires 'sharp' or 'jimp' package for actual implementation
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    // Dynamic import to avoid requiring sharp in all environments
    const sharp = await import('sharp').catch(() => null);
    
    if (sharp) {
      const metadata = await sharp.default(buffer).metadata();
      if (metadata.width && metadata.height) {
        return { width: metadata.width, height: metadata.height };
      }
    }
  } catch (error) {
    console.warn('[Image Validation] Could not get image dimensions:', error);
  }
  
  return null;
}

/**
 * Validate image dimensions
 */
export function validateDimensions(
  dimensions: { width: number; height: number } | null,
  options: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  } = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!dimensions) {
    return { valid: true, errors }; // Can't validate without dimensions
  }
  
  const { width, height } = dimensions;
  
  if (options.minWidth && width < options.minWidth) {
    errors.push(`عرض الصورة صغير جداً: ${width}px. الحد الأدنى: ${options.minWidth}px`);
  }
  
  if (options.maxWidth && width > options.maxWidth) {
    errors.push(`عرض الصورة كبير جداً: ${width}px. الحد الأقصى: ${options.maxWidth}px`);
  }
  
  if (options.minHeight && height < options.minHeight) {
    errors.push(`ارتفاع الصورة صغير جداً: ${height}px. الحد الأدنى: ${options.minHeight}px`);
  }
  
  if (options.maxHeight && height > options.maxHeight) {
    errors.push(`ارتفاع الصورة كبير جداً: ${height}px. الحد الأقصى: ${options.maxHeight}px`);
  }
  
  return { valid: errors.length === 0, errors };
}
