/**
 * @description Web Vitals Monitoring for Mavora
 * مراقبة أداء الويب لمافورا
 * Tracks and reports Core Web Vitals
 */

'use client';

import { useEffect, useState } from 'react';

// -------------------------------------------
// Types
// -------------------------------------------

interface Metric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries: PerformanceEntry[];
  navigationType: string;
}

interface WebVitalsConfig {
  reportUrl?: boolean;
  analyticsId?: boolean;
  consoleLog?: boolean;
  sampleRate?: number;
}

// -------------------------------------------
# Thresholds for Core Web Vitals
// -------------------------------------------

const VITAL_THRESHOLDS = {
  // LCP (Largest Contentful Paint) - Loading Performance
  lcp: {
    good: 2500,      // ≤ 2.5s
    needsImprovement: 4000,  // ≤ 4s
  },
  // FID (First Input Delay) - Interactivity
  fid: {
    good: 100,       // ≤ 100ms
    needsImprovement: 300,   // ≤ 300ms
  },
  // INP (Interaction to Next Paint) - Interactivity (replacing FID)
  inp: {
    good: 200,       // ≤ 200ms
    needsImprovement: 500,   // ≤ 500ms
  },
  // CLS (Cumulative Layout Shift) - Visual Stability
  cls: {
    good: 0.1,       // ≤ 0.1
    needsImprovement: 0.25,  // ≤ 0.25
  },
  // TTFB (Time to First Byte) - Server Response
  ttfb: {
    good: 800,       // ≤ 800ms
    needsImprovement: 1800,  // ≤ 1.8s
  },
  // FCP (First Contentful Paint)
  fcp: {
    good: 1800,      // ≤ 1.8s
    needsImprovement: 3000,  // ≤ 3s
  },
};

// -------------------------------------------
# Utility Functions
// -------------------------------------------

function getRating(metricName: string, value: number): Metric['rating'] {
  const thresholds = VITAL_THRESHOLDS[metricName as keyof typeof VITAL_THRESHOLDS];
  
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function getNavigationType(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navEntry) return 'unknown';
  
  switch (navEntry.type) {
    case 'navigate': return 'normal';
    case 'reload': return 'reload';
    case 'back_forward': return 'back_forward';
    case 'prerender': return 'prerender';
    default: return 'other';
  }
}

function generateMetricId(): string {
  return `vital_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// -------------------------------------------
# Reporting Functions
// -------------------------------------------

async function reportMetric(metric: Metric, config: WebVitalsConfig) {
  // Console logging in development
  if (config.consoleLog || process.env.NODE_ENV === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${emoji} [Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`
    );
  }

  // Don't report in development (unless explicitly enabled)
  if (process.env.NODE_ENV === 'development' && !config.reportUrl) {
    return;
  }

  // Sample rate check
  if (config.sampleRate && Math.random() > config.sampleRate) {
    return;
  }

  // Send to analytics endpoint
  try {
    await fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metric,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Silent fail for analytics
    console.debug('Failed to report web vital:', error);
  }
}

// -------------------------------------------
# Main Component
// -------------------------------------------

export default function WebVitalsMonitor({ 
  config = {} 
}: { 
  config?: WebVitalsConfig 
}) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const defaultConfig: WebVitalsConfig = {
    reportUrl: true,
    consoleLog: process.env.NODE_ENV === 'development',
    sampleRate: 0.1, // Report 10% of sessions
    ...config,
  };

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Dynamic import of web-vitals
    let isMounted = true;

    const loadWebVitals = async () => {
      try {
        const { onLCP, onFID, onCLS, onTTFB, onFCP, onINP } = await import('web-vitals');

        // LCP - Largest Contentful Paint
        if (onLCP) {
          onLCP((metric) => {
            if (!isMounted) return;
            const newMetric: Metric = {
              id: generateMetricId(),
              name: 'LCP',
              value: metric.value,
              rating: getRating('lcp', metric.value),
              delta: metric.delta,
              entries: metric.entries,
              navigationType: getNavigationType(),
            };
            setMetrics(prev => [...prev.filter(m => m.name !== 'LCP'), newMetric]);
            reportMetric(newMetric, defaultConfig);
          });
        }

        // FID - First Input Delay
        if (onFID) {
          onFID((metric) => {
            if (!isMounted) return;
            const newMetric: Metric = {
              id: generateMetricId(),
              name: 'FID',
              value: metric.value,
              rating: getRating('fid', metric.value),
              delta: metric.delta,
              entries: metric.entries,
              navigationType: getNavigationType(),
            };
            setMetrics(prev => [...prev, newMetric]);
            reportMetric(newMetric, defaultConfig);
          });
        }

        // INP - Interaction to Next Paint (if supported)
        if (onINP) {
          onINP((metric) => {
            if (!isMounted) return;
            const newMetric: Metric = {
              id: generateMetricId(),
              name: 'INP',
              value: metric.value,
              rating: getRating('inp', metric.value),
              delta: metric.delta,
              entries: metric.entries,
              navigationType: getNavigationType(),
            };
            setMetrics(prev => [...prev.filter(m => m.name !== 'INP'), newMetric]);
            reportMetric(newMetric, defaultConfig);
          });
        }

        // CLS - Cumulative Layout Shift
        if (onCLS) {
          onCLS((metric) => {
            if (!isMounted) return;
            const newMetric: Metric = {
              id: generateMetricId(),
              name: 'CLS',
              value: metric.value,
              rating: getRating('cls', metric.value),
              delta: metric.delta,
              entries: metric.entries,
              navigationType: getNavigationType(),
            };
            setMetrics(prev => [...prev.filter(m => m.name !== 'CLS'), newMetric]);
            reportMetric(newMetric, defaultConfig);
          });
        }

        // TTFB - Time to First Byte
        if (onTTFB) {
          onTTFB((metric) => {
            if (!isMounted) return;
            const newMetric: Metric = {
              id: generateMetricId(),
              name: 'TTFB',
              value: metric.value,
              rating: getRating('ttfb', metric.value),
              delta: metric.delta,
              entries: metric.entries,
              navigationType: getNavigationType(),
            };
            setMetrics(prev => [...prev.filter(m => m.name !== 'TTFB'), newMetric]);
            reportMetric(newMetric, defaultConfig);
          });
        }

        // FCP - First Contentful Paint
        if (onFCP) {
          onFCP((metric) => {
            if (!isMounted) return;
            const newMetric: Metric = {
              id: generateMetricId(),
              name: 'FCP',
              value: metric.value,
              rating: getRating('fcp', metric.value),
              delta: metric.delta,
              entries: metric.entries,
              navigationType: getNavigationType(),
            };
            setMetrics(prev => [...prev.filter(m => m.name !== 'FCP'), newMetric]);
            reportMetric(newMetric, defaultConfig);
          });
        }
      } catch (error) {
        console.warn('Failed to load web-vitals:', error);
      }
    };

    loadWebVitals();

    // Show debug panel in development with Ctrl+Shift+V
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Debug Panel (only in development)
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 max-w-sm"
      dir="rtl"
      style={{ fontFamily: 'monospace', fontSize: '12px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white">📊 Web Vitals</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div 
            key={metric.id}
            className={`p-2 rounded ${
              metric.rating === 'good' ? 'bg-green-50 dark:bg-green-900/20' :
              metric.rating === 'needs-improvement' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
              'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{metric.name}</span>
              <span className={
                metric.rating === 'good' ? 'text-green-600' :
                metric.rating === 'needs-improvement' ? 'text-yellow-600' :
                'text-red-600'
              }>
                {metric.value.toFixed(
                  metric.name === 'CLS' ? 3 : 0
                )}
                {metric.name === 'LCP' || metric.name === 'TTFB' || metric.name === 'FCP' ? 'ms' :
                 metric.name === 'FID' || metric.name === 'INP' ? 'ms' :
                 ''}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Rating: {metric.rating} | Nav: {metric.navigationType}
            </div>
          </div>
        ))}
        
        {metrics.length === 0 && (
          <p className="text-gray-500 text-center py-2">جاري جمع البيانات...</p>
        )}
      </div>
      
      <p className="text-xs text-gray-400 mt-3 text-center">
        اضغط Ctrl+Shift+V للإخفاء
      </p>
    </div>
  );
}

// -------------------------------------------
# Utility Exports
// -------------------------------------------

export { VITAL_THRESHOLDS, getRating, reportMetric };
export type { Metric, WebVitalsConfig };
