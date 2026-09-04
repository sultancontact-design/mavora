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

// Configuration
const BUCKET_NAME = 'listing-images';
const MAX_IMAGES_PER_REQUEST = 10;
const MAX_DIMENSIONS = { width: 4096, height: 4096 };
const COMPRESSION_QUALITY = 80;

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

// POST /api/upload - Upload image to Supabase Storage
export async function POST(request: NextRequest) {
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

    // Generate unique filename
    const sanitizedName = validation.sanitizedFilename || file.name;
    const filename = generateUniqueFilename(sanitizedName);
    
    // Create storage path: /user-id/year/month/filename
    const now = new Date();
    const path = `${session.user.id}/${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${filename}`;

    // Try to compress/optimize image if sharp is available
    let finalBuffer = buffer;
    let optimized = false;

    try {
      const sharp = await import('sharp').catch(() => null);
      
      if (sharp && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
        let transformer = sharp.default(buffer);
        
        // Resize if too large (keep aspect ratio)
        if (dimensions && (dimensions.width > 1920 || dimensions.height > 1920)) {
          transformer = transformer.resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
        
        // Convert to appropriate format and compress
        if (file.type === 'image/png') {
          // Convert large PNGs to JPEG for better compression (unless transparent)
          if (file.size > 1024 * 1024) { // > 1MB
            transformer = transformer.jpeg({ quality: COMPRESSION_QUALITY });
          } else {
            transformer = transformer.png({ compressionLevel: 9 });
          }
        } else if (file.type === 'image/jpeg') {
          transformer = transformer.jpeg({ quality: COMPRESSION_QUALITY, mozjpeg: true });
        } else if (file.type === 'image/webp') {
          transformer = transformer.webp({ quality: COMPRESSION_QUALITY });
        }
        
        const compressedBuffer = await transformer.toBuffer();
        
        // Convert to regular Buffer for comparison
        const compressed = Buffer.from(compressedBuffer);
        
        // Only use compressed version if it's smaller
        if (compressed.length < buffer.length * 0.95) { // At least 5% savings
          finalBuffer = compressed;
          optimized = true;
        }
      }
    } catch (error) {
      console.warn('[Upload] Image optimization failed, using original:', error);
      // Continue with original buffer
    }

    // Upload to Supabase Storage
    const adminClient = getSupabaseAdminClient();
    
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(path, finalBuffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload] Supabase storage error:', uploadError);
      
      // Handle specific errors
      if (uploadError.message.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not found. Please contact administrator.' },
          { status: 500 }
        );
      }
      
      if (uploadError.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Storage quota exceeded. Please contact administrator.' },
          { status: 507 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to upload file. Please try again.' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    // Return success response
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uploadData?.path,
      filename,
      size: finalBuffer.length,
      originalSize: file.size,
      optimized,
      dimensions,
      message: 'Image uploaded successfully',
    });

  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error during upload' },
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

    // Return upload configuration
    return NextResponse.json({
      config: {
        maxFileSize: MAX_IMAGE_SIZE,
        maxFileSizeMB: MAX_IMAGE_SIZE / (1024 * 1024),
        allowedTypes: ALLOWED_IMAGE_TYPES,
        maxImagesPerRequest: MAX_IMAGES_PER_REQUEST,
        maxDimensions: MAX_DIMENSIONS,
        supportedFormats: ['JPEG', 'PNG', 'WebP', 'GIF', 'SVG'],
        compressionEnabled: true,
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

// DELETE /api/upload - Delete uploaded image
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();

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

    // Delete from storage
    const { error } = await adminClient.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('[Upload Delete] Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('[Upload Delete] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
