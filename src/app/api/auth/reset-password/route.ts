// ============================================================
// 🔐 Password Reset API Endpoint
// Handles: POST (request reset) & PUT (confirm reset)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email';

// ============================================================
// Rate Limiting Configuration
// ============================================================

const resetAttempts = new Map<string, {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}>();

const RATE_LIMITS = {
  // Max requests per window
  maxRequests: 5,
  // Time window in milliseconds (1 hour)
  windowMs: 60 * 60 * 1000,
  // Lockout duration if max exceeded (1 hour)
  lockoutDuration: 60 * 60 * 1000,
};

/**
 * Check and update rate limit for password reset requests
 */
function checkRateLimit(email: string, ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutEnd?: number;
  retryAfter?: number;
} {
  const key = `${email}:${ip}`;
  const now = Date.now();
  const record = resetAttempts.get(key);

  // No previous record or window expired
  if (!record || now - record.lastAttempt > RATE_LIMITS.windowMs) {
    resetAttempts.set(key, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: RATE_LIMITS.maxRequests - 1 };
  }

  // Check if currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutEnd: record.lockedUntil,
      retryAfter: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Check if max attempts reached
  if (record.count >= RATE_LIMITS.maxRequests) {
    // Apply lockout
    record.lockedUntil = now + RATE_LIMITS.lockoutDuration;
    record.lastAttempt = now;
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutEnd: record.lockedUntil,
      retryAfter: Math.ceil(RATE_LIMITS.lockoutDuration / 1000),
    };
  }

  // Increment counter
  record.count++;
  record.lastAttempt = now;

  return {
    allowed: true,
    remainingAttempts: RATE_LIMITS.maxRequests - record.count,
  };
}

/**
 * Clear rate limit record (on successful reset)
 */
function clearRateLimit(email: string, ip: string): void {
  const key = `${email}:${ip}`;
  resetAttempts.delete(key);
}

// ============================================================
// Security Headers Helper
// ============================================================

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "default-src 'self'");
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}

// ============================================================
// Validation Schemas
// ============================================================

const forgotPasswordSchema = {
  email: (value: string) => {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'auth.email_required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'auth.invalid_email' };
    }
    return { valid: true };
  },
};

const resetPasswordSchema = {
  password: (value: string) => {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'auth.password_required' };
    }
    if (value.length < 8) {
      return { valid: false, error: 'auth.password_too_short' };
    }
    // Check for at least one uppercase, one lowercase, one number
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
      return { valid: false, error: 'auth.password_weak' };
    }
    return { valid: true };
  },
  confirmPassword: (value: string, password: string) => {
    if (value !== password) {
      return { valid: false, error: 'auth.password_mismatch' };
    }
    return { valid: true };
  },
};

// ============================================================
// POST /api/auth/reset-password
// Request a password reset link
// ============================================================

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'unknown';

  try {
    // Parse request body
    let body: { email?: string; locale?: string };
    try {
      body = await request.json();
    } catch {
      const errorResponse = NextResponse.json(
        { error: 'common.invalid_request' },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    const { email, locale = 'ar' } = body;

    // Validate email
    const emailValidation = forgotPasswordSchema.email(email ?? '');
    if (!emailValidation.valid) {
      const errorResponse = NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Check rate limiting
    const rateLimitResult = checkRateLimit(email!, ip);
    
    if (!rateLimitResult.allowed) {
      const errorResponse = NextResponse.json(
        {
          error: 'auth.too_many_reset_attempts',
          retryAfter: rateLimitResult.retryAfter,
          lockoutEnd: rateLimitResult.lockoutEnd,
        },
        { status: 429 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Attempt to send password reset email
    const emailResult = await sendPasswordResetEmail(
      email!, 
      locale as 'ar' | 'en'
    );

    if (!emailResult.success) {
      console.error('[RESET-PASSWORD] Failed to send email:', emailResult.error);
      
      const errorResponse = NextResponse.json(
        { error: 'auth.failed_to_send_email' },
        { status: 500 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Log the attempt (for audit)
    console.log(`[RESET-PASSWORD] Password reset requested for: ${email} from IP: ${ip}`);

    // Always return success for security (prevents email enumeration)
    // Even if user doesn't exist, we show success message
    const successResponse = NextResponse.json({
      success: true,
      message: locale === 'ar' 
        ? 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة مع تعليمات إعادة التعيين.'
        : 'If the email is registered, you will receive reset instructions.',
      rateLimited: rateLimitResult.remainingAttempts <= 1,
      remainingAttempts: rateLimitResult.remainingAttempts,
    });

    return setSecurityHeaders(successResponse);

  } catch (error) {
    console.error('[RESET-PASSWORD] Unexpected error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}

// ============================================================
// PUT /api/auth/reset-password
// Confirm password reset with new password
// ============================================================

export async function PUT(request: NextRequest) {
  // Get client IP
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'unknown';

  try {
    // Parse request body
    let body: { password?: string; confirmPassword?: string };
    try {
      body = await request.json();
    } catch {
      const errorResponse = NextResponse.json(
        { error: 'common.invalid_request' },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    const { password, confirmPassword } = body;

    // Validate password
    const passwordValidation = resetPasswordSchema.password(password ?? '');
    if (!passwordValidation.valid) {
      const errorResponse = NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Validate password match
    const confirmValidation = resetPasswordSchema.confirmPassword(
      confirmPassword ?? '', 
      password ?? ''
    );
    if (!confirmValidation.valid) {
      const errorResponse = NextResponse.json(
        { error: confirmValidation.error },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Get Supabase client
    const supabase = getSupabaseServerClient();

    // Update user's password using Supabase Auth
    // The user should have a valid session from the reset link
    const { data, error } = await supabase.auth.updateUser({
      password: password!,
    });

    if (error) {
      console.error('[RESET-PASSWORD] Error updating password:', error.message);

      // Handle specific errors
      if (error.message.includes('token') || error.message.includes('expired')) {
        const errorResponse = NextResponse.json(
          { 
            error: 'auth.reset_token_expired',
            message: 'The reset token has expired or is invalid. Please request a new one.',
          },
          { status: 401 }
        );
        return setSecurityHeaders(errorResponse);
      }

      const errorResponse = NextResponse.json(
        { error: 'auth.failed_to_reset_password' },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Password updated successfully
    console.log(`[RESET-PASSWORD] Password updated successfully for user: ${data.user?.id}`);

    // Clear any rate limits for this user's email
    if (data.user?.email) {
      clearRateLimit(data.user.email, ip);
    }

    // Return success response
    const successResponse = NextResponse.json({
      success: true,
      message: 'Password has been reset successfully.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });

    return setSecurityHeaders(successResponse);

  } catch (error) {
    console.error('[RESET-PASSWORD] Unexpected error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}

// ============================================================
// GET /api/auth/reset-password
// Check if a reset token is valid (optional endpoint)
// ============================================================

export async function GET(request: NextRequest) {
  try {
    // Get the current session to verify user is authenticated via reset token
    const supabase = getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      const errorResponse = NextResponse.json(
        { 
          valid: false, 
          error: 'auth.no_session',
          message: 'No valid session found. Please request a new reset link.',
        },
        { status: 401 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // User has a valid session (from reset link)
    const successResponse = NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });

    return setSecurityHeaders(successResponse);

  } catch (error) {
    console.error('[RESET-PASSWORD] Error checking session:', error);
    
    const errorResponse = NextResponse.json(
      { valid: false, error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}
