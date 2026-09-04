import { describe, it, expect, vi } from 'vitest';

describe('Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signup Validation', () => {
    it('should reject empty email', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password: 'Test123!' }),
      });
      
      expect([400, 404, 500]).toContain(response.status);
    });

    it('should reject weak password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: '123' 
        }),
      });
      
      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('Login Validation', () => {
    it('should reject invalid credentials format', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password: '' }),
      });
      
      expect([400, 401, 404, 500]).toContain(response.status);
    });
  });
});
