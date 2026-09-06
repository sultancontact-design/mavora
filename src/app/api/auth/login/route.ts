import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { loginSchema } from '@/lib/validations/auth';
import type { User } from '@/lib/types';
import { dbLogin } from '@/lib/db-auth'; // Database-first auth fallback

// ============================================================
// Rate Limiting (In-memory for demo - use Redis in production)
// ============================================================

const loginAttempts = new Map<string, { 
  count: number; 
  lastAttempt: number; 
  lockedUntil?: number;
}>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes lockout after max attempts

function checkRateLimit(email: string, ip: string): { 
  allowed: boolean; 
  remainingAttempts: number;
  lockoutEnd?: number;
} {
  const key = `${email}:${ip}`;
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    // Reset or create new record
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Check if account is locked
  if (record.lockedUntil && now < record.lockedUntil) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      lockoutEnd: record.lockedUntil 
    };
  }

  // Check if max attempts reached
  if (record.count >= MAX_ATTEMPTS) {
    // Lock the account
    record.lockedUntil = now + LOCKOUT_DURATION;
    record.lastAttempt = now;
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      lockoutEnd: record.lockedUntil 
    };
  }

  // Increment attempt count
  record.count++;
  record.lastAttempt = now;
  
  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS - record.count 
  };
}

function clearLoginAttempts(email: string, ip: string): void {
  const key = `${email}:${ip}`;
  loginAttempts.delete(key);
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
// POST /api/auth/login
// ============================================================

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'unknown';

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
    const validationResult = loginSchema.safeParse(body);
    
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

    const { email, password } = validationResult.data;

    // Check rate limiting BEFORE attempting auth
    const rateLimitResult = checkRateLimit(email, ip);
    
    if (!rateLimitResult.allowed) {
      const errorResponse = NextResponse.json(
        { 
          error: 'auth.too_many_attempts',
          lockoutEnd: rateLimitResult.lockoutEnd,
          retryAfter: rateLimitResult.lockoutEnd 
            ? Math.ceil((rateLimitResult.lockoutEnd - Date.now()) / 1000) 
            : undefined,
        },
        { status: 429 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Try Supabase Auth first
    try {
      const supabase = getSupabaseServerClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        // Supabase Auth succeeded
        clearLoginAttempts(email, ip);

        // Fetch the user's profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, user_roles(role)')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('[AUTH] Profile fetch warning:', profileError.message);
        }

        // Check if user is suspended/banned
        if (profile?.is_suspended) {
          await supabase.auth.signOut();
          
          const errorResponse = NextResponse.json(
            { error: 'auth.account_banned' },
            { status: 403 }
          );
          return setSecurityHeaders(errorResponse);
        }

        // Build user response object
        const user: User = {
          id: data.user.id,
          email: data.user.email ?? '',
          display_name: profile?.display_name ?? data.user.user_metadata?.display_name ?? '',
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

        console.log(`[AUTH] ✅ User logged in via Supabase: ${user.id}`);

        // Create response with session cookie
        const response = NextResponse.json({
          user,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
            expires_at: data.session.expires_at,
          },
        });

        // Set HTTP-only cookies for the session tokens
        response.cookies.set('sb-access-token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: data.session.expires_in,
        });

        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return setSecurityHeaders(response);
      }

      // Log Supabase auth result and continue to DB fallback
      console.log(`[AUTH] Supabase auth result:`, error?.message || 'No error but no user');
    } catch (supabaseError) {
      console.warn('[AUTH] ⚠️ Supabase auth exception, using DB fallback:', supabaseError);
    }

    // FALLBACK: Use Database-First Authentication
    console.log(`[AUTH] 🔄 Trying DB auth fallback for ${email}...`);
    
    let dbResult: DbLoginResult;
    try {
      dbResult = await dbLogin(email, password);
    } catch (dbError) {
      console.error('[AUTH] ❌ DB auth threw exception:', dbError);
      const errorResponse = NextResponse.json(
        { error: 'auth.error_occurred' },
        { status: 500 }
      );
      return setSecurityHeaders(errorResponse);
    }
    
    if (dbResult.success && dbResult.user) {
      console.log(`[AUTH] ✅ DB auth successful for ${email} via ${dbResult.authMethod || 'database'}`);
      
      // Clear failed attempts on successful login
      clearLoginAttempts(email, ip);
      
      // Return database-authenticated user
      const response = NextResponse.json({
        user: dbResult.user,
        session: dbResult.session,
        authMethod: dbResult.authMethod || 'database',
      });
      
      return setSecurityHeaders(response);
    }
    
    // Both methods failed
    console.error(`[AUTH] Login failed for ${email}`);
    
    const errorResponse = NextResponse.json(
      { 
        error: 'auth.invalid_credentials',
        remainingAttempts: rateLimitResult.remainingAttempts - 1,
      },
      { status: 401 }
    );
    return setSecurityHeaders(errorResponse);

  } catch (error) {
    console.error('[AUTH] Unexpected login error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}
