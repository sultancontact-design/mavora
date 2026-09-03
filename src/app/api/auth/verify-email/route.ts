import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase';
import { verifyEmailSchema, getAuthErrorMessage } from '@/lib/validations/auth';

// ============================================================
// Security Headers
// ============================================================

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

// ============================================================
// POST /api/auth/verify-email
// Verifies user's email address
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
    const validationResult = verifyEmailSchema.safeParse(body);
    
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

    const { token, email } = validationResult.data;

    const supabase = getSupabaseServerClient();
    const adminSupabase = getSupabaseAdminClient();

    // Method 1: Verify using Supabase's built-in OTP verification
    if (token && !email) {
      // Verify OTP token (from magic link or email verification)
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type: 'email',
        email: '', // Will be validated from token
      });

      if (error) {
        console.error('[AUTH] Email verification error:', error.message);
        
        let errorMessage = 'auth.invalid_token';
        
        if (error.message.includes('expired')) {
          errorMessage = 'auth.token_expired';
        }

        const errorResponse = NextResponse.json(
          { error: errorMessage, details: error.message },
          { status: 400 }
        );
        return setSecurityHeaders(errorResponse);
      }

      if (!data.user) {
        const errorResponse = NextResponse.json(
          { error: 'common.error' },
          { status: 500 }
        );
        return setSecurityHeaders(errorResponse);
      }

      // Update profile to mark as verified
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', data.user.id);

      if (updateError) {
        console.warn('[AUTH] Profile verification update warning:', updateError.message);
        // Don't fail - the main verification succeeded
      }

      console.log(`[AUTH] Email verified for user: ${data.user.id}`);

      const response = NextResponse.json({
        success: true,
        message: 'auth.email_verified',
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed: data.user.email_confirmed_at !== null,
        },
      });

      return setSecurityHeaders(response);
    }

    // Method 2: Resend verification email
    if (email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('[AUTH] Resend verification error:', error.message);

        let errorMessage = 'common.error';
        let status = 400;

        if (error.message.includes('rate limit')) {
          errorMessage = 'auth.too_many_attempts';
          status = 429;
        }

        const errorResponse = NextResponse.json(
          { error: errorMessage },
          { status }
        );
        return setSecurityHeaders(errorResponse);
      }

      console.log(`[AUTH] Verification email resent to: ${email}`);

      const response = NextResponse.json({
        success: true,
        message: 'auth.verification_email_sent',
      });

      return setSecurityHeaders(response);
    }

    // Neither token nor email provided
    const errorResponse = NextResponse.json(
      { error: 'auth.token_required' },
      { status: 400 }
    );
    return setSecurityHeaders(errorResponse);

  } catch (error) {
    console.error('[AUTH] Unexpected verify email error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}

// ============================================================
// GET /api/auth/verify-email
// Check email verification status for current user
// ============================================================

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse = NextResponse.json(
        { error: 'common.unauthorized' },
        { status: 401 }
      );
      return setSecurityHeaders(errorResponse);
    }

    const response = NextResponse.json({
      isVerified: user.email_confirmed_at !== null,
      email: user.email,
      verifiedAt: user.email_confirmed_at,
    });

    return setSecurityHeaders(response);

  } catch (error) {
    console.error('[AUTH] Check verification status error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}
