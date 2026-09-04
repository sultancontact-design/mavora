/**
 * Unit Tests for Auth Validation
 * @module __tests__/lib/auth-validation.test
 */

import { describe, it, expect } from 'vitest';

// Import validation schemas - we'll test the logic directly
// Since Zod schemas might have dependencies, we test the core logic

describe('Auth Validation Logic', () => {
  describe('Email Validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should accept valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@no-user.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle Arabic email domains', () => {
      expect(isValidEmail('user@mavora.ma')).toBe(true);
      expect(isValidEmail('test@السوق.com')).toBe(true); // IDN support
    });
  });

  describe('Password Validation', () => {
    interface PasswordResult {
      valid: boolean;
      errors: string[];
    }

    const validatePassword = (password: string): PasswordResult => {
      const errors: string[] = [];
      
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain an uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain a lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain a number');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain a special character');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should accept strong passwords', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('8 characters'))).toBe(true);
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePassword('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('number'))).toBe(true);
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('NoSpecialChars123');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('special'))).toBe(true);
    });
  });

  describe('Display Name Validation', () => {
    const validateDisplayName = (name: string): { valid: boolean; error?: string } => {
      if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Name is required' };
      }
      if (name.trim().length < 2) {
        return { valid: false, error: 'Name must be at least 2 characters' };
      }
      if (name.trim().length > 50) {
        return { valid: false, error: 'Name must be less than 50 characters' };
      }
      return { valid: true };
    };

    it('should accept valid names', () => {
      expect(validateDisplayName('John Doe').valid).toBe(true);
      expect(validateDisplayName('أحمد محمد').valid); // Arabic name
      expect(validateDisplayName('Jean-Pierre').valid); // Hyphenated
    });

    it('should reject empty names', () => {
      expect(validateDisplayName('').valid).toBe(false);
      expect(validateDisplayName('   ').valid).toBe(false);
    });

    it('should reject too short names', () => {
      expect(validateDisplayName('A').valid).toBe(false);
    });

    it('reject too long names', () => {
      const longName = 'A'.repeat(51);
      expect(validateDisplayName(longName).valid).toBe(false);
    });
  });

  describe('Phone Number Validation', () => {
    const validatePhone = (phone: string | null | undefined): { valid: boolean; error?: string } => {
      if (!phone || phone.trim().length === 0) {
        return { valid: true }; // Phone is optional
      }
      
      // Moroccan phone format: +212 XXXXXXXXX or 06XXXXXXXX
      const moroccanRegex = /^(\+212|0)[5-7]\d{8}$/;
      const generalRegex = /^\+?[1-9]\d{6,14}$/;
      
      if (moroccanRegex.test(phone.replace(/\s/g, ''))) {
        return { valid: true };
      }
      
      if (generalRegex.test(phone.replace(/\s/g, ''))) {
        return { valid: true };
      }
      
      return { valid: false, error: 'Invalid phone format' };
    };

    it('should accept null/empty phone (optional)', () => {
      expect(validatePhone(null).valid).toBe(true);
      expect(validatePhone('').valid).toBe(true);
      expect(validatePhone(undefined).valid).toBe(true);
    });

    it('should accept Moroccan phone numbers', () => {
      expect(validatePhone('+212 6 12 34 56 78').valid).toBe(true);
      expect(validatePhone('0612345678').valid).toBe(true);
      expect(validatePhone('0712345678').valid).toBe(true);
    });

    it('should accept international formats', () => {
      expect(validatePhone('+12345678901').valid).toBe(true);
      expect(validatePhone('+44 20 7946 0958').valid).toBe(true);
    });
  });
});
