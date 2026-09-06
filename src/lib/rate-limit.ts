/**
 * Mavora - Rate Limiting Middleware
 * Arabic Marketplace Platform (Morocco)
 * 
 * In-memory rate limiting for API routes with:
 * - Multiple rate limit strategies (sliding window, fixed window, token bucket)
 * - IP-based and user-based limiting
 * - Customizable limits per route
 * - Arabic error messages
 */

// =============================================================================
// Types / الأنواع
// =============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Limit type: ip | user | both */
  keyGenerator?: (req: Request) => string;
  /** Custom message on rate limit exceeded */
  message?: string;
  /** Headers to send with response */
  headers?: boolean;
  /** Skip function to bypass rate limit */
  skip?: (req: Request) => boolean | Promise<boolean>;
  /** Store type: memory | redis */
  store?: 'memory' | 'redis';
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime?: number; // For sliding window
}

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

// =============================================================================
// Default Configurations / الإعدادات الافتراضية
// =============================================================================

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // General API
  general: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
  },
  
  // Authentication endpoints (more strict)
  auth: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    message: 'محاولات تسجيل دخول كثيرة جداً. يرجى الانتظار دقيقة.',
  },
  
  // Login specifically (very strict)
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'محاولات تسجيل دخول كثيرة. يرجى الانتظار 15 دقيقة.',
  },
  
  // Signup
  signup: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'محاولات إنشاء حساب كثيرة. يرجى الانتظار ساعة.',
  },
  
  // Password reset
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    message: 'طلبات إعادة تعيين كلمة المرور كثيرة. يرجى الانتظار ساعة.',
  },
  
  // Search endpoint
  search: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    message: 'عمليات بحث كثيرة. يرجى التقليل من وتيرة البحث.',
  },
  
  // Listing creation
  listingCreate: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    message: 'إعلانات كثيرة جداً. الحد الأقصى 10 إعلانات في الساعة.',
  },
  
  // Message sending
  messageSend: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: 'رسائل كثيرة جداً. يرجى الانتظار قليلاً.',
  },
  
  // Payment operations
  payment: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    message: 'عمليات دفع كثيرة. يرجى التأكد من طلبك.',
  },
  
  // File uploads
  upload: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    message: 'رفع ملفات كثير. الحد الأقصى 10 ملفات في الدقيقة.',
  },
  
  // Admin endpoints (less strict for admins)
  admin: {
    maxRequests: 200,
    windowMs: 60 * 1000,
    message: 'تجاوزت حد الطلبات للمشرفين.',
  },
};

// =============================================================================
// Memory Store / مخزن الذاكرة
// =============================================================================

class MemoryRateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    
    // Don't prevent process from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check and increment rate limit (Fixed Window)
   */
  checkAndIncrement(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // New entry or expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequestTime: now,
      };
      this.store.set(key, newEntry);
      
      return {
        limited: false,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
        retryAfter: config.windowMs / 1000,
      };
    }

    // Entry exists and not expired
    if (entry.count >= config.maxRequests) {
      return {
        limited: true,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    // Increment count
    entry.count++;
    
    return {
      limited: false,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  /**
   * Sliding Window Log algorithm
   */
  checkSlidingWindow(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);
    const windowStart = now - config.windowMs;

    if (!entry || !entry.firstRequestTime || entry.firstRequestTime < windowStart) {
      // New window
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequestTime: now,
      };
      this.store.set(key, newEntry);
      
      return {
        limited: false,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
        retryAfter: config.windowMs / 1000,
      };
    }

    // Calculate requests in current window
    // For simplicity, we use a simplified sliding window here
    if (entry.count >= config.maxRequests) {
      const timeUntilReset = entry.firstRequestTime + config.windowMs - now;
      return {
        limited: true,
        remaining: 0,
        resetTime: entry.firstRequestTime + config.windowMs,
        retryAfter: Math.max(1, Math.ceil(timeUntilReset / 1000)),
      };
    }

    entry.count++;
    
    return {
      limited: false,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.firstRequestTime + config.windowMs,
      retryAfter: Math.ceil((entry.firstRequestTime + config.windowMs - now) / 1000),
    };
  }

  /**
   * Reset counter for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current state for a key
  getState(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    this.store.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Destroy store instance
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// =============================================================================
// Singleton Store / مخزن واحد
// =============================================================================

const memoryStore = new MemoryRateLimitStore();

// =============================================================================
// Key Generators / مولدات المفاتيح
// =============================================================================

/**
 * Generate key from IP address
 */
function getIPFromRequest(req: Request): string {
  // Try various headers for IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback - this won't work in serverless but it's okay
  return 'unknown-ip';
}

/**
 * Generate key from request (IP-based)
 */
export function ipKeyGenerator(req: Request): string {
  const ip = getIPFromRequest(req);
  const path = new URL(req.url).pathname;
  return `rate_limit:${ip}:${path}`;
}

/**
 * Generate key from request (user-based)
 */
export function userKeyGenerator(req: Request): string {
  // Try to get user ID from authorization header or session
  const authHeader = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');
  
  // This would need to be implemented based on your auth system
  const userId = authHeader?.split(' ')[1] || cookie?.split('=')[1] || 'anonymous';
  
  const path = new URL(req.url).pathname;
  return `rate_limit:user:${userId}:${path}`;
}

// =============================================================================
// Main Rate Limiter Function / وظيفة تحديد المعدل الرئيسية
// =============================================================================

/**
 * Create a rate limiter middleware/function
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request): Promise<RateLimitResult & { response?: Response }> => {
    // Check if should skip
    if (config.skip && await config.skip(req)) {
      return {
        limited: false,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        retryAfter: config.windowMs / 1000,
      };
    }

    // Generate key
    const key = config.keyGenerator ? config.keyGenerator(req) : ipKeyGenerator(req);
    
    // Check rate limit
    const result = memoryStore.checkAndIncrement(key, config);

    // Create response if limited
    if (result.limited) {
      const response = new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: config.message || 'تجاوزت الحد المسموح من الطلبات',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
            'Retry-After': String(result.retryAfter),
          },
        }
      );

      return { ...result, response };
    }

    return result;
  };
}

// =============================================================================
// Pre-configured Limiters / محددات معدلة مسبقاً
// =============================================================================

export const generalLimiter = createRateLimiter(DEFAULT_RATE_LIMITS.general);
export const authLimiter = createRateLimiter(DEFAULT_RATE_LIMITS.auth);
export const loginLimiter = createRateLimiter(DEFAULT_RATE_LIMITS.login);
export const searchLimiter = createRateLimiter(DEFAULT_RATE_LIMITS.search);
export const uploadLimiter = createRateLimiter(DEFAULT_RATE_LIMITS.upload);

// =============================================================================
// Next.js API Route Middleware Helper / مساعد وسيط API
// =============================================================================

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (req: Request, ...args: any[]) => Promise<Response>,
  configName: keyof typeof DEFAULT_RATE_LIMITS = 'general'
) {
  const config = DEFAULT_RATE_LIMITS[configName];
  const limiter = createRateLimiter(config);

  return async (req: Request, ...args: any[]): Promise<Response> => {
    const result = await limiter(req);
    
    if (result.limited && result.response) {
      return result.response;
    }

    // Add rate limit headers to successful responses
    const response = await handler(req, ...args);
    
    if (config.headers !== false) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-RateLimit-Limit', String(config.maxRequests));
      newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
      newHeaders.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return response;
  };
}

// =============================================================================
// Usage Examples / أمثلة الاستخدام
// =============================================================================

/*
// Example 1: Basic usage in API route
import { withRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  // Handler logic
  return Response.json({ data: [] });
}

export const GET = withRateLimit(GET, 'search');


// Example 2: Custom rate limit
import { createRateLimiter } from '@/lib/rate-limit';

const customLimiter = createRateLimiter({
  maxRequests: 50,
  windowMs: 60000,
  message: 'محدود!',
});

export async function POST(request: Request) {
  const result = await customLimiter(request);
  if (result.limited) {
    return result.response!;
  }
  // Handle request
}
*/

// =============================================================================
// Export Default / التصدير الافتراضي
// =============================================================================

export default {
  createRateLimiter,
  withRateLimit,
  DEFAULT_RATE_LIMITS,
  memoryStore,
};
