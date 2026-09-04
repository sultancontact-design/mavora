// ============================================================
// 📊 Performance Monitor Component
// Tracks Core Web Vitals and custom metrics
// ============================================================

'use client';

import { useEffect, useState, useCallback } from 'react';

// ============================================================
// Types
// ============================================================

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: PerformanceEntry[];
}

interface PerformanceData {
  metrics: Metric[];
  isLowEndDevice: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
}

// ============================================================
// Thresholds for Core Web Vitals
// ============================================================

const VITAL_THRESHOLDS = {
  // LCP (Largest Contentful Paint) - should be <= 2.5s
  LCP: { good: 2500, poor: 4000 },
  // FID (First Input Delay) - should be <= 100ms
  FID: { good: 100, poor: 300 },
  // INP (Interaction to Next Paint) - should be <= 200ms
  INP: { good: 200, poor: 500 },
  // CLS (Cumulative Layout Shift) - should be <= 0.1
  CLS: { good: 0.1, poor: 0.25},
  // TTFB (Time to First Byte) - should be <= 800ms
  TTFB: { good: 800, poor: 1800 },
  // FCP (First Contentful Paint) - should be <= 1.8s
  FCP: { good: 1800, poor: 3000 },
};

// ============================================================
// Rating Calculator
// ============================================================

function getRating(name: string, value: number): Metric['rating'] {
  const threshold = VITAL_THRESHOLDS[name as keyof typeof VITAL_THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// ============================================================
// Connection Detection
// ============================================================

function getConnectionInfo(): {
  isLowEndDevice: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
} {
  // Check for low-end device (limited hardware concurrency)
  const isLowEndDevice = 
    navigator.hardwareConcurrency !== undefined && 
    navigator.hardwareConcurrency <= 4;

  // Check for slow connection
  const connection = (navigator as unknown as { 
    connection?: { 
      effectiveType?: string; 
      saveData?: boolean; 
      downlink?: number; 
    } 
  }).connection;

  const isSlowConnection = !!(
    connection && (
      connection.saveData || 
      (connection.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) ||
      (connection.downlink !== undefined && connection.downlink < 1.5)
    )
  );

  return {
    isLowEndDevice,
    isSlowConnection,
    connectionType: connection?.effectiveType ?? null,
  };
}

// ============================================================
// Main Component
// ============================================================

interface PerformanceMonitorProps {
  /** Enable logging to console */
  logToConsole?: boolean;
  /** Send metrics to analytics endpoint */
  sendToAnalytics?: (data: PerformanceData) => void;
  /** Custom metric collection interval (ms) */
  collectInterval?: number;
  /** Show performance badge in development */
  showBadge?: boolean;
  /** Additional CSS classes for badge */
  className?: string;
}

export function PerformanceMonitor({
  logToConsole = process.env.NODE_ENV === 'development',
  sendToAnalytics,
  collectInterval = 10000,
  showBadge = process.env.NODE_ENV === 'development',
  className,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [connectionInfo, setConnectionInfo] = useState({
    isLowEndDevice: false,
    isSlowConnection: false,
    connectionType: null as string | null,
  });
  const [isVisible, setIsVisible] = useState(false);

  // Collect metrics
  const collectMetrics = useCallback(() => {
    const collectedMetrics: Metric[] = [];

    // Collect Navigation Timing API data
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // TTFB
        collectedMetrics.push({
          name: 'TTFB',
          value: Math.round(navigation.responseStart - navigation.requestStart),
          rating: getRating('TTFB', navigation.responseStart - navigation.requestStart),
        });

        // FCP
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
          collectedMetrics.push({
            name: 'FCP',
            value: Math.round(fcpEntry.startTime),
            rating: getRating('FCP', fcpEntry.startTime),
          });
        }

        // DOM Content Loaded
        collectedMetrics.push({
          name: 'DCL',
          value: Math.round(navigation.domContentLoadedEventEnd),
          rating: getRating('FCP', navigation.domContentLoadedEventEnd), // Use FCP thresholds as reference
        });

        // Window Load
        collectedMetrics.push({
          name: 'Load',
          value: Math.round(navigation.loadEventEnd),
          rating: getRating('LCP', navigation.loadEventEnd), // Use LCP thresholds as reference
        });
      }
    }

    // Collect Paint Timing API data (if available)
    if ('PerformanceObserver' in window) {
      // LCP
      const lcpEntries = performance.getEntries('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lastEntry = lcpEntries[lcpEntries.length - 1];
        collectedMetrics.push({
          name: 'LCP',
          value: Math.round(lastEntry.startTime),
          rating: getRating('LCP', lastEntry.startTime),
        });
      }
    }

    setMetrics(collectedMetrics);
    
    // Log to console in development
    if (logToConsole) {
      console.groupCollapsed('[Performance Monitor] Metrics');
      collectedMetrics.forEach((metric) => {
        const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(`${emoji} ${metric.name}: ${metric.value}ms (${metric.rating})`);
      });
      console.groupEnd();
    }

    // Send to analytics if provided
    if (sendToAnalytics) {
      sendToAnalytics({
        metrics: collectedMetrics,
        ...connectionInfo,
      });
    }
  }, [logToConsole, sendToAnalytics, connectionInfo]);

  // Set up observers and initial collection
  useEffect(() => {
    // Get connection info
    setConnectionInfo(getConnectionInfo());

    // Initial metrics collection after page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
      return () => window.removeEventListener('load', collectMetrics);
    }
  }, [collectMetrics]);

  // Set up periodic collection
  useEffect(() => {
    const interval = setInterval(collectMetrics, collectInterval);
    return () => clearInterval(interval);
  }, [collectMetrics, collectInterval]);

  // Observe LCP changes
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      setMetrics((prev) => {
        const existingIndex = prev.findIndex((m) => m.name === 'LCP');
        const newMetric: Metric = {
          name: 'LCP',
          value: Math.round(lastEntry.startTime),
          rating: getRating('LCP', lastEntry.startTime),
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newMetric;
          return updated;
        }
        return [...prev, newMetric];
      });
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    return () => observer.disconnect();
  }, []);

  // Observe CLS
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as LayoutShift).hadRecentInput) {
          clsValue += (entry as LayoutShift).value;
        }
      }

      setMetrics((prev) => {
        const existingIndex = prev.findIndex((m) => m.name === 'CLS');
        const newMetric: Metric = {
          name: 'CLS',
          value: Math.round(clsValue * 1000) / 1000,
          rating: getRating('CLS', clsValue),
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newMetric;
          return updated;
        }
        return [...prev, newMetric];
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    return () => observer.disconnect();
  }, []);

  // Don't render anything in production unless showBadge is true
  if (!showBadge) return null;

  // Calculate overall score
  const overallScore = metrics.length > 0
    ? Math.round(
        (metrics.filter((m) => m.rating === 'good').length / metrics.length) * 100
      )
    : 100;

  const scoreColor = overallScore >= 80 ? 'text-green-600' : overallScore >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
          bg-background border border-border text-sm font-medium
          hover:bg-muted transition-colors
        `}
      >
        <span className="size-2 rounded-full bg-green-500 animate-pulse" />
        <span className={scoreColor}>{overallScore}%</span>
        <span className="text-muted-foreground text-xs">perf</span>
      </button>

      {/* Expanded Panel */}
      {isVisible && (
        <div className="absolute bottom-12 left-0 w-72 p-4 rounded-lg shadow-xl bg-background border border-border">
          <h3 className="font-semibold text-sm mb-3">📊 Performance Metrics</h3>
          
          {/* Connection Info */}
          <div className="mb-3 p-2 rounded bg-muted text-xs space-y-1">
            <p>Device: {connectionInfo.isLowEndDevice ? '🐌 Low-end' : '⚡ Normal'}</p>
            <p>Connection: {connectionInfo.isSlowConnection ? '📶 Slow' : '🚀 Fast'} ({connectionInfo.connectionType || 'Unknown'})</p>
          </div>

          {/* Metrics List */}
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.name} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{metric.name}</span>
                <span className={`font-medium ${
                  metric.rating === 'good' ? 'text-green-600' :
                  metric.rating === 'needs-improvement' ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {metric.value}{metric.name === 'CLS' ? '' : 'ms'}
                </span>
              </div>
            ))}
            
            {metrics.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Loading metrics...
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 pt-3 border-t flex gap-3 text-xs text-muted-foreground">
            <span>✅ Good</span>
            <span>⚠️ OK</span>
            <span>❌ Poor</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Hook for using performance data
// ============================================================

export function usePerformanceData() {
  const [data, setData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    // This would typically read from the PerformanceMonitor context or global state
    // For now, we'll just return null
    setData(null);
  }, []);

  return data;
}

// ============================================================
// Utility: Report Web Vitals
// ============================================================

/**
 * Report Web Vitals to an analytics endpoint
 */
export function reportWebVitals(
  onPerfEntry?: (metric: any) => void
): void {
  if (typeof document === 'undefined') return;

  if (onPerfEntry && 'performance' in window) {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
      if (onINP) onINP(onPerfEntry);
    });
  }
}

export default PerformanceMonitor;
