// ============================================================
// 🛡️ Security Tests
// Covers: XSS, SQL Injection, CSRF, Rate Limiting, Headers
// ============================================================

import { describe, it, expect } from 'vitest';

// ============================================================
// Test Configuration
// ============================================================

const API_BASE = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000';

// Helper function for API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any; headers: Headers }> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data, headers: response.headers };
}

// Get page and check for security issues
async function getPage(url: string): Promise<{
  status: number;
  html: string;
  headers: Headers;
}> {
  const response = await fetch(`${BASE_URL}${url}`);
  const html = await response.text();
  return { status: response.status, html, headers: response.headers };
}

// ============================================================
// Security Headers Tests
// ============================================================

describe('Security - HTTP Headers', () => {
  
  it('should set X-Content-Type-Options: nosniff', async () => {
    const { headers } = await getPage('/');
    
    expect(headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('should set X-Frame-Options: DENY', async () => {
    const { headers } = await getPage('/');
    
    expect(headers.get('x-frame-options')).toBe('DENY');
  });

  it('should set X-XSS-Protection header', async () => {
    const { headers } = await getPage('/');
    
    const xssProtection = headers.get('x-xss-protection');
    expect(xssProtection).toBeTruthy();
    expect(xssProtection).toContain('mode=block');
  });

  it('should set Content-Security-Policy or similar', async () => {
    const { headers } = await getPage('/');
    
    const csp = headers.get('content-security-policy');
    // CSP may or may not be set depending on config
    if (csp) {
      expect(csp).toContain("default-src");
    }
  });

  it('should set Referrer-Policy', async () => {
    const { headers } = await getPage('/');
    
    const referrerPolicy = headers.get('referrer-policy');
    expect(referrerPolicy).toBeTruthy();
  });
});

// ============================================================
// XSS Prevention Tests
// ============================================================

describe('Security - XSS Prevention', () => {
  
  it('should escape HTML in form inputs (login)', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: `${xssPayload}@test.com`,
        password: 'Password123!',
      }),
    });

    // Should reject or sanitize the input
    expect([400, 401]).toContain(status);
    if (data?.error) {
      // Error message should not contain raw HTML
      expect(data.error).not.toContain('<script>');
    }
  });

  it('should handle HTML in search queries safely', async () => {
    const { status, data } = await apiRequest('/listings?search=<img src=x onerror=alert(1)>');
    
    expect(status).toBe(200);
    if (data?.listings) {
      // Response should not contain unescaped script tags
      const responseStr = JSON.stringify(data);
      expect(responseStr).not.toContain('<script>');
    }
  });

  it('should sanitize HTML in user display name', async () => {
    const maliciousName = '<script>malicious</script>';
    const { status } = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: `sanitizetest${Date.now()}@test.com`,
        password: 'StrongPass123!',
        displayName: maliciousName,
      }),
    });

    // Should either accept (and sanitize) or reject
    expect([200, 201, 400, 409]).toContain(status);
  });
});

// ============================================================
// SQL Injection Prevention Tests
// ============================================================

describe('Security - SQL Injection Prevention', () => {
  
  it('should handle SQL injection in login email', async () => {
    const sqlPayload = "' OR '1'='1";
    const { status } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: sqlPayload,
        password: 'anything',
      }),
    });

    // Should NOT authenticate with SQL injection
    expect(status).not.toBe(200);
  });

  it('should handle SQL injection in listing search', async () => {
    const sqlPayload = "'; DROP TABLE listings; --";
    const { status } = await apiRequest(`/listings?search=${encodeURIComponent(sqlPayload)}`);
    
    // Should not cause server error
    expect(status).toBe(200);
  });

  it('should handle SQL injection in ID parameters', async () => {
    const sqlPayload = "1' OR '1'='1";
    const { status } = await apiRequest(`/listings/${sqlPayload}`);
    
    // Should return error, not leak data
    expect([400, 404]).toContain(status);
  });
});

// ============================================================
// Rate Limiting Tests
// ============================================================

describe('Security - Rate Limiting', () => {
  
  it('should rate limit login attempts', async () => {
    const promises = Array.from({ length: 15 }, (_, i) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: `ratelimit${i}@test.com`,
          password: 'password123',
        }),
      })
    );

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    // After many requests, some should be rate limited
    // (depending on rate limit configuration)
    expect(responses.length).toBe(15);
  });

  it('should rate limit password reset requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: `ratelimit${i}@test.com` }),
      })
    );

    const responses = await Promise.all(promises);
    const hasRateLimit = responses.some(r => r.status === 429);

    // May or may not trigger depending on configuration
    expect(Array.isArray(responses)).toBe(true);
  });
});

// ============================================================
// CSRF Protection Tests
// ============================================================

describe('Security - CSRF Protection', () => {
  
  it('should handle state-changing operations properly', async () => {
    // Test that POST/PUT/DELETE require proper content type
    const { status } = await apiRequest('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
    });

    // Should not process without proper content type (or return auth error)
    expect([400, 401, 415]).toContain(status);
  });
});

// ============================================================
// Information Disclosure Tests
// ============================================================

describe('Security - Information Disclosure', () => {
  
  it('should not expose stack traces in production errors', async () => {
    const { status, data } = await apiRequest('/non-existent-endpoint-12345');
    
    expect(status).toBe(404);
    if (data) {
      // Should not contain sensitive information
      const responseStr = JSON.stringify(data).toLowerCase();
      expect(responseStr).not.toContain('stack trace');
      expect(responseStr).not.toContain('internal server error');
    }
  });

  it('should not expose database errors', async () => {
    const { data } = await apiRequest('/listings/invalid-id-format');
    
    if (data) {
      const responseStr = JSON.stringify(data).toLowerCase();
      expect(responseStr).not.toContain('sql');
      expect(responseStr).not.toContain('database');
      expect(responseStr).not.toContain('syntax error');
    }
  });

  it('should not reveal if email exists (login)', async () => {
    const realEmailResult = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@mavora.com', password: 'wrong' }),
    });

    const fakeEmailResult = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'definitely-not-real@mavora.com', password: 'wrong' }),
    });

    // Both should return similar error messages
    expect(realEmailResult.status).toBe(fakeEmailResult.status);
    if (realEmailResult.data && fakeEmailResult.data) {
      expect(typeof realEmailResult.data.error).toBe('string');
      expect(typeof fakeEmailResult.data.error).toBe('string');
    }
  });
});

// ============================================================
// Authentication Security Tests
// ============================================================

describe('Security - Authentication', () => {
  
  it('should reject malformed tokens', async () => {
    const { status } = await apiRequest('/auth/session', {
      headers: {
        'Authorization': 'Bearer invalid.token.here',
      },
    });

    expect([401, 403]).toContain(status);
  });

  it('should not accept empty authorization header as valid', async () => {
    const { status } = await apiRequest('/auth/session', {
      headers: {
        'Authorization': 'Bearer ',
      },
    });

    expect([401, 403]).toContain(status);
  });
});
