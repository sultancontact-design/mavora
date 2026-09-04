/**
 * Image Upload Utilities
 * Validation, compression, and optimization
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
  processedBlob?: Blob;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function validateImage(file: File): Promise<ImageValidationResult> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true, file, processedBlob: file };
}

export function generateImageFilename(originalName: string, listingId: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${listingId}/${timestamp}_${random}.${ext}`;
}
