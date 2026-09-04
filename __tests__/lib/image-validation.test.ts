/**
 * Unit Tests for Image Validation
 * @module __tests__/lib/image-validation.test
 */

import { describe, it, expect } from 'vitest';

// Image validation utilities (extracted for testing)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateImage(file: {
  name?: string;
  type?: string;
  size?: number;
  buffer?: Buffer;
}): ImageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file existence
  if (!file) {
    return { valid: false, errors: ['No file provided'], warnings };
  }

  // Check MIME type
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Check file size
  if (file.size !== undefined && file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(`File too large: ${sizeMB}MB. Maximum: 5MB`);
  }

  // Check file extension if name is provided
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    
    if (ext && !allowedExts.includes(ext)) {
      errors.push(`Invalid file extension: .${ext}`);
    }
  }

  // Warn about very small images (might be icons/thumbnails)
  if (file.size !== undefined && file.size < 1024) {
    warnings.push('File is very small (< 1KB), please verify it\'s a valid image');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Filename sanitization
function sanitizeFilename(name: string): string {
  // Remove path traversal characters
  let sanitized = name.replace(/\.\./g, '').replace(/[\\/]/g, '_');
  
  // Remove non-alphanumeric characters except hyphens, underscores, dots
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-./]/g, '_');
  
  // Prevent empty filenames
  if (!sanitized || sanitized.length === 0) {
    sanitized = `upload_${Date.now()}.jpg`;
  }
  
  // Ensure it has an extension
  if (!sanitized.includes('.')) {
    sanitized += '.jpg';
  }
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }
  
  return sanitized;
}

describe('Image Validation', () => {
  describe('MIME type validation', () => {
    it('should accept JPEG images', () => {
      const result = validateImage({ type: 'image/jpeg' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept PNG images', () => {
      const result = validateImage({ type: 'image/png' });
      expect(result.valid).toBe(true);
    });

    it('should accept WebP images', () => {
      const result = validateImage({ type: 'image/webp' });
      expect(result.valid).toBe(true);
    });

    it('should accept GIF images', () => {
      const result = validateImage({ type: 'image/gif' });
      expect(result.valid).toBe(true);
    });

    it('should reject PDF files', () => {
      const result = validateImage({ type: 'application/pdf' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid file type'))).toBe(true);
    });

    it('should reject plain text files', () => {
      const result = validateImage({ type: 'text/plain' });
      expect(result.valid).toBe(false);
    });

    it('should handle missing MIME type', () => {
      const result = validateImage({});
      // Missing type is not an error - we'll check extension instead
      expect(result.errors.some(e => e.includes('type'))).toBe(false);
    });
  });

  describe('File size validation', () => {
    it('should accept files under 5MB', () => {
      const result = validateImage({ size: 1024 * 1024 }); // 1MB
      expect(result.valid).toBe(true);
    });

    it('should reject files over 5MB', () => {
      const result = validateImage({ size: 6 * 1024 * 1024 }); // 6MB
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('too large'))).toBe(true);
    });

    it('should accept files exactly at 5MB limit', () => {
      const result = validateImage({ size: 5 * 1024 * 1024 }); // 5MB
      expect(result.valid).toBe(true);
    });

    it('should warn about very small files', () => {
      const result = validateImage({ size: 500 }); // 500 bytes
      expect(result.warnings.some(w => w.includes('very small'))).toBe(true);
    });
  });

  describe('Filename validation', () => {
    it('should accept normal filenames', () => {
      const result = validateImage({ name: 'photo.jpg' });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid extensions', () => {
      const result = validateImage({ name: 'script.exe' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('extension'))).toBe(true);
    });

    it('should accept various image extensions', () => {
      const extensions = ['photo.jpg', 'image.png', 'pic.gif', 'photo.webp'];
      
      extensions.forEach(ext => {
        const result = validateImage({ name: ext });
        expect(result.errors.some(e => e.includes('extension'))).toBe(false);
      });
    });
  });

  describe('null/undefined handling', () => {
    it('should handle null input', () => {
      const result = validateImage(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No file provided');
    });

    it('should handle undefined input', () => {
      const result = validateImage(undefined as any);
      expect(result.valid).toBe(false);
    });
  });
});

describe('Filename Sanitization', () => {
  it('should keep valid filenames unchanged', () => {
    expect(sanitizeFilename('photo.jpg')).toBe('photo.jpg');
  });

  it('should remove path traversal characters', () => {
    const result = sanitizeFilename('../../etc/passwd');
    expect(result).not.toContain('..');
    expect(result).not.toContain('/');
  });

  it('should replace backslashes', () => {
    expect(sanitizeFilename('path\\to\\file.png')).toBe('path_to_file.png');
  });

  it('should handle special characters', () => {
    const result = sanitizeFilename('my photo@#$%.jpg');
    expect(result).toContain('my_photo');
    expect(result).toContain('.jpg');
    // Should not contain @, #, $, %
    expect(result).not.toMatch(/[@#%]/);
  });

  it('should generate default for empty filename', () => {
    const result = sanitizeFilename('');
    expect(result).toContain('upload_');
    expect(result).toContain('.jpg');
  });

  it('should add extension if missing', () => {
    expect(sanitizeFilename('filename')).toBe('filename.jpg');
  });

  it('should limit filename length', () => {
    const longName = 'a'.repeat(300) + '.png';
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('should preserve file extension when truncating', () => {
    const longName = 'a'.repeat(300) + '.png';
    const result = sanitizeFilename(longName);
    expect(result.endsWith('.png')).toBe(true);
  });
});
