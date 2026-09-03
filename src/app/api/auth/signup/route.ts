import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase';
import { signupSchema, getAuthErrorMessage } from '@/lib/validations/auth';
import type { User } from '@/lib/types';

// ============================================================
// Rate Limiting (In-memory for demo - use Redis in production)
// ============================================================

const signupAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = signupAttempts.get(ip);
  
  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    signupAttempts.set(ip, { count: 1, lastAttempt: now });
    return false;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return true;
  }
  
  record.count++;
  record.lastAttempt = now;
  return false;
}

// ============================================================
// Security Headers
// ============================================================

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "default-src 'self'");
  return response;
}

// ============================================================
// POST /api/auth/signup
// ============================================================

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'unknown';

  // Check rate limiting
  if (isRateLimited(ip)) {
    const errorResponse = NextResponse.json(
      { error: 'auth.too_many_attempts' },
      { status: 429 }
    );
    return setSecurityHeaders(errorResponse);
  }

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
    const validationResult = signupSchema.safeParse(body);
    
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

    const { email, password, display_name, phone } = validationResult.data;

    // Use Supabase client for auth
    const supabase = getSupabaseServerClient();

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          display_name,
          phone: phone || null,
        },
        // Email redirect URL for verification
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[AUTH] Signup error:', error.message);
      
      let errorMessage = error.message;
      
      // Map Supabase errors to user-friendly messages
      if (error.message.includes('already registered') || 
          error.message.includes('already been registered')) {
        errorMessage = 'auth.email_taken';
      } else if (
        error.message.includes('Password') ||
        error.message.includes('password') ||
        error.message.includes('weak')
      ) {
        errorMessage = 'auth.weak_password';
      }

      const status = error.status ?? 400;
      const errorResponse = NextResponse.json(
        { error: errorMessage },
        { status }
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

    // Create or update the profile in the profiles table
    const adminSupabase = getSupabaseAdminClient();
    
    const { error: profileError } = await adminSupabase.from('profiles').upsert({
      id: data.user.id,
      display_name,
      email: data.user.email,
      phone: phone || null,
      is_verified: data.user.email_confirmed_at ? true : false,
      is_suspended: false,
    }, {
      onConflict: 'id',
    });

    if (profileError) {
      // Log but don't fail — the trigger might have already created the profile
      console.warn('[AUTH] Profile upsert warning:', profileError.message);
    }

    // Fetch the created profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', data.user.id)
      .single();

    // Build user response object (without sensitive data)
    const user: User = {
      id: data.user.id,
      email: data.user.email ?? '',
      display_name: profile?.display_name ?? display_name,
      phone: profile?.phone ?? undefined,
      avatar_url: profile?.avatar_url ?? undefined,
      bio: profile?.bio ?? undefined,
      country_id: profile?.country_id ?? undefined,
      city_id: profile?.city_id ?? undefined,
      is_verified: profile?.is_verified ?? false,
      is_suspended: profile?.is_suspended ?? false,
      role: profile?.user_roles?.role ?? 'user',
      created_at: profile?.created_at ?? data.user.created_at,
    };

    // Log successful signup (without sensitive data)
    console.log(`[AUTH] New user registered: ${user.id} (${user.email})`);

    const successResponse = NextResponse.json({
      user,
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
      } : null,
      message: data.user.email_confirmed_at ? 'auth.signup_success' : 'auth.verify_email_sent',
      emailConfirmationRequired: !data.user.email_confirmed_at,
    }, { status: 201 });

    return setSecurityHeaders(successResponse);

  } catch (error) {
    console.error('[AUTH] Unexpected signup error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}
