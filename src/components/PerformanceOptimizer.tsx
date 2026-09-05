'use client';

/**
 * PerformanceOptimizer - مكون تحسين الأداء
 * 2026 Modern Performance Features
 * 
 * Features:
 * - Lazy loading for images
 * - Code splitting indicators
 * - Performance metrics
 * - Resource hints
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';

// ─── Types ───────────────────────────────────────────────

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface CodeSplitLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: number;
}

// ─── Lazy Image Component ────────────────────────────────

export function LazyImage({
  src,
  alt,
  className = '',
  width = '100%',
  height = 'auto',
  priority = false,
  placeholder = 'skeleton',
  blurDataURL,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);
  const inView = useInView(imgRef, { once: true, margin: "100px" });

  useEffect(() => {
    if (inView && !priority) {
      setIsInView(true);
    }
  }, [inView, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <>
          {placeholder === 'skeleton' && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          {placeholder === 'blur' && blurDataURL && (
            <img
              src={blurDataURL}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
              aria-hidden="true"
            />
          )}
        </>
      )}

      {/* Actual Image */}
      {(isInView || priority) && (
        <motion.img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">فشل تحميل الصورة</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Code Split Loader ───────────────────────────────────

export function CodeSplitLoader({
  children,
  fallback,
  minHeight = 200,
}: CodeSplitLoaderProps) {
  return (
    <div style={{ minHeight }}>
      <React.Suspense
        fallback={
          fallback || (
            <div className="flex items-center justify-center h-full">
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-violet-200 rounded-full" />
                  <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                </div>
                <p className="text-sm text-gray-500">جاري التحميل...</p>
              </motion.div>
            </div>
          )
        }
      >
        {children}
      </React.Suspense>
    </div>
  );
}

// ─── Performance Metrics Display ─────────────────────────

interface PerformanceMetricsProps {
  showDetails?: boolean;
}

export function PerformanceMetrics({ showDetails = false }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<{
    loadTime: number | null;
    fcp: number | null;
    lcp: number | null;
    fid: number | null;
    cls: number | null;
  }>({
    loadTime: null,
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
  });

  useEffect(() => {
    // Measure page load time
    const loadTime = performance.now();
    
    // Observe performance entries
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entry = list.getEntries()[0];
          if (entry) {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entry = list.getEntries()[0];
          if (entry) {
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          setMetrics(prev => ({ ...prev, cls: clsValue }));
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('Performance Observer not supported');
      }
    }

    setMetrics(prev => ({ ...prev, loadTime }));

    return () => {
      // Cleanup observers if needed
    };
  }, []);

  if (!showDetails) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 text-xs font-mono">
      <div className="font-bold mb-2 text-gray-900 dark:text-white">📊 Performance Metrics</div>
      <div className="space-y-1 text-gray-600 dark:text-gray-300">
        {metrics.loadTime && <div>Load Time: {metrics.loadTime.toFixed(0)}ms</div>}
        {metrics.fcp && <div>FCP: {metrics.fcp.toFixed(0)}ms</div>}
        {metrics.lcp && <div>LCP: {metrics.lcp.toFixed(0)}ms</div>}
        {metrics.cls !== null && <div>CLS: {metrics.cls.toFixed(3)}</div>}
      </div>
    </div>
  );
}

// ─── Resource Hints Component ────────────────────────────

interface ResourceHintsProps {
  preconnectUrls?: string[];
  prefetchUrls?: string[];
  preloadResources?: Array<{ href: string; as: string; type?: string }>;
}

export function ResourceHints({
  preconnectUrls = [],
  prefetchUrls = [],
  preloadResources = [],
}: ResourceHintsProps) {
  return (
    <>
      {preconnectUrls.map((url) => (
        <link key={url} rel="preconnect" href={url} crossOrigin="anonymous" />
      ))}
      {prefetchUrls.map((url) => (
        <link key={url} rel="prefetch" href={url} />
      ))}
      {preloadResources.map((resource, i) => (
        <link
          key={i}
          rel="preload"
          href={resource.href}
          as={resource.as as any}
          type={resource.type}
        />
      ))}
    </>
  );
}

// ─── Virtual Scroll List (for long lists) ───────────────

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: 'auto' }}
      className="relative"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Default Export ─────────────────────────────────────

export default {
  LazyImage,
  CodeSplitLoader,
  PerformanceMetrics,
  ResourceHints,
  VirtualScrollList,
};
