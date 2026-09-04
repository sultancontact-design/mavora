/**
 * Mavora - Performance Monitoring & Analytics
 * Arabic Marketplace Platform (Morocco)
 * 
 * This module provides performance tracking, Web Vitals monitoring,
 * and analytics utilities for production monitoring.
 */

// =============================================================================
// Types / الأنواع
// =============================================================================

export interface WebVitals {
  // Core Web Vitals
  FCP?: number;  // First Contentful Paint (ms)
  LCP?: number;  // Largest Contentful Paint (ms)
  FID?: number;  // First Input Delay (ms)
  CLS?: number;  // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte (ms)
  INP?: number;  // Interaction to Next Paint (ms)
  
  // Custom metrics
  TTI?: number;  // Time to Interactive (ms)
  DOMContentLoaded?: number;
  LoadComplete?: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  page: string;
  userAgent: string;
}

export interface PageLoadData {
  url: string;
  referrer: string;
  loadTime: number;
  resourceCount: number;
  resourceSizes: {
    total: number;
    js: number;
    css: number;
    images: number;
    fonts: number;
  };
  webVitals: WebVitals;
}

// =============================================================================
// Thresholds / الحدود
// =============================================================================

const VITAL_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

// =============================================================================
// Rating Function / وظيفة التقييم
// =============================================================================

function getRating(metricName: keyof typeof VITAL_THRESHOLDS, value: number): PerformanceMetric['rating'] {
  const thresholds = VITAL_THRESHOLDS[metricName];
  if (!thresholds) return 'needs-improvement';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// =============================================================================
// Web Vitals Collection / جمع مقاييس الويب
// =============================================================================

let webVitalsData: WebVitals = {};

/**
 * Collect Core Web Vitals using Performance Observer API
 */
export function collectWebVitals(): Promise<WebVitals> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({});
      return;
    }

    const vitals: WebVitals = {};

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          vitals.FCP = fcpEntry.startTime;
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
      // FCP observer not supported
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          vitals.LCP = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP observer not supported
    }

    // First Input Delay / Interaction to Next Paint
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if ('processingStart' in entry) {
            // INP (Interaction to Next Paint)
            vitals.INP = (entry as PerformanceEventTiming).processingStart - entry.startTime;
          } else {
            // FID (First Input Delay)
            vitals.FID = (entry as PerformanceEventTiming).processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // FID/INP observer not supported
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        vitals.CLS = clsValue;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // CLS observer not supported
    }

    // Time to First Byte from navigation timing
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        vitals.TTFB = navEntry.responseStart - navEntry.requestStart;
        vitals.DOMContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.startTime;
        vitals.LoadComplete = navEntry.loadEventEnd - navEntry.startTime;
      }
    } catch (e) {
      // Navigation timing not available
    }

    // Wait a bit for all observers to collect data
    setTimeout(() => {
      webVitalData = { ...vitals };
      resolve(vitals);
    }, 3000);
  });
}

// =============================================================================
// Resource Timing / توقيت الموارد
// =============================================================================

export function getResourceMetrics() {
  if (typeof performance === 'undefined') {
    return null;
  }

  try {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const sizes = {
      total: 0,
      js: 0,
      css: 0,
      images: 0,
      fonts: 0,
    };

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      sizes.total += size;

      if (resource.name.match(/\.(js|mjs)(\?|$)/i)) {
        sizes.js += size;
      } else if (resource.name.match(/\.css(\?|$)/i)) {
        sizes.css += size;
      } else if (resource.name.match(/\.(png|jpg|jpeg|gif|webp|svg|avif)(\?|$)/i)) {
        sizes.images += size;
      } else if (resource.name.match/\.(woff2?|ttf|otf|eot)(\?|$)/i) {
        sizes.fonts += size;
      }
    });

    return {
      count: resources.length,
      sizes,
    };
  } catch (e) {
    return null;
  }
}

// =============================================================================
// Page Load Tracking / تتبع تحميل الصفحة
// =============================================================================

export function trackPageLoad(): PageLoadData | null {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return null;
  }

  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resourceMetrics = getResourceMetrics();

    return {
      url: window.location.href,
      referrer: document.referrer,
      loadTime: navEntry?.loadEventEnd - navEntry?.startTime || 0,
      resourceCount: resourceMetrics?.count || 0,
      resourceSizes: resourceMetrics?.sizes || {
        total: 0,
        js: 0,
        css: 0,
        images: 0,
        fonts: 0,
      },
      webVitals: webVitalData,
    };
  } catch (e) {
    return null;
  }
}

// =============================================================================
// Report Generation / إنشاء التقارير
// =============================================================================

export function generatePerformanceReport(): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = [];
  const now = Date.now();
  const page = typeof window !== 'undefined' ? window.location.pathname : '';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  Object.entries(webVitalData).forEach(([name, value]) => {
    if (value !== undefined) {
      metrics.push({
        name,
        value,
        rating: getRating(name as keyof typeof VITAL_THRESHOLDS, value),
        timestamp: now,
        page,
        userAgent,
      });
    }
  });

  return metrics;
}

// =============================================================================
// Send to Analytics / إرسال للتحليلات
// =============================================================================

interface AnalyticsEndpoint {
  url: string;
  apiKey?: string;
}

let analyticsConfig: AnalyticsEndpoint | null = null;

export function initPerformanceAnalytics(config: AnalyticsEndpoint): void {
  analyticsConfig = config;
}

export async function sendPerformanceData(): Promise<boolean> {
  if (!analyticsConfig) {
    console.warn('[Mavora Performance]: Analytics not configured');
    return false;
  }

  try {
    const report = generatePerformanceReport();
    const pageData = trackPageLoad();

    const response = await fetch(analyticsConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(analyticsConfig.apiKey && { 'Authorization': `Bearer ${analyticsConfig.apiKey}` }),
      },
      body: JSON.stringify({
        metrics: report,
        pageLoad: pageData,
        timestamp: new Date().toISOString(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Mavora Performance]: Failed to send analytics', error);
    return false;
  }
}

// =============================================================================
// Performance Marks & Measures / علامات وقياسات الأداء
// =============================================================================

/**
 * Create a performance mark for custom timing
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined') {
    performance.mark(`mavora-${name}`);
  }
}

/**
 * Measure time between two marks
 */
export function measure(name: string, startMark: string, endMark?: string): number | null {
  if (typeof performance === 'undefined') {
    return null;
  }

  try {
    const startName = `mavora-${startMark}`;
    const endName = endMark ? `mavora-${endMark}` : undefined;
    
    performance.measure(`mavora-${name}`, startName, endName);
    const measures = performance.getEntriesByName(`mavora-${name}`);
    return measures[0]?.duration || null;
  } catch (e) {
    return null;
  }
}

/**
 * Measure async operation duration
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  mark(`${name}-start`);
  const result = await fn();
  mark(`${name}-end`);
  const duration = measure(name, `${name}-start`, `${name}-end`) || 0;
  
  return { result, duration };
}

// =============================================================================
// Debounced Reporting / الإخراج المؤجل
// =============================================================================

let reportTimeout: NodeJS.Timeout | null = null;

/**
 * Schedule a debounced performance report
 */
export function scheduleReport(delay: number = 5000): void {
  if (reportTimeout) {
    clearTimeout(reportTimeout);
  }

  reportTimeout = setTimeout(async () => {
    await sendPerformanceData();
    reportTimeout = null;
  }, delay);
}

// =============================================================================
// React Hook / خطاف ريكت
// =============================================================================

import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook for tracking Web Vitals
 */
export function useWebVitals() {
  const [vitals, setVitals] = useState<WebVitals>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    collectWebVitals().then((data) => {
      setVitals(data);
      setIsLoading(false);
    });
  }, []);

  return { vitals, isLoading };
}

/**
 * Custom hook for measuring render performance
 */
export function useRenderTime(componentName: string) {
  const [renderTime, setRenderTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
      
      // Log slow renders (> 100ms)
      if (endTime - startTime > 100) {
        console.warn(
          `[Mavora Performance] Slow render detected: ${componentName} took ${(endTime - startTime).toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);

  return renderTime;
}

// =============================================================================
// Utility Functions / دوال مساعدة
// =============================================================================

/**
 * Format milliseconds to human-readable string (Arabic)
 */
export function formatDuration(ms: number, locale: string = 'ar-MA'): string {
  if (ms < 1000) {
    return new Intl.NumberFormat(locale).format(Math.round(ms)) + ' ms';
  }
  
  const seconds = ms / 1000;
  if (seconds < 60) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(seconds) + ' ثانية';
  }
  
  const minutes = seconds / 60;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(minutes) + ' دقيقة';
}

/**
 * Get performance score (0-100)
 */
export function getPerformanceScore(vitals: WebVitals): number {
  const scores: number[] = [];
  
  if (vitals.FCP) {
    scores.push(Math.max(0, 100 - ((vitals.FCP - 1800) / 1200) * 100));
  }
  if (vitals.LCP) {
    scores.push(Math.max(0, 100 - ((vitals.LCP - 2500) / 1500) * 100));
  }
  if (vitals.FID) {
    scores.push(Math.max(0, 100 - ((vitals.FID - 100) / 200) * 100));
  }
  if (vitals.CLS !== undefined) {
    scores.push(Math.max(0, 100 - ((vitals.CLS - 0.1) / 0.15) * 100));
  }
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Check if performance is acceptable
 */
export function isPerformanceGood(vitals: WebVitals): boolean {
  return (
    (vitals.FCP ?? 0) <= 3000 &&
    (vitals.LCP ?? 0) <= 4000 &&
    (vitals.FID ?? 0) <= 300 &&
    (vitals.CLS ?? 0) <= 0.25
  );
}
