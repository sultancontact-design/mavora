import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// ============================================================
// Security Headers
// ============================================================

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

// ============================================================
// POST /api/auth/logout
// Signs out the current user and clears session cookies
// ============================================================

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();

    // Get user info before signing out for logging
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log(`[AUTH] User logging out: ${user.id}`);
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[AUTH] Logout error:', error.message);
      
      const errorResponse = NextResponse.json(
        { error: 'common.error' },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'auth.logout_success',
    });

    // Clear session cookies
    response.cookies.set('sb-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('sb-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return setSecurityHeaders(response);

  } catch (error) {
    console.error('[AUTH] Unexpected logout error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}

// ============================================================
// OPTIONS /api/auth/logout
// Handle CORS preflight
// ============================================================

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
