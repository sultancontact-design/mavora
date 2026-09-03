'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ListingCard, { ListingCardSkeleton } from './ListingCard';
import { useTranslation } from '@/hooks/useTranslation';
import type { Listing, PaginatedResponse } from '@/lib/types';

// ─── Props ──────────────────────────────────────────────────────────

interface ListingGridProps {
  listings: Listing[] | null;
  isLoading: boolean;
  error: string | null;
  total?: number;
  page?: number;
  totalPages?: number;
  onFavorite?: (listingId: string) => void;
  favoritedIds?: Set<string>;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  showSeller?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  emptyMessage?: string;
  onRetry?: () => void;
}

// ─── Grid Layout Variants ──────────────────────────────────────────

const gridClasses = {
  default: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  compact: 'flex flex-col gap-3',
  featured: 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
};

const skeletonGridClasses = {
  default: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  compact: 'flex flex-col gap-3',
  featured: 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
};

// ─── Animation Variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ─── Empty State Component ──────────────────────────────────────────

function EmptyState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <AlertCircle className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{t('common.no_results')}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-4 gap-2"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" />
          {t('common.retry')}
        </Button>
      )}
    </motion.div>
  );
}

// ─── Error State Component ──────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{t('common.error')}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-4 gap-2"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" />
          {t('common.retry')}
        </Button>
      )}
    </motion.div>
  );
}

// ─── Loading Skeleton Grid ──────────────────────────────────────────

function SkeletonGrid({ count = 8, variant = 'default' }: { count?: number; variant?: 'default' | 'compact' | 'featured' }) {
  return (
    <div className={skeletonGridClasses[variant]}>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ListingGrid({
  listings,
  isLoading,
  error,
  total,
  page = 1,
  totalPages,
  onFavorite,
  favoritedIds = new Set(),
  onLoadMore,
  isLoadingMore = false,
  showSeller = false,
  variant = 'default',
  emptyMessage,
  onRetry,
}: ListingGridProps) {
  const { t } = useTranslation();

  // Handle favorite toggle
  const handleFavorite = useCallback(
    (listingId: string) => {
      if (onFavorite) {
        onFavorite(listingId);
      }
    },
    [onFavorite]
  );

  // Loading state
  if (isLoading) {
    return <SkeletonGrid count={variant === 'compact' ? 5 : 12} variant={variant} />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  // Empty state
  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        message={emptyMessage ?? t('listings.no_listings_subtitle')}
        onRetry={onRetry}
      />
    );
  }

  // Determine if we can load more
  const canLoadMore = onLoadMore && (!totalPages || page < totalPages);

  return (
    <div>
      {/* Results count */}
      {total !== undefined && (
        <p className="mb-4 text-sm text-muted-foreground">
          {total} {t('listings.no_listings').toLowerCase()}
          {totalPages > 1 && ` • ${t('listings.search_results')} ${page} / ${totalPages}`}
        </p>
      )}

      {/* Listings Grid */}
      <motion.div
        className={gridClasses[variant]}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {listings.map((listing) => (
            <motion.div key={listing.id} variants={itemVariants} layout>
              <ListingCard
                listing={listing}
                onFavorite={handleFavorite}
                isFavorited={favoritedIds.has(listing.id)}
                showSeller={showSeller}
                variant={variant}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More Button */}
      {canLoadMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="gap-2 min-w-[160px]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('common.view_all')
            )}
          </Button>
        </div>
      )}

      {/* End of results indicator */}
      {!canLoadMore && totalPages && totalPages > 1 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {locale === 'ar' 
            ? 'لقد وصلت إلى نهاية النتائج'
            : locale === 'fr' 
            ? 'Vous avez atteint la fin des résultats'
            : "You've reached the end of the results"}
        </p>
      )}
    </div>
  );
}

// ─── Featured Listings Section ──────────────────────────────────────

interface FeaturedListingsProps {
  listings: Listing[] | null;
  isLoading: boolean;
  onListingClick?: (listingId: string) => void;
}

export function FeaturedListings({ 
  listings, 
  isLoading, 
  onListingClick 
}: FeaturedListingsProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <section className="py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <SkeletonGrid count={3} variant="featured" />
      </section>
    );
  }

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <h2 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">
        ⭐ {t('listings.featured')}
      </h2>
      <div className={gridClasses.featured}>
        {listings.slice(0, 6).map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            variant="featured"
            onFavorite={() => onListingClick?.(listing.id)}
          />
        ))}
      </div>
    </section>
  );
}
