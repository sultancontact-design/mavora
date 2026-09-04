// ============================================================
// 📦 Common Components Barrel Export
// Re-exports all shared/common components
// ============================================================

// Performance Components
export { OptimizedImage, Avatar, ThumbnailGrid } from './OptimizedImage';
export { default as OptimizedImageDefault } from './OptimizedImage';

// Skeleton/Loading Components
export {
  Skeleton,
  TextSkeleton,
  AvatarSkeleton,
  ImageSkeleton,
  CardSkeleton,
  ListingGridSkeleton,
  TableSkeleton,
  ProfileSkeleton,
  ConversationListSkeleton,
  MessageThreadSkeleton,
  FormSkeleton,
  DashboardStatsSkeleton,
} from './Skeleton';
export { default as SkeletonDefault } from './Skeleton';

// Lazy Loading Components
export {
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
  prefetchComponents,
} from './LazyComponents';
export { default as LazyComponentsDefault } from './LazyComponents';

// Performance Monitoring
export {
  PerformanceMonitor,
  usePerformanceData,
  reportWebVitals,
} from './PerformanceMonitor';
export { default as PerformanceMonitorDefault } from './PerformanceMonitor';
