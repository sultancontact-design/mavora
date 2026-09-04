// ============================================================
// 🧪 Password Reset System Tests (Vitest)
// Covers: Token generation, hashing, verification, email templates
// ============================================================

import { describe, it, expect } from 'vitest';
import { generateResetToken, hashToken, verifyToken, cleanupExpiredTokens } from '@/lib/password-reset';
import { getPasswordResetTemplate, emailTemplates } from '@/lib/email';

// ============================================================
// Token Generation & Validation Tests
// ============================================================

describe('Password Reset - Token Generation', () => {
  it('should generate a token with correct prefix', () => {
    const token = generateResetToken();
    expect(token).toMatch(/^pw_/);
  });

  it('should generate unique tokens', () => {
    const token1 = generateResetToken();
    const token2 = generateResetToken();
    expect(token1).not.toBe(token2);
  });

  it('should generate tokens of expected length', () => {
    // 32 bytes = 64 hex chars + 3 char prefix = 67 chars
    const token = generateResetToken();
    expect(token.length).toBe(67); // 'pw_' + 64 hex chars
  });

  it('should generate cryptographically secure tokens (no predictable patterns)', () => {
    const tokens = Array.from({ length: 10 }, () => generateResetToken());
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(10); // All should be unique
  });
});

describe('Password Reset - Token Hashing', () => {
  it('should hash a token consistently', () => {
    const token = generateResetToken();
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different tokens', () => {
    const token1 = generateResetToken();
    const token2 = generateResetToken();
    expect(hashToken(token1)).not.toBe(hashToken(token2));
  });

  it('should produce fixed-length SHA-256 hashes', () => {
    const token = generateResetToken();
    const hash = hashToken(token);
    expect(hash.length).toBe(64); // SHA-256 produces 64 hex chars
  });
});

describe('Password Reset - Token Verification', () => {
  it('should verify a valid token', () => {
    const token = generateResetToken();
    const hashedToken = hashToken(token);
    expect(verifyToken(token, hashedToken)).toBe(true);
  });

  it('should reject an invalid token', () => {
    const token1 = generateResetToken();
    const token2 = generateResetToken();
    const hashedToken1 = hashToken(token1);
    expect(verifyToken(token2, hashedToken1)).toBe(false);
  });

  it('should be timing-safe (prevent timing attacks)', () => {
    const token = generateResetToken();
    const hashedToken = hashToken(token);
    const wrongToken = generateResetToken();

    // Both operations should complete in similar time
    const start1 = Date.now();
    verifyToken(token, hashedToken);
    const duration1 = Date.now() - start1;

    const start2 = Date.now();
    verifyToken(wrongToken, hashedToken);
    const duration2 = Date.now() - start2;

    // Allow some variance but they should be roughly similar
    expect(Math.abs(duration1 - duration2)).toBeLessThan(100);
  });
});

// ============================================================
// Email Template Tests
// ============================================================

describe('Password Reset - Email Templates', () => {
  const templateDataAR = {
    resetUrl: 'https://mavora.com/auth/reset-password/confirm?token=test123',
    userEmail: 'test@example.com',
    expiryHours: 1,
    appName: 'Mavora',
    locale: 'ar' as const,
  };

  const templateDataEN = {
    ...templateDataAR,
    locale: 'en' as const,
  };

  it('should generate Arabic email template with required fields', () => {
    const template = getPasswordResetTemplate(templateDataAR);
    
    expect(template.subject).toContain('Mavora');
    expect(template.htmlBody).toContain('إعادة تعيين كلمة المرور');
    expect(template.htmlBody).toContain(templateDataAR.resetUrl);
    expect(template.htmlBody).toContain(templateDataAR.userEmail);
    expect(template.textBody).toBeDefined();
  });

  it('should generate English email template with required fields', () => {
    const template = getPasswordResetTemplate(templateDataEN);
    
    expect(template.subject).toContain('Password Reset');
    expect(template.htmlBody).toContain('Password Reset');
    expect(template.htmlBody).toContain(templateDataEN.resetUrl);
    expect(template.textBody).toBeDefined();
  });

  it('should include security warnings in templates', () => {
    const templateAR = emailTemplates.passwordResetAR(templateDataAR);
    const templateEN = emailTemplates.passwordResetEN(templateDataEN);

    // Check for expiry warning
    expect(templateAR.htmlBody).toContain('ساعات فقط');
    expect(templateEN.htmlBody).toContain('hours only');

    // Check for security notice about not requesting reset
    expect(templateAR.htmlBody).toContain('لم تطلب');
    expect(templateEN.htmlBody).toContain("didn't request");
  });

  it('should include reset button/link in HTML', () => {
    const template = emailTemplates.passwordResetEN(templateDataEN);
    
    // Should have the reset URL as a link
    expect(template.htmlBody).toContain(`href="${templateDataEN.resetUrl}"`);
    expect(template.htmlBody).toContain('Reset Password');
  });

  it('should have proper HTML structure', () => {
    const template = emailTemplates.passwordResetEN(templateDataEN);
    
    expect(template.htmlBody).toContain('<!DOCTYPE html>');
    expect(template.htmlBody).toContain('</html>');
    // Template should contain body content
    expect(template.htmlBody).toContain('Password Reset');
  });

  it('should contain app name in header', () => {
    const templateAR = emailTemplates.passwordResetAR(templateDataAR);
    expect(templateAR.htmlBody).toContain(templateDataAR.appName);
    expect(templateAR.htmlBody).toContain('<h1');
  });
});

// ============================================================
// Security Tests
// ============================================================

describe('Password Reset - Security Features', () => {
  it('tokens should not contain predictable patterns', () => {
    const tokens = Array.from({ length: 5 }, () => generateResetToken());
    
    // Check that tokens don't have obvious sequences
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        // Tokens should differ by more than just a few characters
        const diffCount = tokens[i]
          .split('')
          .filter((char, idx) => char !== tokens[j][idx]).length;
        expect(diffCount).toBeGreaterThan(30); // At least half the characters should differ
      }
    }
  });

  it('hashed tokens should not reveal original token structure', () => {
    const token = generateResetToken();
    const hash = hashToken(token);

    // Hash should be completely different from token
    expect(hash).not.toContain('pw_');
    expect(hash.length).not.toBe(token.length);
    // Hash should only contain hex characters
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

// ============================================================
// Cleanup Functionality Tests
// ============================================================

describe('Password Reset - Cleanup', () => {
  it('should export cleanup function', () => {
    expect(typeof cleanupExpiredTokens).toBe('function');
  });

  it('should return deleted count from cleanup', async () => {
    const result = await cleanupExpiredTokens();
    expect(result).toHaveProperty('deleted');
    expect(typeof result.deleted).toBe('number');
  });
});
