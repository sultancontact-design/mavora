/**
 * Mavora Middleware - Professional Authentication & Routing
 * Handles: Auth protection, i18n routing, demo mode
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// Configuration
// ============================================================

const PROTECTED_ROUTES = ['/admin', '/seller/dashboard', '/profile', '/wallet', '/messages'];
const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/admin-login'];

// Demo mode - allows access without real DB
const DEMO_MODE = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';

// ============================================================
// Helper Functions
// ============================================================

function getPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

// Check for demo/admin bypass token
function hasDemoBypass(request: NextRequest): boolean {
  // Check for admin session in cookies
  const hasAdminCookie = request.cookies.get('mavora_admin_session');
  const hasDemoToken = request.cookies.get('mavora_demo_mode');
  
  return !!(hasAdminCookie?.value || hasDemoToken?.value);
}

// Check for auth token (Supabase or custom)
function hasAuthToken(request: NextRequest): boolean {
  const sbToken = request.cookies.get('sb-access-token');
  const customToken = request.cookies.get('mavora_auth_token');
  
  return !!(sbToken?.value || customToken?.value);
}

// ============================================================
// Main Middleware
// ============================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') && !pathname.endsWith('.tsx') && !pathname.endsWith('.ts')
  ) {
    return NextResponse.next();
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    // In demo mode or with bypass token, allow access
    if (DEMO_MODE || hasDemoBypass(request)) {
      const response = NextResponse.next();
      
      // Add demo mode header for components to detect
      response.headers.set('x-demo-mode', 'true');
      response.headers.set('x-admin-bypass', 'true');
      
      return response;
    }
    
    // Check for valid auth token
    if (hasAuthToken(request)) {
      return NextResponse.next();
    }
    
    // No auth - redirect to login (except for API calls)
    if (!pathname.startsWith('/api')) {
      const loginUrl = new URL('/admin-login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle auth routes when already logged in
  if (isAuthRoute(pathname) && (hasAuthToken(request) || hasDemoBypass(request))) {
    // Redirect to home or dashboard if already authenticated
    if (pathname.includes('admin')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Add CORS headers for preview environments
  if (process.env.VERCEL_URL) {
    response.headers.set('Access-Control-Allow-Origin', `https://${process.env.VERCEL_URL}`);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

// ============================================================
// Matcher Config
// ============================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
