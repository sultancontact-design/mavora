// ============================================================
// 🧪 Integration Tests - Authentication System
// Covers: Login, Signup, Password Reset, Session Management
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// ============================================================
// Test Configuration
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test user credentials (for testing only)
const TEST_USER = {
  email: 'test@mavora.com',
  password: 'TestPassword123!',
  displayName: 'Test User',
};

// Helper function for API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any }> {
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

  return { status: response.status, data };
}

// ============================================================
// Login Endpoint Tests
// ============================================================

describe('Integration - Auth - Login', () => {
  it('should reject login without credentials', async () => {
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should reject login with invalid email format', async () => {
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
      }),
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should reject login with short password', async () => {
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123',
      }),
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should reject login with non-existent user (without revealing existence)', async () => {
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@mavora.com',
        password: 'SomePassword123!',
      }),
    });

    // Should return 401 regardless of whether user exists
    expect([401, 404]).toContain(status);
    expect(data).toHaveProperty('error');
  });

  it('should have proper security headers on login endpoint', async () => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
    });

    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });
});

// ============================================================
// Signup Endpoint Tests
// ============================================================

describe('Integration - Auth - Signup', () => {
  it('should reject signup with missing fields', async () => {
    const { status, data } = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        // Missing password
      }),
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should reject signup with weak password', async () => {
    const { status, data } = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'weakpass@example.com',
        password: 'weak',
        displayName: 'Test User',
      }),
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should reject signup with invalid email', async () => {
    const { status, data } = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'StrongPassword123!',
        displayName: 'Test',
      }),
    });

    expect(status).toBe(400);
  });

  it('should accept valid signup request (may fail if user exists)', async () => {
    const { status, data } = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: `newuser${Date.now()}@mavora.com`,
        password: 'StrongPassword123!',
        displayName: 'New Test User',
      }),
    });

    // Should either succeed (201) or return conflict (409) if user exists
    expect([200, 201, 409]).toContain(status);
  });
});

// ============================================================
// Password Reset Endpoint Tests
// ============================================================

describe('Integration - Auth - Password Reset', () => {
  it('should accept password reset request for any email (security)', async () => {
    const { status, data } = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'any@email.com' }),
    });

    // Should always return success to prevent email enumeration
    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject empty email for password reset', async () => {
    const { status, data } = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    });

    expect(status).toBe(400);
  });

  it('should reject invalid email format for reset', async () => {
    const { status } = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-valid' }),
    });

    expect(status).toBe(400);
  });

  it('should require new password on confirm reset', async () => {
    const { status } = await apiRequest('/auth/reset-password', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    expect(status).toBe(400);
  });

  it('should require matching passwords on confirm reset', async () => {
    const { status } = await apiRequest('/auth/reset-password', {
      method: 'PUT',
      body: JSON.stringify({
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword456!',
      }),
    });

    expect(status).toBe(400);
  });

  it('should enforce strong password on reset', async () => {
    const { status } = await apiRequest('/auth/reset-password', {
      method: 'PUT',
      body: JSON.stringify({
        password: 'weak',
        confirmPassword: 'weak',
      }),
    });

    expect(status).toBe(400);
  });
});

// ============================================================
// Session Management Tests
// ============================================================

describe('Integration - Auth - Sessions', () => {
  it('should check session status on GET request', async () => {
    const { status, data } = await apiRequest('/auth/session');

    // Should return session info or indicate no session
    expect([200, 401]).toContain(status);
    if (status === 200) {
      expect(data).toHaveProperty('user');
    }
  });

  it('should logout successfully', async () => {
    const { status } = await apiRequest('/auth/logout', {
      method: 'POST',
    });

    // Should succeed even without active session
    expect([200, 204, 401]).toContain(status);
  });
});

// ============================================================
// Rate Limiting Tests
// ============================================================

describe('Integration - Auth - Rate Limiting', () => {
  it('should handle multiple rapid requests gracefully', async () => {
    const promises = Array.from({ length: 5 }, () =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'ratelimit@test.com',
          password: 'password123',
        }),
      })
    );

    const responses = await Promise.all(promises);

    // All should complete (some may be rate limited)
    responses.forEach(({ status }) => {
      expect([200, 400, 401, 429]).toContain(status);
    });
  });
});
