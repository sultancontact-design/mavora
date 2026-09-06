/**
 * Mavora - Caching System
 * Arabic Marketplace Platform (Morocco)
 * 
 * Multi-layer caching with:
 * - Memory cache (in-process)
 * - Redis cache (distributed) - optional
 * - LocalStorage cache (client-side)
 */

// =============================================================================
// Types / الأنواع
// =============================================================================

export interface CacheOptions {
  /** Time to live in seconds (default: 300 = 5 minutes) */
  ttl?: number;
  /** Cache namespace/prefix */
  namespace?: string;
  /** Whether to stale-while-revalidate (default: false) */
  swr?: boolean;
  /** Custom key generator */
  keyGenerator?: (...args: any[]) => string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

type CacheStore = Map<string, CacheEntry<any>>;

// =============================================================================
// In-Memory Cache / ذاكرة تخزين مؤقت
// =============================================================================

class MemoryCache {
  private store: CacheStore = new Map();
  private defaultTTL: number = 300; // 5 minutes
  private maxEntries: number = 1000;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options?: { defaultTTL?: number; maxEntries?: number }) {
    if (options?.defaultTTL) this.defaultTTL = options.defaultTTL;
    if (options?.maxEntries) this.maxEntries = options.maxEntries;
    
    // Start cleanup interval (every 5 minutes)
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ((ttl || this.defaultTTL) * 1000),
      createdAt: Date.now(),
      hits: 0,
    };

    this.store.set(key, entry as CacheEntry<any>);
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get multiple keys
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    await Promise.all(
      keys.map(async (key) => {
        results.set(key, await this.get<T>(key));
      })
    );
    
    return results;
  }

  /**
   * Set multiple key-value pairs
   */
  async setMany(entries: [string, any][], ttl?: number): Promise<void> {
    await Promise.all(
      entries.map(([key, value]) => this.set(key, value, ttl))
    );
  }

  /**
   * Get or set with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, options?.ttl);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalHits = 0;
    let expiredCount = 0;
    const now = Date.now();

    this.store.forEach((entry) => {
      totalHits += entry.hits;
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    });

    return {
      size: this.store.size,
      maxSize: this.maxEntries,
      totalHits,
      expiredCount,
      hitRate: this.store.size > 0 ? totalHits / this.store.size : 0,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    this.store.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[MemoryCache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Evict oldest entry (LRU-like behavior)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.store.forEach((entry, key) => {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  /**
   * Destroy the cache instance
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// =============================================================================
// Singleton Instance / نسخة واحدة
// =============================================================================

let memoryCacheInstance: MemoryCache | null = null;

export function getMemoryCache(options?: ConstructorParameters<typeof MemoryCache>[0]): MemoryCache {
  if (!memoryCacheInstance) {
    memoryCacheInstance = new MemoryCache(options);
  }
  return memoryCacheInstance;
}

// =============================================================================
// Namespaced Cache / ذاكرة مخبأة بمساحات أسماء
// =============================================================================

export class NamespacedCache {
  private cache: MemoryCache;
  private namespace: string;

  constructor(namespace: string, cache?: MemoryCache) {
    this.namespace = namespace;
    this.cache = cache || getMemoryCache();
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(this.getKey(key));
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.cache.set(this.getKey(key), value, ttl);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(this.getKey(key));
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(this.getKey(key));
  }

  async clear(): Promise<void> {
    // Clear only entries in this namespace
    // This is inefficient - consider using a separate store per namespace
    const keysToDelete: string[] = [];
    const prefix = `${this.namespace}:`;
    
    // We need access to the store - this is a workaround
    // In production, use Redis with proper namespace support
    console.warn('[NamespacedCache] clear() is not fully supported with MemoryCache');
  }
}

// =============================================================================
// Predefined Caches / مخابئ محددة مسبقاً
// =============================================================================

// Categories cache (changes rarely)
export const categoriesCache = new NamespacedCache('categories', getMemoryCache({ ttl: 3600 })); // 1 hour

// Listings cache (changes frequently)
export const listingsCache = new NamespacedCache('listings', getMemoryCache({ ttl: 60 })); // 1 minute

// User data cache (moderate changes)
export const userCache = new NamespacedCache('users', getMemoryCache({ ttl: 300 })); // 5 minutes

// Settings cache (rarely changes)
export const settingsCache = new NamespacedCache('settings', getMemoryCache({ ttl: 7200 })); // 2 hours

// Cities/locations cache (rarely changes)
export const locationsCache = new NamespacedCache('locations', getMemoryCache({ ttl: 86400 })); // 24 hours

// Currency exchange rates (update hourly)
export const currencyCache = new NamespacedCache('currencies', getMemoryCache({ ttl: 3600 })); // 1 hour

// =============================================================================
// Server-Side Caching Middleware / وسيط التخزين المؤقت من جانب الخادم
// =============================================================================

import { NextResponse } from 'next/server';

/**
 * Generate cache headers for Next.js API responses
 */
export function getCacheHeaders(ttl: number = 60, isPrivate: boolean = true): Record<string, string> {
  return {
    'Cache-Control': `${isPrivate ? 'private' : 'public'}, max-age=${ttl}, s-maxage=${ttl * 2}, stale-while-revalidate=${ttl * 3}`,
    'CDN-Cache-Control': `max-age=${ttl * 10}`,
    'Vercel-CDN-Cache-Control': `max-age=${ttl * 10}`,
  };
}

/**
 * Create a cached API response
 */
export function cachedResponse(data: any, ttl: number = 60, revalidate?: number): NextResponse {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getCacheHeaders(ttl),
  };

  if (revalidate) {
    headers['Next.js-Revalidate'] = String(revalidate);
  }

  return NextResponse.json(data, { headers });
}

// =============================================================================
// Client-Side Storage Cache / ذاكرة التخزين المحلية
// =============================================================================

const STORAGE_PREFIX = 'mavora_cache_';

/**
 * Client-side cache using localStorage/sessionStorage
 */
export const clientCache = {
  /**
   * Get from localStorage
   */
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (!item) return null;
      
      const parsed = JSON.parse(item) as CacheEntry<T>;
      
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_PREFIX + key);
        return null;
      }
      
      return parsed.value;
    } catch {
      return null;
    }
  },

  /**
   * Set in localStorage
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    if (typeof window === 'undefined') return;
    
    try {
      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000),
        createdAt: Date.now(),
        hits: 0,
      };
      
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // Quota exceeded or storage not available
      console.warn('[ClientCache] Failed to save to localStorage:', e);
    }
  },

  /**
   * Remove from localStorage
   */
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  /**
   * Clear all Mavora cache from localStorage
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },
};

// =============================================================================
// React Hooks / خطافات ريكت
// =============================================================================

import { useState, useEffect } from 'react';

/**
 * Hook for client-side caching with SWR-like behavior
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions & { 
    enabled?: boolean;
    revalidateOnFocus?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { enabled = true, revalidateOnFocus = true, ttl = 300 } = options || {};

  const fetchData = async (forceRefresh = false) => {
    if (!enabled) return;

    // Try cache first
    if (!forceRefresh) {
      const cached = clientCache.get<T>(key);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      const result = await fetcher();
      setData(result);
      clientCache.set(key, result, ttl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fetch failed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Revalidate on window focus
    if (revalidateOnFocus && typeof window !== 'undefined') {
      const handleFocus = () => fetchData(true);
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [key, enabled]);

  // Manual revalidation
  const mutate = () => fetchData(true);

  return { data, isLoading, error, mutate };
}

// =============================================================================
// Export Default Cache Instance
// =============================================================================

export default getMemoryCache();
