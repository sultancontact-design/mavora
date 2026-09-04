// ============================================================
// ⚡ Performance Utilities for Mavora
// Lazy loading, debouncing, throttling, and more
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================
// Types
// ============================================================

export interface LazyLoadOptions {
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for triggering load */
  threshold?: number;
  /** Whether to load immediately in SSR */
  ssrLoad?: boolean;
}

export interface DebounceOptions {
  /** Delay in milliseconds */
  delay: number;
  /** Whether to invoke on leading edge */
  leading?: boolean;
  /** Whether to invoke on trailing edge */
  trailing?: boolean;
}

export interface ThrottleOptions {
  /** Delay in milliseconds */
  delay: number;
  /** Whether to invoke on leading edge */
  leading?: boolean;
  /** Whether to invoke on trailing edge */
  trailing?: boolean;
}

// ============================================================
// useLazyLoad Hook
// ============================================================

/**
 * Custom hook for lazy loading components based on visibility
 * Uses IntersectionObserver for optimal performance
 */
export function useLazyLoad(options: LazyLoadOptions = {}) {
  const {
    rootMargin = '200px',
    threshold = 0.01,
    ssrLoad = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(ssrLoad);
  const [hasLoaded, setHasLoaded] = useState(ssrLoad);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ssrLoad || hasLoaded) return;

    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is available
    if (!('IntersectionObserver' in window)) {
      // Fallback: load immediately
      setIsIntersecting(true);
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          setHasLoaded(true);
          // Once loaded, stop observing
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, ssrLoad, hasLoaded]);

  return { ref, isIntersecting, hasLoaded };
}

// ============================================================
// Debounce Function
// ============================================================

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  options: DebounceOptions | number
): (...args: Parameters<T>) => void {
  const opts = typeof options === 'number' ? { delay: options } : options;
  const { delay, leading = false, trailing = true } = opts;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;

  const debounced = (...args: Parameters<T>) => {
    const now = Date.now();

    // Leading edge invocation
    if (leading && now - lastCallTime >= delay) {
      func(...args);
      lastCallTime = now;
      return;
    }

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Trailing edge invocation
    if (trailing) {
      timeoutId = setTimeout(() => {
        func(...args);
        lastCallTime = Date.now();
        timeoutId = null;
      }, delay);
    }
  };

  // Add cancel method
  (debounced as unknown as { cancel: () => void }).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as unknown as (...args: Parameters<T>) => void;
}

// ============================================================
// Throttle Function
// ============================================================

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  options: ThrottleOptions | number
): (...args: Parameters<T>) => void {
  const opts = typeof options === 'number' ? { delay: options } : options;
  const { delay, leading = true, trailing = false } = opts;

  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      // Can invoke (leading or enough time passed)
      func(...args);
      lastCallTime = now;
    } else if (trailing && !timeoutId) {
      // Schedule trailing edge invocation
      timeoutId = setTimeout(() => {
        func(...args);
        lastCallTime = Date.now();
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  };

  // Add cancel method
  (throttled as unknown as { cancel: () => void }).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled as unknown as (...args: Parameters<T>) => void;
}

// ============================================================
// useDebouncedValue Hook
// ============================================================

/**
 * Hook that returns a debounced version of a value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================
// useThrottledValue Hook
// ============================================================

/**
 * Hook that returns a throttled version of a value
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;

    const timeoutId = setTimeout(() => {
      setThrottledValue(value);
      lastUpdate.current = Date.now();
    }, Math.max(0, delay - timeSinceLastUpdate));

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return throttledValue;
}

// ============================================================
// useOnlineStatus Hook
// ============================================================

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ============================================================
// useMediaQuery Hook
// ============================================================

/**
 * Hook to check media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ============================================================
// Responsive Breakpoints Hook
// ============================================================

export interface Breakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

/**
 * Hook for responsive breakpoint detection
 */
export function useBreakpoints(): Breakpoints {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
  };
}

// ============================================================
// useIdleCallback Hook
// ============================================================

/**
 * Hook for running functions during browser idle time
 */
export function useIdleCallback(callback: () => void, deps: unknown[] = []) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Use requestIdleCallback if available, otherwise fallback to setTimeout
    const scheduleCallback = (
      cb: IdleRequestCallback | (() => void)
    ): number => {
      if ('requestIdleCallback' in window) {
        return (window as unknown as { requestIdleCallback: (cb: IdleRequestCallback) => number })
          .requestIdleCallback(cb as IdleRequestCallback);
      }
      return window.setTimeout(cb as () => void, 1);
    };

    const cancelCallback = (id: number) => {
      if ('cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };

    const id = scheduleCallback(() => {
      callbackRef.current();
    });

    return () => cancelCallback(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ============================================================
// Memory Optimization
// ============================================================

/**
 * Creates a memoized selector with cache size limit
 */
export function createMemoizedSelector<T, R>(
  selector: (state: T) => R,
  cacheSize: number = 10
): (state: T) => R {
  const cache = new Map<string, R>();
  const keys: string[] = [];

  return (state: T): R => {
    // Create a simple hash of the state (for primitive states)
    const key = JSON.stringify(state);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = selector(state);

    // Manage cache size
    if (keys.length >= cacheSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, result);
    keys.push(key);

    return result;
  };
}

// ============================================================
// Performance Monitoring
// ============================================================

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const metrics: PerformanceMetric[] = [];

/**
 * Measure and record performance metrics
 */
export function measurePerformance(
  name: string,
  fn: () => void,
  metadata?: Record<string, unknown>
): number {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  metrics.push({
    name,
    duration,
    timestamp: Date.now(),
    metadata,
  });

  // Keep only last 100 metrics
  if (metrics.length > 100) {
    metrics.shift();
  }

  return duration;
}

/**
 * Get recorded performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetric[] {
  return [...metrics];
}

/**
 * Clear all performance metrics
 */
export function clearPerformanceMetrics(): void {
  metrics.length = 0;
}

// ============================================================
// Image Optimization Helpers
// ============================================================

/**
 * Generate responsive srcSet for images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 480, 640, 768, 1024, 1200, 1920]
): string {
  return widths
    .map((width) => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(
  breakpoints: { maxWidth: string; size: string }[] = [
    { maxWidth: '640px', size: '100vw' },
    { maxWidth: '1024px', size: '50vw' },
    { maxSize: 'infinite', size: '33vw' },
  ]
): string {
  return breakpoints
    .map((bp) => `(max-width: ${bp.maxWidth}) ${bp.size}`)
    .join(', ');
}
