'use client';

import { useEffect, useState, useCallback } from 'react';
import { Heart, ArrowLeft, Clock, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigationStore } from '@/stores/navigation';
import { useAuthStore } from '@/stores/auth';
import type { Listing, PaginatedResponse, Locale } from '@/lib/types';

// ─── Helpers ────────────────────────────────────────────────────────

function getLocalizedName(item: { name_ar: string; name_fr: string; name_en: string }, locale: Locale): string {
  switch (locale) {
    case 'ar': return item.name_ar;
    case 'fr': return item.name_fr;
    default: return item.name_en;
  }
}

function timeAgo(dateStr: string, locale: Locale): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const months = Math.floor(days / 30);

  if (locale === 'ar') {
    if (minutes < 1) return '\u0627\u0644\u0622\u0646';
    if (minutes < 60) return `\u0645\u0646\u0630 ${minutes} \u062f\u0642\u064a\u0642\u0629`;
    if (hours < 24) return `\u0645\u0646\u0630 ${hours} \u0633\u0627\u0639\u0629`;
    if (days < 30) return `\u0645\u0646\u0630 ${days} \u064a\u0648\u0645`;
    return `\u0645\u0646\u0630 ${months} \u0634\u0647\u0631`;
  }
  if (locale === 'fr') {
    if (minutes < 1) return "\u00e0 l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 30) return `il y a ${days}j`;
    return `il y a ${months}m`;
  }
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${months}mo ago`;
}

// ─── Favorite Card ──────────────────────────────────────────────────

function FavoriteCard({
  listing,
  onClick,
  onRemove,
  locale,
}: {
  listing: Listing;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const primaryImage = listing.media?.find((m) => m.is_primary) ?? listing.media?.[0];
  const categoryName = listing.category
    ? getLocalizedName(listing.category, locale)
    : '';

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-emerald/40 hover:shadow-lg hover:shadow-emerald/5">
      {/* Image */}
      <button
        onClick={onClick}
        className="relative block w-full aspect-[4/3] overflow-hidden bg-muted text-start"
      >
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={listing.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/30">
            <Eye className="size-10" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute start-2 top-2 flex gap-1.5">
          {listing.is_featured && (
            <Badge className="border-0 bg-gold text-primary text-[10px] font-semibold">
              {t('common.featured')}
            </Badge>
          )}
          {listing.is_urgent && (
            <Badge className="border-0 bg-destructive text-white text-[10px] font-semibold">
              {t('common.urgent')}
            </Badge>
          )}
        </div>
        {/* Price overlay */}
        {listing.price != null && listing.currency && (
          <div className="absolute bottom-0 end-0 start-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
            <span className="text-base font-bold text-white">
              {listing.currency.symbol}{listing.price.toLocaleString(locale)}
            </span>
          </div>
        )}
      </button>

      {/* Heart remove button - top right */}
      <button
        onClick={onRemove}
        className="absolute end-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
        aria-label={t('listing.detail.remove_from_favorites')}
      >
        <Heart className="size-4 fill-red-500" />
      </button>

      {/* Content */}
      <button
        onClick={onClick}
        className="block w-full p-3 text-start"
      >
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-emerald">
          {listing.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {categoryName && (
            <span className="truncate">{categoryName}</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {timeAgo(listing.created_at, locale)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {listing.view_count}
          </span>
        </div>
      </button>
    </div>
  );
}

// ─── Favorites Page ─────────────────────────────────────────────────

export default function FavoritesPage() {
  const { t, locale } = useTranslation();
  const { navigateHome, navigateDetail } = useNavigationStore();
  const { user } = useAuthStore();

  const [favorites, setFavorites] = useState<PaginatedResponse<Listing> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '12',
      });
      const res = await fetch(`/api/favorites?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = useCallback(async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/listings/${listingId}/favorite`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (!data.favorited) {
          toast.success(t('favorites.removed'));
          // Re-fetch to update the list
          fetchFavorites();
        }
      }
    } catch {
      toast.error(t('common.error'));
    }
  }, [t, fetchFavorites]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back + Title */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={navigateHome}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Heart className="size-5 text-red-500" />
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {t('favorites.title')}
        </h1>
        {favorites && favorites.total > 0 && (
          <Badge variant="secondary" className="text-xs">
            {favorites.total}
          </Badge>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-1 h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites && favorites.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.data.map((listing) => (
              <FavoriteCard
                key={listing.id}
                listing={listing}
                onClick={() => navigateDetail(listing.id)}
                onRemove={(e) => handleRemove(e, listing.id)}
                locale={locale}
              />
            ))}
          </div>

          {/* Pagination */}
          {favorites.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('common.previous')}
              </Button>
              <span className="px-3 text-sm text-muted-foreground">
                {page} / {favorites.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= favorites.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-red-50">
            <Heart className="size-8 text-red-300" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t('favorites.no_favorites')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t('favorites.no_favorites_subtitle')}
          </p>
        </div>
      )}
    </div>
  );
}
