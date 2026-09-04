/**
 * Advanced Upload API
 * Handles image upload with full optimization pipeline
 * 
 * @route POST /api/upload - Upload image
 * @route GET /api/upload - Get upload configuration
 * @route DELETE /api/upload - Delete uploaded image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase';
import {
  validateImage,
  generateUniqueFilename,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  getImageDimensions,
  validateDimensions,
} from '@/lib/image-validation';
import { getStorageManager, UploadContext } from '@/lib/storage/manager';

// Configuration
const MAX_IMAGES_PER_REQUEST = 10;
const MAX_DIMENSIONS = { width: 4096, height: 4096 };

// Rate limiting (in-memory for demo)
const uploadAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_UPLOADS_PER_MINUTE = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = uploadAttempts.get(ip);
  
  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    uploadAttempts.set(ip, { count: 1, lastAttempt: now });
    return false;
  }
  
  if (record.count >= MAX_UPLOADS_PER_MINUTE) {
    return true;
  }
  
  record.count++;
  record.lastAttempt = now;
  return false;
}

// POST /api/upload - Upload image with advanced processing
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               'unknown';

    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status: 429 }
      );
    }

    // Check authentication
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Use field name "file"' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `File too large: ${sizeMB}MB. Maximum: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate minimum size
    if (file.size < 1024) {
      return NextResponse.json(
        { error: 'File too small. Might be corrupted.' },
        { status: 400 }
      );
    }

    // Convert file to buffer for validation and processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate image header/signature
    const validation = validateImage({
      name: file.name,
      type: file.type,
      size: file.size,
      buffer,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(buffer);
    
    // Validate dimensions
    if (dimensions) {
      const dimValidation = validateDimensions(dimensions, {
        maxWidth: MAX_DIMENSIONS.width,
        maxHeight: MAX_DIMENSIONS.height,
        minWidth: 50,
        minHeight: 50,
      });

      if (!dimValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid dimensions', details: dimValidation.errors },
          { status: 400 }
        );
      }
    }

    // Get storage manager and upload
    const storageManager = await getStorageManager();
    
    // Build upload context
    const context: UploadContext = {
      userId: session.user.id,
      entityType: 'listing',
    };

    // Optional: Get entity ID from form data
    const listingId = formData.get('listingId') as string | null;
    if (listingId) {
      context.entityId = listingId;
    }

    // Perform the upload with full processing pipeline
    const result = await storageManager.uploadImage(buffer, {
      originalName: file.name,
      mimeType: file.type,
      generateThumbnails: true,
      watermark: false, // Can be enabled based on user plan/settings
    }, context);

    // Log performance
    console.log(`[Upload] Completed in ${Date.now() - startTime}ms`, {
      provider: result.provider,
      originalSize: formatBytes(result.originalSize),
      finalSize: formatBytes(result.size),
      compression: `${result.compressionRatio}%`,
      optimized: result.optimized,
      hasThumbnails: !!result.thumbnailUrl,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
      filename: result.path.split('/').pop(),
      size: result.size,
      originalSize: result.originalSize,
      optimized: result.optimized,
      compressionRatio: result.compressionRatio,
      dimensions: result.dimensions,
      thumbnailUrl: result.thumbnailUrl,
      variants: result.variants,
      provider: result.provider,
      message: 'Image uploaded and processed successfully',
    });

  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    
    // Handle specific errors
    const errorMessage = (error as Error).message || 'Internal server error during upload';
    
    if (errorMessage.includes('quota') || errorMessage.includes('507')) {
      return NextResponse.json(
        { error: 'Storage quota exceeded. Please contact administrator.' },
        { status: 507 }
      );
    }
    
    if (errorMessage.includes('Bucket')) {
      return NextResponse.json(
        { error: 'Storage configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/upload - Get upload configuration and status
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get storage manager for health check
    let storageHealth = null;
    let provider = 'supabase';
    
    try {
      const storageManager = await getStorageManager();
      storageHealth = await storageManager.healthCheck();
      provider = storageManager.getProviderName();
    } catch (error) {
      console.warn('[Upload Config] Storage health check failed:', error);
    }

    // Return upload configuration
    return NextResponse.json({
      config: {
        maxFileSize: MAX_IMAGE_SIZE,
        maxFileSizeMB: MAX_IMAGE_SIZE / (1024 * 1024),
        allowedTypes: [...ALLOWED_IMAGE_TYPES],
        maxImagesPerRequest: MAX_IMAGES_PER_REQUEST,
        maxDimensions: MAX_DIMENSIONS,
        supportedFormats: ['JPEG', 'PNG', 'WebP', 'GIF', 'SVG'],
        compressionEnabled: true,
        thumbnailGeneration: true,
        supportedVariants: ['small', 'medium', 'large'],
      },
      storage: {
        provider,
        health: storageHealth,
      },
      user: session?.user ? {
        id: session.user.id,
        canUpload: true,
      } : {
        canUpload: false,
        reason: 'Not authenticated',
      },
      endpoints: {
        upload: '/api/upload',
        method: 'POST',
        fieldName: 'file',
      },
    });

  } catch (error) {
    console.error('[Upload Config] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload config' },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Delete uploaded image and variants
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get path from request body or query
    let path: string | null = null;
    
    const { searchParams } = new URL(request.url);
    path = searchParams.get('path');

    if (!path) {
      try {
        const body = await request.json();
        path = body.path;
      } catch {
        // No body
      }
    }

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required. Provide as query param or in body.' },
        { status: 400 }
      );
    }

    // Security: Ensure user can only delete their own files
    if (!path.startsWith(`${session.user.id}/`)) {
      return NextResponse.json(
        { error: 'Forbidden: Can only delete your own files' },
        { status: 403 }
      );
    }

    // Delete using storage manager (handles variants too)
    const storageManager = await getStorageManager();
    await storageManager.deleteWithVariants(path);

    return NextResponse.json({
      success: true,
      message: 'File and variants deleted successfully',
    });

  } catch (error) {
    console.error('[Upload Delete] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
