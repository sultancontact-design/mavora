// ============================================================
// 💀 Skeleton Loading Components
// Animated placeholders for loading states
// ============================================================

'use client';

import { cn } from '@/lib/utils';

// ============================================================
// Base Skeleton Component
// ============================================================

interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Border radius */
  radius?: string;
  /** Whether to animate */
  animate?: boolean;
}

export function Skeleton({
  className,
  width,
  height,
  radius = '0.375rem',
  animate = true,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-muted',
        animate && 'animate-pulse',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================
// Text Skeleton
// ============================================================

interface TextSkeletonProps {
  /** Number of lines */
  lines?: number;
  /** Whether last line should be shorter */
  shortenLastLine?: boolean;
  /** Height of each line */
  lineHeight?: number;
  /** Gap between lines */
  gap?: number;
  /** Additional CSS classes */
  className?: string;
}

export function TextSkeleton({
  lines = 3,
  shortenLastLine = true,
  lineHeight = 16,
  gap = 8,
  className,
}: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} aria-label="Loading text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={
            i === lines - 1 && shortenLastLine
              ? `${70 + Math.random() * 20}%`
              : '100%'
          }
        />
      ))}
    </div>
  );
}

// ============================================================
// Avatar Skeleton
// ============================================================

interface AvatarSkeletonProps {
  /** Size of the avatar */
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

const avatarSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
  const sizeValue = typeof size === 'string' ? (avatarSizes[size] ?? 40) : size;

  return (
    <Skeleton
      className={cn('rounded-full', className)}
      width={sizeValue}
      height={sizeValue}
    />
  );
}

// ============================================================
// Image/Thumbnail Skeleton
// ============================================================

interface ImageSkeletonProps {
  /** Width of the image */
  width?: string | number;
  /** Height of the image */
  height?: string | number;
  /** Aspect ratio (alternative to width/height) */
  aspectRatio?: string;
  /** Additional CSS classes */
  className?: string;
}

export function ImageSkeleton({
  width = '100%',
  height,
  aspectRatio = '16/9',
  className,
}: ImageSkeletonProps) {
  return (
    <Skeleton
      className={cn(className)}
      width={width}
      height={height}
      style={{
        ...(height ? {} : { aspectRatio }),
      }}
    />
  );
}

// ============================================================
// Card Skeleton (for listings, products, etc.)
// ============================================================

interface CardSkeletonProps {
  /** Show image area */
  showImage?: boolean;
  /** Show title */
  showTitle?: boolean;
  /** Show description lines */
  descriptionLines?: number;
  /** Show price */
  showPrice?: boolean;
  /** Show footer (location, date) */
  showFooter?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function CardSkeleton({
  showImage = true,
  showTitle = true,
  descriptionLines = 2,
  showPrice = true,
  showFooter = true,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3',
        className
      )}
      aria-label="Loading card"
    >
      {/* Image */}
      {showImage && (
        <ImageSkeleton aspectRatio="4/3" className="w-full" />
      )}

      {/* Title */}
      {showTitle && (
        <Skeleton height={20} width="80%" />
      )}

      {/* Description */}
      {descriptionLines > 0 && (
        <TextSkeleton lines={descriptionLines} lineHeight={14} />
      )}

      {/* Price */}
      {showPrice && (
        <Skeleton height={24} width="40%" />
      )}

      {/* Footer */}
      {showFooter && (
        <div className="flex justify-between pt-2">
          <Skeleton height={12} width="30%" />
          <Skeleton height={12} width="20%" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Listing Grid Skeleton
// ============================================================

interface ListingGridSkeletonProps {
  /** Number of cards to show */
  count?: number;
  /** Grid columns on mobile */
  colsMobile?: number;
  /** Grid columns on tablet */
  colsTablet?: number;
  /** Grid columns on desktop */
  colsDesktop?: number;
  /** Additional CSS classes */
  className?: string;
}

export function ListingGridSkeleton({
  count = 6,
  colsMobile = 1,
  colsTablet = 2,
  colsDesktop = 3,
  className,
}: ListingGridSkeletonProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        `grid-cols-${colsMobile}`,
        `md:grid-cols-${colsTablet}`,
        `lg:grid-cols-${colsDesktop}`,
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${colsMobile}, 1fr)`,
      }}
      aria-label="Loading listings"
    >
      {/* Add responsive styles via inline style for dynamic columns */}
      <style>{`
        @media (min-width: 768px) {
          .listing-grid-skeleton {
            grid-template-columns: repeat(${colsTablet}, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .listing-grid-skeleton {
            grid-template-columns: repeat(${colsDesktop}, 1fr) !important;
          }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================
// Table Skeleton
// ============================================================

interface TableSkeletonProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  cols?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full space-y-3', className)} aria-label="Loading table">
      {/* Header */}
      {showHeader && (
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={`h-${i}`} height={16} flex={1} />
          ))}
        </div>
      )}

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`r-${rowIndex}`} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={`${rowIndex}-${colIndex}`}
              height={14}
              flex={1}
              width={colIndex === 0 ? '80%' : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Profile Page Skeleton
// ============================================================

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6" aria-label="Loading profile">
      {/* Header */}
      <div className="flex items-center gap-4">
        <AvatarSkeleton size="xl" />
        <div className="space-y-2 flex-1">
          <Skeleton height={24} width="200px" />
          <Skeleton height={14} width="150px" />
          <Skeleton height={14} width="100px" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} showImage={false} showFooter={false} className="flex-1" />
        ))}
      </div>

      {/* Content tabs */}
      <div className="space-y-4">
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={32} width={80} radius="1rem" />
          ))}
        </div>
        <ListingGridSkeleton count={4} />
      </div>
    </div>
  );
}

// ============================================================
// Conversation List Skeleton
// ============================================================

export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-label="Loading conversations">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border"
        >
          <AvatarSkeleton size="md" />
          <div className="flex-1 space-y-1">
            <Skeleton height={16} width="60%" />
            <Skeleton height={12} width="80%" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton height={10} width="50px" />
            <Skeleton height={16} width="20px" radius="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Message Thread Skeleton
// ============================================================

export function MessageThreadSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4" aria-label="Loading messages">
      {/* Received message */}
      <div className="flex gap-2 max-w-[80%]">
        <AvatarSkeleton size="sm" />
        <div className="space-y-2">
          <Skeleton height={40} width="250px" radius="1rem" />
          <Skeleton height={10} width="60px" />
        </div>
      </div>

      {/* Sent message */}
      <div className="flex gap-2 max-w-[80%] ml-auto">
        <div className="space-y-2">
          <Skeleton height={60} width="280px" radius="1rem" />
          <Skeleton height={10} width="60px" className="ml-auto" />
        </div>
      </div>

      {/* Typing indicator */}
      <div className="flex gap-2">
        <AvatarSkeleton size="sm" />
        <Skeleton height={32} width="100px" radius="1rem" />
      </div>
    </div>
  );
}

// ============================================================
// Form Skeleton
// ============================================================

interface FormSkeletonProps {
  /** Number of fields */
  fields?: number;
  /** Show submit button */
  showSubmit?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function FormSkeleton({
  fields = 4,
  showSubmit = true,
  className,
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)} aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height={14} width="80px" />
          <Skeleton height={44} width="100%" radius="0.5rem" />
        </div>
      ))}

      {showSubmit && (
        <Skeleton height={44} width="120px" radius="0.5rem" />
      )}
    </div>
  );
}

// ============================================================
// Dashboard Stats Skeleton
// ============================================================

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Loading dashboard stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton
          key={i}
          showImage={false}
          showDescriptionLines={false}
          showFooter={false}
        >
          <div className="p-4 space-y-2">
            <Skeleton height={14} width="60%" />
            <Skeleton height={28} width="40%" />
          </div>
        </CardSkeleton>
      ))}
    </div>
  );
}

// Export all skeletons
export default {
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
};
