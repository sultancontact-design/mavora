// ============================================================
// 📦 Lazy Component Loader
// Wrapper for lazy-loading components with error boundary
// ============================================================

import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from './Skeleton';

// ============================================================
// Types
// ============================================================

interface LazyComponentOptions {
  /** Loading component to show while loading */
  LoadingComponent?: React.ComponentType;
  /** Error component to show if loading fails */
  ErrorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Custom error message */
  errorMessage?: string;
}

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

// ============================================================
// Default Loading Components
// ============================================================

function DefaultPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-8">
      <div className="space-y-4 w-full max-w-2xl">
        <Skeleton height={32} width="60%" className="mx-auto" />
        <Skeleton height={200} width="100%" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton height={120} />
          <Skeleton height={120} />
          <Skeleton height={120} />
        </div>
      </div>
    </div>
  );
}

function DefaultModalLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton height={24} width="70%" />
      <Skeleton height={16} width="90%" />
      <Skeleton height={100} width="100%" radius="0.5rem" />
      <div className="flex gap-2 justify-end">
        <Skeleton height={36} width={80} radius="0.5rem" />
        <Skeleton height={36} width={100} radius="0.5rem" />
      </div>
    </div>
  );
}

function DefaultCardLoader() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton aspectRatio="4/3" />
      <Skeleton height={20} width="80%" />
      <Skeleton height={14} width="100%" />
      <Skeleton height={14} width="60%" />
    </div>
  );
}

// ============================================================
// Lazy Loader Wrapper
// ============================================================

/**
 * Wrapper component for Suspense with custom fallbacks
 */
export function LazyLoader({
  children,
  fallback,
  className,
}: LazyLoaderProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className={`flex items-center justify-center p-4 ${className || ''}`}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg
                className="animate-spin size-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm">جارِ التحميل...</span>
            </div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

// ============================================================
// Lazy Component Factory
// ============================================================

/**
 * Creates a lazy-loaded version of a component
 * @param importFn - Dynamic import function
 * @param options - Configuration options
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions & {
    loaderType?: 'page' | 'modal' | 'card' | 'custom';
  } = {}
): React.FC<React.ComponentProps<T>> & { preload: () => Promise<T> }> {
  const {
    loaderType = 'page',
    ...lazyOptions
  } = options;

  // Select default loader based on type
  const getDefaultFallback = () => {
    switch (loaderType) {
      case 'modal':
        return <DefaultModalLoader />;
      case 'card':
        return <DefaultCardLoader />;
      case 'page':
      default:
        return <DefaultPageLoader />;
    }
  };

  // Create lazy component
  const LazyComponent = lazy(importFn);

  // Create wrapped component
  const WrappedComponent = (props: React.ComponentProps<T>) => {
    return (
      <LazyLoader fallback={lazyOptions.LoadingComponent ? <lazyOptions.LoadingComponent /> : getDefaultFallback()}>
        <LazyComponent {...props} />
      </LazyLoader>
    );
  };

  // Add preload method for prefetching
  (WrappedComponent as any).preload = async (): Promise<T> => {
    try {
      const module = await importFn();
      return module.default;
    } catch (error) {
      console.error('[LazyComponent] Preload failed:', error);
      throw error;
    }
  };

  return WrappedComponent as React.FC<React.ComponentProps<T>> & { preload: () => Promise<T> };
}

// ============================================================
// Predefined Lazy Components
// ============================================================

// Admin components (heavy - should be lazy loaded)
export const LazyAdminDashboard = createLazyComponent(
  () => import('@/components/admin/AdminDashboard'),
  { loaderType: 'page' }
);

export const LazyUserManagement = createLazyComponent(
  () => import('@/components/admin/UserManagement'),
  { loaderType: 'page' }
);

export const LazyCategoryManagement = createLazyComponent(
  () => import('@/components/admin/CategoryManagement'),
  { loaderType: 'page' }
);

export const LazyModerationQueue = createLazyComponent(
  () => import('@/components/admin/ModerationQueue'),
  { loaderType: 'page' }
);

// Marketplace components
export const LazyFilterSidebar = createLazyComponent(
  () => import('@/components/marketplace/FilterSidebar'),
  { loaderType: 'card' }
);

export const LazyHeroSection = createLazyComponent(
  () => import('@/components/marketplace/HeroSection'),
  { loaderType: 'card' }
);

// Auth components
export const LazyAuthModal = createLazyComponent(
  () => import('@/components/auth/AuthModal'),
  { loaderType: 'modal' }
);

// Listing components
export const LazyCreateListingForm = createLazyComponent(
  () => import('@/components/listing/CreateListingForm'),
  { loaderType: 'page' }
);

export const LazyImageUploader = createLazyComponent(
  () => import('@/components/media/ImageUploader'),
  { loaderType: 'modal' }
);

// Message components
export const LazyConversationView = createLazyComponent(
  () => import('@/components/messages/ConversationView'),
  { loaderType: 'page' }
);

// Wallet components
export const LazyWalletPage = createLazyComponent(
  () => import('@/components/wallet/WalletPage'),
  { loaderType: 'page' }
);

// Profile components
export const LazyProfilePage = createLazyComponent(
  () => import('@/components/profile/ProfilePage'),
  { loaderType: 'page' }
);

// Favorites components
export const LazyFavoritesPage = createLazyComponent(
  () => import('@/components/favorites/FavoritesPage'),
  { loaderType: 'page' }
);

// Organization components
export const LazyOrganizationPage = createLazyComponent(
  () => import('@/components/organization/OrganizationPage'),
  { loaderType: 'page' }
);

// Invoice components
export const LazyInvoicesPage = createLazyComponent(
  () => import('@/components/invoices/InvoicesPage'),
  { loaderType: 'page' }
);

// Seller components
export const LazySellerProfilePage = createLazyComponent(
  () => import('@/components/seller/SellerProfilePage'),
  { loaderType: 'page' }
);

// ============================================================
// Prefetch Utility
// ============================================================

/**
 * Prefetch multiple lazy components (e.g., on hover or route prediction)
 */
export function prefetchComponents(
  components: Array<{ preload: () => Promise<unknown> }>
): Promise<unknown[]> {
  return Promise.all(components.map((c) => c.preload()));
}

// ============================================================
// Export
// ============================================================

export default {
  LazyLoader,
  createLazyComponent,
  // Predefined lazy components
  LazyAdminDashboard,
  LazyUserManagement,
  LazyCategoryManagement,
  LazyModerationQueue,
  LazyFilterSidebar,
  LazyHeroSection,
  LazyAuthModal,
  LazyCreateListingForm,
  LazyImageUploader,
  LazyConversationView,
  LazyWalletPage,
  LazyProfilePage,
  LazyFavoritesPage,
  LazyOrganizationPage,
  LazyInvoicesPage,
  LazySellerProfilePage,
};
