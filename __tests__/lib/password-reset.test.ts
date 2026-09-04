/**
 * Password Reset System Tests
 * Tests for the complete password reset flow
 */

import { describe, it, expect, vi } from 'vitest';

// Import validation schemas
import {
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  getAuthErrorMessage,
} from '@/lib/validations/auth';

describe('Password Reset - Request Validation', () => {
  describe('resetPasswordRequestSchema', () => {
    it('should validate valid email', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: 'user@example.com',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('should normalize email to lowercase', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: 'User@Example.COM',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('should reject empty email', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: '',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: 'not-an-email',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject email with path traversal', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: '../user@example.com',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject email that is too long', () => {
      const longEmail = `${'a'.repeat(255)}@example.com`;
      const result = resetPasswordRequestSchema.safeParse({
        email: longEmail,
      });
      
      expect(result.success).toBe(false);
    });
  });
});

describe('Password Reset - Confirm Validation', () => {
  describe('resetPasswordConfirmSchema', () => {
    const validData = {
      token: 'valid-token-12345',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
    };

    it('should validate valid reset data', () => {
      const result = resetPasswordConfirmSchema.safeParse(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject missing token', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        ...validData,
        token: '',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        ...validData,
        password: 'Short1',
        confirmPassword: 'Short1',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject password without numbers', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        ...validData,
        password: 'NoNumbersHere',
        confirmPassword: 'NoNumbersHere',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase letters', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        ...validData,
        password: 'NOLOWERCASE123',
        confirmPassword: 'NOLOWERCASE123',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject password with spaces', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        ...validData,
        password: 'Has Space123',
        confirmPassword: 'Has Space123',
      });
      
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        ...validData,
        confirmPassword: 'DifferentPass123',
      });
      
      expect(result.success).toBe(false);
      
      if (!result.success) {
        // Error should be about password mismatch
        const hasMismatchError = result.error.issues.some(
          issue => issue.path.includes('confirmPassword')
        );
        expect(hasMismatchError).toBe(true);
      }
    });

    it('should reject very long password', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        ...validData,
        password: 'a'.repeat(129),
        confirmPassword: 'a'.repeat(129),
      });
      
      expect(result.success).toBe(false);
    });
  });
});

describe('Password Reset - Error Messages', () => {
  describe('getAuthErrorMessage', () => {
    it('should return Arabic message for ar locale', () => {
      const msg = getAuthErrorMessage('auth.reset_email_sent', 'ar');
      expect(msg).toContain('إرسال');
    });

    it('should return English message for en locale', () => {
      const msg = getAuthErrorMessage('auth.reset_email_sent', 'en');
      expect(msg).toContain('sent');
    });

    it('should return English for fr locale (fallback)', () => {
      const msg = getAuthErrorMessage('auth.reset_email_sent', 'fr');
      expect(msg).toContain('sent'); // Falls back to English
    });

    it('should return key if not found', () => {
      const msg = getAuthErrorMessage('unknown.error.key', 'en');
      expect(msg).toBe('unknown.error.key');
    });

    it('should handle all reset-related error keys', () => {
      const resetKeys = [
        'auth.token_required',
        'auth.invalid_token',
        'auth.password_too_short',
        'auth.passwords_mismatch',
        'auth.reset_email_sent',
        'auth.password_changed',
        'auth.too_many_attempts',
      ];

      resetKeys.forEach(key => {
        const arMsg = getAuthErrorMessage(key, 'ar');
        const enMsg = getAuthErrorMessage(key, 'en');
        
        expect(arMsg).toBeTruthy();
        expect(enMsg).toBeTruthy();
        expect(typeof arMsg).toBe('string');
        expect(typeof enMsg).toBe('string');
      });
    });
  });
});

describe('Password Reset - Security Considerations', () => {
  describe('Rate Limiting Behavior', () => {
    it('should always return success for security (prevent email enumeration)', () => {
      // This tests the concept - actual implementation is in the API
      const responses = [
        { email: 'existing@email.com', shouldSucceed: true },
        { email: 'nonexistent@email.com', shouldSucceed: true }, // Still returns success!
        { email: '', shouldSucceed: false }, // Validation error
      ];

      responses.forEach(({ email, shouldSucceed }) {
        const result = resetPasswordRequestSchema.safeParse({ email });
        expect(result.success).toBe(shouldSucceed);
      });
    });
  });

  describe('Token Security', () => {
    it('should require non-empty token', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        token: '',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
      });
      
      expect(result.success).toBe(false);
    });

    it('should accept various token formats', () => {
      const validTokens = [
        'abc123',
        'token-with-dashes',
        'token.with.dots',
        'UPPERCASE-TOKEN-123',
        'very-long-token-with-many-characters-123456789',
      ];

      validTokens.forEach(token => {
        const result = resetPasswordConfirmSchema.safeParse({
          token,
          password: 'ValidPass123',
          confirmPassword: 'ValidPass123',
        });
        
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('Password Reset - Integration Flow Simulation', () => {
  it('should simulate complete reset flow', async () => {
    // Step 1: User requests reset
    const requestResult = resetPasswordRequestSchema.safeParse({
      email: 'test@example.com',
    });
    expect(requestResult.success).toBe(true);

    // Step 2: System generates token (simulated)
    const simulatedToken = `reset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    expect(simulatedToken.length).toBeGreaterThan(10);

    // Step 3: User submits new password
    const confirmResult = resetPasswordConfirmSchema.safeParse({
      token: simulatedToken,
      password: 'NewSecurePass123',
      confirmPassword: 'NewSecurePass123',
    });
    expect(confirmResult.success).toBe(true);

    // Step 4: Verify success state would be shown
    const successMessage = getAuthErrorMessage('auth.password_changed', 'en');
    expect(successMessage).toContain('changed');
  });

  it('handle expired token scenario', () => {
    const result = resetPasswordConfirmSchema.safeParse({
      token: 'expired-token-123',
      password: 'NewPass123',
      confirmPassword: 'NewPass123',
    });

    // Token format is valid, but API would reject as expired
    expect(result.success).toBe(true); // Schema validation passes
    // API would return auth.invalid_token error
  });

  it('handle user typing wrong confirm password', () => {
    const result = resetPasswordConfirmSchema.safeParse({
      token: 'valid-token',
      password: 'CorrectPassword123',
      confirmPassword: 'WrongPassword123',
    });

    expect(result.success).toBe(false);
    
    if (!result.success) {
      const errors = result.error.issues;
      const hasPasswordError = errors.some(e => 
        e.path.includes('confirmPassword')
      );
      expect(hasPasswordError).toBe(true);
    }
  });
});

// Performance tests
describe('Password Reset - Performance', () => {
  it('should validate quickly', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      resetPasswordRequestSchema.safeParse({
        email: `user${i}@example.com`,
      });
    }

    const duration = performance.now() - start;
    console.log(`1000 reset requests validated in ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100);
  });
});
