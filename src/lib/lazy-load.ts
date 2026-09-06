/**
 * Mavora - Lazy Loading Utilities
 * Arabic Marketplace Platform (Morocco)
 * 
 * Utilities for code splitting, lazy loading, and dynamic imports
 * with optimized loading states for Arabic RTL layout.
 */

import { lazy, Suspense, ComponentType } from 'react';
import dynamic from 'next/dynamic';

// =============================================================================
// Types / الأنواع
// =============================================================================

interface LoadingOptions {
  /** Show skeleton loader instead of spinner */
  useSkeleton?: boolean;
  /** Custom loading component */
  LoadingComponent?: ComponentType;
  /** Delay before showing loader (ms) to prevent flash */
  delay?: number;
  /** Error boundary fallback */
  ErrorComponent?: ComponentType<{ error: Error; retry: () => void }>;
}

interface DynamicImportOptions {
  /** Import the component */
  importFn: () => Promise<any>;
  /** Component options */
  loadingOptions?: LoadingOptions;
  /** Whether to use SSR (default: true) */
  ssr?: boolean;
  /** Custom loading message in Arabic */
  loadingMessage?: string;
}

// =============================================================================
// Loading Components / مكونات التحميل
// =============================================================================

/**
 * Simple spinner loader
 */
export function SpinnerLoader({ 
  size = 'md', 
  message = 'جاري التحميل...' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  message?: string;
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8" dir="rtl">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-primary-600`}
        role="status"
        aria-label={message}
      />
      <p className="mt-4 text-gray-600 text-sm">{message}</p>
    </div>
  );
}

/**
 * Skeleton loader for content
 */
export function SkeletonLoader({ 
  type = 'card', 
  count = 3 
}: { 
  type?: 'card' | 'list' | 'table' | 'detail';
  count?: number;
}) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm p-4 animate-pulse"
            dir="rtl"
          >
            <div className="h-40 bg-gray-200 rounded-lg mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="flex justify-between">
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
          </div>
        ));

      case 'list':
        return Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center p-4 bg-white animate-pulse border-b"
            dir="rtl"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-full ml-4" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        ));

      case 'table':
        return (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" dir="rtl">
            <div className="h-12 bg-gray-200 animate-pulse" />
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex p-4 border-b animate-pulse">
                <div className="flex-1 h-4 bg-gray-200 rounded mx-2" />
                <div className="flex-1 h-4 bg-gray-200 rounded mx-2" />
                <div className="flex-1 h-4 bg-gray-200 rounded mx-2" />
              </div>
            ))}
          </div>
        );

      case 'detail':
        return (
          <div className="max-w-4xl mx-auto p-4" dir="rtl">
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse mb-6" />
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-4/6 mb-6" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded-lg" />
              <div className="h-20 bg-gray-200 rounded-lg" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div>{renderSkeleton()}</div>;
}

/**
 * Full page loading with progress
 */
export function PageLoader({ 
  message = 'جاري تحميل الصفحة...',
  progress
}: { 
  message?: string;
  progress?: number;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center">
        {/* Logo animation */}
        <div className="mb-8 relative">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white text-3xl font-bold">م</span>
          </div>
          <div className="absolute -inset-2 bg-primary-200 rounded-3xl opacity-30 blur-lg animate-ping" />
        </div>

        {/* Message */}
        <p className="text-gray-600 text-lg mb-4">{message}</p>

        {/* Progress bar if provided */}
        {progress !== undefined && (
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-l from-primary-500 to-primary-600 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {/* Animated dots */}
        {progress === undefined && (
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Dynamic Import Helpers / مساعدات الاستيراد الديناميكي
// =============================================================================

const defaultLoadingOptions: Required<LoadingOptions> = {
  useSkeleton: false,
  LoadingComponent: () => <SpinnerLoader />,
  delay: 200,
  ErrorComponent: ({ error, retry }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">حدث خطأ في التحميل</h3>
      <p className="text-gray-600 mb-4 text-sm">{error.message}</p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        إعادة المحاولة
      </button>
    </div>
  ),
};

/**
 * Create a dynamically imported component with loading state
 */
export function createDynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: DynamicImportOptions
) {
  const {
    ssr = true,
    loadingMessage,
    loadingOptions = {},
  } = options || {};

  const mergedOptions = { ...defaultLoadingOptions, ...loadingOptions };

  // Create custom loading component
  const LoadingComponent = () => {
    if (mergedOptions.useSkeleton) {
      return <SkeletonLoader />;
    }
    if (loadingMessage) {
      return <SpinnerLoader message={loadingMessage} />;
    }
    return <mergedOptions.LoadingComponent />;
  };

  return dynamic(() => importFn(), {
    ssr,
    loading: LoadingComponent,
  });
}

// =============================================================================
// Pre-defined Dynamic Components / مكونات ديناميكية محددة مسبقاً
// =============================================================================

/**
 * Heavy components that should be lazy loaded
 */

// Map component (only load when needed)
export const LazyMap = createDynamicComponent(
  () => import('@/components/map/MapComponent'),
  { 
    ssr: false, 
    loadingOptions: { useSkeleton: true },
    loadingMessage: 'جاري تحميل الخريطة...'
  }
);

// Image gallery/lightbox
export const LazyImageGallery = createDynamicComponent(
  () => import('@/components/gallery/ImageGallery'),
  { 
    ssr: false, 
    loadingOptions: { useSkeleton: true, type: 'detail' },
    loadingMessage: 'جاري تحميل المعرض...'
  }
);

// Rich text editor
export const LazyRichTextEditor = createDynamicComponent(
  () => import('@/components/editor/RichTextEditor'),
  { 
    ssr: false, 
    loadingMessage: 'جاري تحميل المحرر...'
  }
);

// Chart/analytics dashboard
export const LazyAnalyticsChart = createDynamicComponent(
  () => import('@/components/charts/AnalyticsChart'),
  { 
    ssr: false, 
    loadingOptions: { useSkeleton: true },
    loadingMessage: 'جاري تحميل الرسوم البيانية...'
  }
);

// Chat/messaging component
export const LazyChatWidget = createDynamicComponent(
  () => import('@/components/chat/ChatWidget'),
  { 
    ssr: false, 
    loadingMessage: 'جاري تحميل الدردشة...'
  }
);

// Payment form
export const LazyPaymentForm = createDynamicComponent(
  () => import('@/components/payments/PaymentForm'),
  { 
    ssr: false, 
    loadingMessage: 'جاري تحميل نموذج الدفع...'
  }
);

// Admin panel
export const LazyAdminPanel = createDynamicComponent(
  () => import('@/components/admin/AdminPanel'),
  { 
    ssr: true, 
    loadingOptions: { useSkeleton: true, type: 'table', count: 5 },
    loadingMessage: 'جاري تحميل لوحة التحكم...'
  }
);

// User profile card
export const LazyUserProfile = createDynamicComponent(
  () => import('@/components/user/UserProfileCard'),
  { 
    ssr: true, 
    loadingOptions: { useSkeleton: true, type: 'detail' },
    loadingMessage: 'جاري تحميل الملف الشخصي...'
  }
);

// Review form
export const LazyReviewForm = createDynamicComponent(
  () => import('@/components/reviews/ReviewForm'),
  { 
    ssr: false, 
    loadingMessage: 'جاري تحميل نموذق التقييم...'
  }
);

// Notification center
export const LazyNotificationCenter = createDynamicComponent(
  () => import('@/components/notifications/NotificationCenter'),
  { 
    ssr: false, 
    loadingOptions: { useSkeleton: true, type: 'list', count: 5 },
    loadingMessage: 'جاري تحميل الإشعارات...'
  }
);

// Search modal with autocomplete
export const LazySearchModal = createDynamicComponent(
  () => import('@/components/search/SearchModal'),
  { 
    ssr: false, 
    loadingMessage: 'جاري تحميل البحث...'
  }
);

// =============================================================================
// Route-based Code Splitting / تقسيم الكود بناءً على المسار
// =============================================================================

/**
 * Lazy-loaded pages for better initial load time
 */

export const LazyListingCreatePage = () => import('@/app/listings/create/page');
export const LazySellerDashboardPage = () => import('@/app/seller/dashboard/page');
export const LazyMessagesPage = () => import('@/app/messages/page');
export const LazyProfilePage = () => import('@/app/profile/page');
export const LazyFavoritesPage = () => import('@/app/favorites/page');
export const LazyWalletPage = () => import('@/app/wallet/page');

// =============================================================================
// Intersection Observer Hook / خطاف مراقب التقاطع
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook for lazy loading elements when they enter viewport
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit & { 
    triggerOnce?: boolean;
  }
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const { triggerOnce = true, ...observerOptions } = options || {};

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      
      if (entry.isIntersecting && triggerOnce) {
        observer.unobserve(element);
      }
    }, observerOptions);

    observer.observe(element);

    return () => observer.disconnect();
  }, [triggerOnce, JSON.stringify(observerOptions)]);

  return [ref, isIntersecting];
}

/**
 * Hook for lazy loading images
 */
export function useLazyImage(
  src: string,
  options?: { threshold?: number; rootMargin?: string }
): [string | null, boolean, (elem: HTMLImageElement) => void] {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const setImageRef = useCallback((elem: HTMLImageElement) => {
    imageRef.current = elem;
  }, []);

  useEffect(() => {
    const element = imageRef.current;
    if (!element || !src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoading(false);
          };
          img.onerror = () => {
            setIsLoading(false);
          };
          img.src = src;
          
          observer.unobserve(element);
        }
      },
      { threshold: options?.threshold ?? 0.1, rootMargin: options?.rootMargin ?? '50px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [src, options?.threshold, options?.rootMargin]);

  return [imageSrc, isLoading, setImageRef];
}

// =============================================================================
// Prefetching / التحميل المسبق
// =============================================================================

/**
 * Prefetch a route when user hovers over link
 */
export function usePrefetch(href: string) {
  const prefetchTimeout = useRef<NodeJS.Timeout>();

  const onMouseEnter = () => {
    // Start prefetch after 100ms of hover (to avoid unnecessary fetches)
    prefetchTimeout.current = setTimeout(() => {
      // Next.js router prefetch
      if (typeof window !== 'undefined' && (window as any).next?.router) {
        (window as any).next.router.prefetch(href);
      }
    }, 100);
  };

  const onMouseLeave = () => {
    if (prefetchTimeout.current) {
      clearTimeout(prefetchTimeout.current);
    }
  };

  return { onMouseEnter, onMouseLeave };
}

// =============================================================================
// Bundle Size Monitoring / مراقبة حجم الحزمة
// =============================================================================

/**
 * Log bundle size in development
 */
export function logBundleSize(componentName: string, module: any) {
  if (process.env.NODE_ENV !== 'development') return;

  // This is a rough estimate - use webpack-bundle-analyzer for accurate results
  const roughSize = JSON.stringify(module).length * 2; // bytes (very approximate)
  
  if (roughSize > 100 * 1024) {
    console.warn(
      `[BundleSize] ${componentName} is large (~${(roughSize / 1024).toFixed(1)}KB). Consider code splitting.`
    );
  } else {
    console.log(
      `[BundleSize] ${componentName}: ~${(roughSize / 1024).toFixed(1)}KB`
    );
  }
}

// =============================================================================
// Export All / تصدير الكل
// =============================================================================

export default {
  SpinnerLoader,
  SkeletonLoader,
  PageLoader,
  createDynamicComponent,
  // Pre-defined lazy components
  LazyMap,
  LazyImageGallery,
  LazyRichTextEditor,
  LazyAnalyticsChart,
  LazyChatWidget,
  LazyPaymentForm,
  LazyAdminPanel,
  LazyUserProfile,
  LazyReviewForm,
  LazyNotificationCenter,
  LazySearchModal,
  // Hooks
  useIntersectionObserver,
  useLazyImage,
  usePrefetch,
};
