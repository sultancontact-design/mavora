import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { User } from '@/lib/types';

// ============================================================
// Security Headers
// ============================================================

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevent caching of session data
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

// ============================================================
// GET /api/auth/session
// Returns the current user session and profile if authenticated
// ============================================================

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[AUTH] Session error:', sessionError.message);
      const errorResponse = NextResponse.json(
        { user: null, profile: null, error: 'common.error' },
        { status: 200 } // Return 200 with null user for client-side handling
      );
      return setSecurityHeaders(errorResponse);
    }

    // No active session
    if (!session) {
      const response = NextResponse.json({
        user: null,
        profile: null,
        isAuthenticated: false,
      });
      return setSecurityHeaders(response);
    }

    const authUser = session.user;

    // Fetch the user's profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.warn('[AUTH] Profile fetch warning:', profileError.message);
      
      // Return session without profile rather than failing
      const basicUser: User = {
        id: authUser.id,
        email: authUser.email ?? '',
        display_name: authUser.user_metadata?.display_name ?? 
                      authUser.email?.split('@')[0] ?? 
                      'User',
        is_verified: authUser.email_confirmed_at ? true : false,
        is_suspended: false,
        role: 'user',
        created_at: authUser.created_at,
      };

      const response = NextResponse.json({
        user: basicUser,
        profile: null,
        isAuthenticated: true,
        session: {
          expiresAt: session.expires_at,
        },
      });
      return setSecurityHeaders(response);
    }

    if (!profile) {
      const response = NextResponse.json({
        user: null,
        profile: null,
        isAuthenticated: false,
      });
      return setSecurityHeaders(response);
    }

    // Build full user object
    const user: User = {
      id: authUser.id,
      email: authUser.email ?? '',
      display_name: profile.display_name ?? authUser.user_metadata?.display_name ?? '',
      phone: profile.phone ?? undefined,
      avatar_url: profile.avatar_url ?? undefined,
      bio: profile.bio ?? undefined,
      country_id: profile.country_id ?? undefined,
      city_id: profile.city_id ?? undefined,
      is_verified: profile.is_verified ?? false,
      is_suspended: profile.is_suspended ?? false,
      role: profile.user_roles?.role ?? 'user',
      created_at: profile.created_at ?? authUser.created_at,
    };

    const response = NextResponse.json({
      user,
      profile: {
        ...profile,
        // Don't expose internal fields
        passwordHash: undefined,
      },
      isAuthenticated: true,
      session: {
        expiresAt: session.expires_at,
      },
    });

    return setSecurityHeaders(response);

  } catch (error) {
    console.error('[AUTH] Unexpected session error:', error);
    
    const errorResponse = NextResponse.json(
      { user: null, profile: null, isAuthenticated: false, error: 'common.error' },
      { status: 200 }
    );
    return setSecurityHeaders(errorResponse);
  }
}
