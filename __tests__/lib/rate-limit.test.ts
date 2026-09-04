/**
 * Unit Tests for Rate Limiting
 * @module __tests__/lib/rate-limit.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simple in-memory rate limiter for testing
class InMemoryRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private windowMs: number;
  private maxAttempts: number;

  constructor(windowMs: number = 900000, maxAttempts: number = 5) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  isLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now - record.lastAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return false;
    }

    if (record.count >= this.maxAttempts) {
      return true;
    }

    record.count++;
    record.lastAttempt = now;
    return false;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  getAttempts(key: string): number {
    return this.attempts.get(key)?.count || 0;
  }
}

describe('Rate Limiter', () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter(60000, 3); // 1 min window, 3 attempts
  });

  describe('basic rate limiting', () => {
    it('should allow requests under the limit', () => {
      expect(limiter.isLimited('user-1')).toBe(false);
      expect(limiter.isLimited('user-1')).toBe(false);
      expect(limiter.isLimited('user-1')).toBe(false);
    });

    it('should block requests over the limit', () => {
      // Use all attempts
      limiter.isLimited('user-2');
      limiter.isLimited('user-2');
      limiter.isLimited('user-2');
      
      // Next should be blocked
      expect(limiter.isLimited('user-2')).toBe(true);
    });

    it('should track attempts correctly', () => {
      limiter.isLimited('user-3');
      limiter.isLimited('user-3');
      
      expect(limiter.getAttempts('user-3')).toBe(2);
    });
  });

  describe('independent limits per key', () => {
    it('should limit users independently', () => {
      // User A uses all attempts
      limiter.isLimited('user-a');
      limiter.isLimited('user-a');
      limiter.isLimited('user-a');
      
      // User B should still have full allowance
      expect(limiter.isLimited('user-b')).toBe(false);
      expect(limiter.isLimited('user-b')).toBe(false);
      expect(limiter.isLimited('user-b')).toBe(false);
      expect(limiter.isLimited('user-b')).toBe(true); // Now blocked
    });
  });

  describe('window expiration', () => {
    it('should reset after window expires', () => {
      // Use vi.useFakeTimers() for time control
      vi.useFakeTimers();

      const timedLimiter = new InMemoryRateLimiter(60000, 2);
      
      // Use all attempts
      timedLimiter.isLimited('timed-user');
      timedLimiter.isLimited('timed-user');
      expect(timedLimiter.isLimited('timed-user')).toBe(true);

      // Advance time past window
      vi.advanceTimersByTime(61000);
      
      // Should be allowed again
      expect(timedLimiter.isLimited('timed-user')).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('reset functionality', () => {
    it('should allow resetting a specific key', () => {
      // Use all attempts
      limiter.isLimited('reset-user');
      limiter.isLimited('reset-user');
      limiter.isLimited('reset-user');
      expect(limiter.isLimited('reset-user')).toBe(true);

      // Reset
      limiter.reset('reset-user');

      // Should be allowed again
      expect(limiter.isLimited('reset-user')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty keys', () => {
      expect(limiter.isLimited('')).toBe(false);
    });

    it('should handle special characters in keys', () => {
      expect(limiter.isLimited('user@domain.com')).toBe(false);
      expect(limiter.isLimited('192.168.1.1')).toBe(false);
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      expect(limiter.isLimited(longKey)).toBe(false);
    });
  });
});

describe('Rate Limiter Configuration', () => {
  it('should allow custom window sizes', () => {
    const shortWindow = new InMemoryRateLimiter(1000, 2); // 1 second window
    
    shortWindow.isLimited('fast');
    shortWindow.isLimited('fast');
    expect(shortWindow.isLimited('fast')).toBe(true);
  });

  it('should allow custom max attempts', () => {
    const highLimit = new InMemoryRateLimiter(60000, 100); // 100 attempts
    
    for (let i = 0; i < 100; i++) {
      expect(highLimit.isLimited('generous')).toBe(false);
    }
    expect(highLimit.isLimited('generous')).toBe(true);
  });
});
