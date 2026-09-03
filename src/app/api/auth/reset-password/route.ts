import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { 
  resetPasswordRequestSchema, 
  resetPasswordConfirmSchema,
  getAuthErrorMessage 
} from '@/lib/validations/auth';

// ============================================================
// Rate Limiting
// ============================================================

const resetAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 3;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const record = resetAttempts.get(email);
  
  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    resetAttempts.set(email, { count: 1, lastAttempt: now });
    return false;
  }
  
  return record.count >= MAX_ATTEMPTS;
}

// ============================================================
// Security Headers
// ============================================================

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

// ============================================================
// POST /api/auth/reset-password (Request)
// Sends a password reset email to the user
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse = NextResponse.json(
        { error: 'common.error' },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Validate input with Zod
    const validationResult = resetPasswordRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message ?? 'common.error';
      
      const errorResponse = NextResponse.json(
        { 
          error: firstError,
          details: validationResult.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    const { email } = validationResult.data;

    // Check rate limiting
    if (isRateLimited(email)) {
      console.warn(`[AUTH] Rate limited password reset attempt for: ${email}`);
      
      // Still return success to prevent email enumeration
      // But with a different message for the actual user if they check their email
      const response = NextResponse.json({
        success: true,
        message: 'auth.reset_email_sent',
        // Include a hint that they should try later
        rateLimited: true,
      });
      return setSecurityHeaders(response);
    }

    const supabase = getSupabaseServerClient();

    // Request password reset from Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/auth/reset-password/confirm`,
    });

    if (error) {
      console.error('[AUTH] Password reset request error:', error.message);
      
      // For security, don't reveal if email exists or not
      // Always return success unless it's a system error
      if (!error.message.includes('rate limit')) {
        const response = NextResponse.json({
          success: true,
          message: 'auth.reset_email_sent',
        });
        return setSecurityHeaders(response);
      }
      
      const errorResponse = NextResponse.json(
        { error: 'auth.too_many_attempts' },
        { status: 429 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Log the reset request (without sensitive data)
    console.log(`[AUTH] Password reset requested for: ${email}`);

    const response = NextResponse.json({
      success: true,
      message: 'auth.reset_email_sent',
    });

    return setSecurityHeaders(response);

  } catch (error) {
    console.error('[AUTH] Unexpected reset password error:', error);
    
    // For security, still return success
    const response = NextResponse.json({
      success: true,
      message: 'auth.reset_email_sent',
    });
    return setSecurityHeaders(response);
  }
}

// ============================================================
// PUT /api/auth/reset-password (Confirm)
// Confirms password reset with new password
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse = NextResponse.json(
        { error: 'common.error' },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Validate input with Zod
    const validationResult = resetPasswordConfirmSchema.safeParse(body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message ?? 'common.error';
      
      const errorResponse = NextResponse.json(
        { 
          error: firstError,
          details: validationResult.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    const { password } = validationResult.data;

    const supabase = getSupabaseServerClient();

    // Update user's password using Supabase
    // This works when the user has a valid recovery token in their session
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('[AUTH] Password reset confirm error:', error.message);
      
      let errorMessage = 'common.error';
      let status = 400;

      if (error.message.includes('token') || error.message.includes('expired')) {
        errorMessage = 'auth.invalid_token';
        status = 400;
      }

      const errorResponse = NextResponse.json(
        { error: errorMessage },
        { status }
      );
      return setSecurityHeaders(errorResponse);
    }

    console.log(`[AUTH] Password reset successfully for user: ${data.user?.id}`);

    const response = NextResponse.json({
      success: true,
      message: 'auth.password_changed',
    });

    return setSecurityHeaders(response);

  } catch (error) {
    console.error('[AUTH] Unexpected reset password confirm error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}
