/**
 * Mavora - CSRF Protection
 * Arabic Marketplace Platform (Morocco)
 * 
 * Cross-Site Request Forgery protection with:
 * - Token generation and validation
 * - Double-submit cookie pattern
 * - Custom header validation
 * - Next.js API route integration
 */

import { cookies } from 'next/headers';

// =============================================================================
// Types / الأنواع
// =============================================================================

interface CSRFConfig {
  /** Cookie name for CSRF token */
  cookieName: string;
  /** Header name to check */
  headerName: string;
  /** Token length in bytes */
  tokenLength: number;
  /** Cookie options */
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
  };
}

// =============================================================================
// Default Configuration / الإعدادات الافتراضية
// =============================================================================

const DEFAULT_CONFIG: CSRFConfig = {
  cookieName: '_csrf_token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
};

// =============================================================================
// Token Generation / توليد الرمز
// =============================================================================

/**
 * Generate a cryptographically random CSRF token
 */
export function generateCSRFToken(length: number = DEFAULT_CONFIG.tokenLength): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Validate CSRF token format
 */
export function isValidCSRFTokenFormat(token: string): boolean {
  // Token should be alphanumeric and correct length
  return /^[A-Za-z0-9]{32,64}$/.test(token);
}

// =============================================================================
// Token Management / إدارة الرموز
// =============================================================================

/**
 * Set CSRF token in cookie
 */
export async function setCSRFCookie(
  token?: string,
  config: Partial<CSRFConfig> = {}
): Promise<string> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const csrfToken = token || generateCSRFToken();
  
  const cookieStore = await cookies();
  cookieStore.set(cfg.cookieName, csrfToken, {
    httpOnly: cfg.cookieOptions.httpOnly,
    secure: cfg.cookieOptions.secure,
    sameSite: cfg.cookieOptions.sameSite,
    path: cfg.cookieOptions.path,
    maxAge: 60 * 60, // 1 hour
  });
  
  return csrfToken;
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFCookie(
  config: Partial<CSRFConfig> = {}
): Promise<string | null> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const cookieStore = await cookies();
  
  return cookieStore.get(cfg.cookieName)?.value || null;
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(
  request: Request,
  config: Partial<CSRFConfig> = {}
): Promise<{ valid: boolean; error?: string }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Get token from cookie
  const cookieToken = await getCSRFCookie(config);
  
  if (!cookieToken) {
    return { valid: false, error: 'Missing CSRF cookie' };
  }
  
  // Get token from header
  const headerToken = request.headers.get(cfg.headerName);
  
  if (!headerToken) {
    return { valid: false, error: `Missing ${cfg.headerName} header` };
  }
  
  // Compare tokens (timing-safe comparison)
  if (!safeCompare(cookieToken, headerToken)) {
    return { valid: false, error: 'Invalid CSRF token' };
  }
  
  return { valid: true };
}

// =============================================================================
// Safe String Comparison / مقارنة نصية آمنة
// =============================================================================

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// =============================================================================
// Middleware / وسيط
// =============================================================================

/**
 * CSRF protection middleware for Next.js API routes
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: Request) {
 *   const csrfResult = await csrfProtection(request);
 *   if (!csrfResult.valid) {
 *     return Response.json({ error: csrfResult.error }, { status: 403 });
 *   }
 *   // Handle request...
 * }
 * ```
 */
export async function csrfProtection(
  request: Request,
  config: Partial<CSRFConfig> = {}
): Promise<{ valid: boolean; error?: string; newToken?: string }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Skip for GET/HEAD/OPTIONS requests (they should be idempotent)
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // Generate and set new token for these requests
    const newToken = await setCSRFCookie(undefined, config);
    return { valid: true, newToken };
  }
  
  // For state-changing methods, validate token
  const result = await validateCSRFToken(request, config);
  
  if (result.valid) {
    // Rotate token after successful validation
    const newToken = await setCSRFCookie(undefined, config);
    return { ...result, newToken };
  }
  
  return result;
}

/**
 * Higher-order function to wrap handlers with CSRF protection
 */
export function withCSRFProtection<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  config: Partial<CSRFConfig> = {}
): T {
  return (async (request: Request, ...args: any[]): Promise<Response> => {
    const result = await csrfProtection(request, config);
    
    if (!result.valid) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: result.error || 'Invalid CSRF token',
          code: 'CSRF_ERROR',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Add new token to response headers
    const response = await handler(request, ...args);
    
    if (result.newToken && response.headers) {
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      newResponse.headers.set('X-New-CSRF-Token', result.newToken);
      return newResponse;
    }

    return response;
  }) as T;
}

// =============================================================================
// Client-Side Utilities / أدوات جانب العميل
// =============================================================================

/**
 * Get CSRF token for client-side requests
 * This reads the token from the cookie (set by server)
 */
export async function getClientCSRFToken(
  config: Partial<CSRFConfig> = {}
): Promise<string | null> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Try to get from meta tag first (for SSR apps)
  const metaTag = document.querySelector(`meta[name="${cfg.cookieName}"]`);
  if (metaTag) {
    return metaTag.getAttribute('content');
  }
  
  // For same-site requests, we can't read httpOnly cookies
  // The server should provide the token via another mechanism
  
  // Check for token in localStorage (if explicitly stored)
  const storedToken = localStorage.getItem('csrf_token');
  if (storedToken) {
    return storedToken;
  }
  
  return null;
}

/**
 * Make a fetch request with CSRF protection
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {},
  csrfConfig: Partial<CSRFConfig> = {}
): Promise<Response> {
  const cfg = { ...DEFAULT_CONFIG, ...csrfConfig };
  
  // Get CSRF token
  const token = await getClientCSRFToken(csrfConfig);
  
  // Add token to headers
  const headers = new Headers(options.headers);
  if (token) {
    headers.set(cfg.headerName, token);
  }
  
  // Ensure credentials are included for cookies
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}

// =============================================================================
// React Hook / خطاف ريكت
// =============================================================================

import { useState, useEffect } from 'react';

/**
 * Hook to get and manage CSRF token on client side
 */
export function useCSRFToken(config?: Partial<CSRFConfig>) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadToken() {
      try {
        const csrfToken = await getClientCSRFToken(config);
        setToken(csrfToken);
      } catch (error) {
        console.error('[CSRF] Failed to load token:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadToken();
  }, [config]);

  /**
   * Make authenticated request with CSRF token
   */
  const fetchWithCSRF = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    return csrfFetch(url, options, config);
  };

  return { token, isLoading, fetchWithCSRF };
}

// =============================================================================
// Export Default / التصدير الافتراضي
// =============================================================================

export default {
  generateCSRFToken,
  validateCSRFToken,
  setCSRFCookie,
  getCSRFCookie,
  csrfProtection,
  withCSRFProtection,
  getClientCSRFToken,
  csrfFetch,
  useCSRFToken,
};
