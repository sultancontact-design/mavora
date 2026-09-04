/**
 * In-Memory Rate Limiter
 * Production-ready with cleanup and stats
 */

interface RateLimitEntry {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  lockoutDurationMs?: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(private defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 10,
    lockoutDurationMs: 30 * 60 * 1000,
  }) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.cleanupInterval.unref();
  }

  check(key: string, config?: Partial<RateLimitConfig>): {
    allowed: boolean;
    remainingAttempts: number;
    retryAfterMs?: number;
    lockedUntil?: number;
  } {
    const cfg = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.lastAttempt > cfg.windowMs) {
      this.store.set(key, { count: 1, lastAttempt: now });
      return { allowed: true, remainingAttempts: cfg.maxAttempts - 1 };
    }

    if (entry.lockedUntil && now < entry.lockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterMs: entry.lockedUntil - now,
        lockedUntil: entry.lockedUntil,
      };
    }

    entry.count++;
    entry.lastAttempt = now;

    if (entry.count >= cfg.maxAttempts) {
      entry.lockedUntil = now + (cfg.lockoutDurationMs || cfg.windowMs);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterMs: cfg.lockoutDurationMs,
        lockedUntil: entry.lockedUntil,
      };
    }

    return { allowed: true, remainingAttempts: cfg.maxAttempts - entry.count };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  getStats(): { totalEntries: number; lockedEntries: number } {
    let locked = 0;
    this.store.forEach(entry => {
      if (entry.lockedUntil && entry.lockedUntil > Date.now()) locked++;
    });
    return { totalEntries: this.store.size, lockedEntries: locked };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      const age = now - entry.lastAttempt;
      const isLocked = entry.lockedUntil && entry.lockedUntil > now;
      if (age > 3600000 || (!isLocked && age > this.defaultConfig.windowMs)) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 10,
  lockoutDurationMs: 30 * 60 * 1000,
});

export const signupRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  lockoutDurationMs: 30 * 60 * 1000,
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxAttempts: 100,
});

export { RateLimiter };
export type { RateLimitConfig, RateLimitEntry };
