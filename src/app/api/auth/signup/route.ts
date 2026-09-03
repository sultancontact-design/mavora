import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase';
import { signupSchema, getAuthErrorMessage } from '@/lib/validations/auth';
import { dbSignup } from '@/lib/db-auth'; // Database-first auth fallback
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

    console.log('[AUTH] Signup request body:', JSON.stringify(body));

    // Validate input with Zod - handle potential undefined fields gracefully
    const safeBody = {
      email: typeof body === 'object' && body !== null && 'email' in body ? (body as Record<string, unknown>).email : '',
      password: typeof body === 'object' && body !== null && 'password' in body ? (body as Record<string, unknown>).password : '',
      confirmPassword: typeof body === 'object' && body !== null && 'confirmPassword' in body ? (body as Record<string, unknown>).confirmPassword : '',
      display_name: typeof body === 'object' && body !== null && 'display_name' in body ? (body as Record<string, unknown>).display_name : '',
      phone: typeof body === 'object' && body !== null && 'phone' in body ? (body as Record<string, unknown>).phone : undefined,
    };

    const validationResult = signupSchema.safeParse(safeBody);
    
    if (!validationResult.success) {
      console.log('[AUTH] Validation error:', JSON.stringify(validationResult.error.issues));
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

    // Try Supabase Auth first
    try {
      const supabase = getSupabaseServerClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            display_name,
            phone: phone || null,
          },
          emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        },
      });

      if (!error && data.user) {
        // Supabase Auth succeeded - create profile and return
        const adminSupabase = getSupabaseAdminClient();
        
        await adminSupabase.from('profiles').upsert({
          id: data.user.id,
          display_name,
          email: data.user.email,
          phone: phone || null,
          is_verified: data.user.email_confirmed_at ? true : false,
          is_suspended: false,
        }, {
          onConflict: 'id',
        }).catch((e) => console.warn('[AUTH] Profile upsert warning:', e.message));

        const { data: profile } = await supabase
          .from('profiles')
          .select('*, user_roles(role)')
          .eq('id', data.user.id)
          .single();

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

        console.log(`[AUTH] New user registered via Supabase: ${user.id}`);

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
      }

      // If Supabase returned an error like "already registered", return it
      if (error && (
        error.message.includes('already registered') || 
        error.message.includes('already been registered')
      )) {
        const errorResponse = NextResponse.json(
          { error: 'auth.email_taken' },
          { status: 409 }
        );
        return setSecurityHeaders(errorResponse);
      }

      // For other Supabase errors, fall through to DB auth
      console.log('[AUTH] Supabase signup failed, trying DB fallback:', error?.message);
    } catch (supabaseError) {
      console.warn('[AUTH] Supabase auth exception, using DB fallback:', supabaseError);
    }

    // FALLBACK: Use Database-First Authentication
    console.log('[AUTH] Using database-first signup for:', email);
    
    const dbResult = await dbSignup(email, password, display_name, phone);
    
    if (dbResult.success && dbResult.user) {
      console.log(`[AUTH] User registered via DB auth: ${dbResult.user.id}`);
      
      const successResponse = NextResponse.json({
        user: dbResult.user,
        session: dbResult.session,
        message: 'auth.signup_success',
        emailConfirmationRequired: false,
        authMethod: 'database',
      }, { status: 201 });

      return setSecurityHeaders(successResponse);
    }
    
    // Both methods failed
    console.error(`[AUTH] Signup failed for ${email}:`, dbResult.error);
    
    const errorResponse = NextResponse.json(
      { error: dbResult.error ?? 'auth.signup_failed' },
      { status: 400 }
    );
    return setSecurityHeaders(errorResponse);

  } catch (error) {
    console.error('[AUTH] Unexpected signup error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}
