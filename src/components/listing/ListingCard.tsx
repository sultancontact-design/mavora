'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  MapPin,
  Eye,
  Star,
  BadgeCheck,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import type { Listing, Locale, Currency, Category, Country, City, User } from '@/lib/types';

// ─── Props ──────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: Listing;
  onFavorite?: (listingId: string) => void;
  isFavorited?: boolean;
  showSeller?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

// ─── Helpers ────────────────────────────────────────────────────────

function getLocalizedName(
  item: { name_ar?: string; name_fr?: string; name_en?: string },
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return item.name_ar ?? item.name_en ?? '';
    case 'fr': return item.name_fr ?? item.name_en ?? '';
    default: return item.name_en ?? '';
  }
}

function formatPrice(
  price: number | null,
  currency: Currency | null | undefined,
  locale: Locale
): string {
  if (price === null || price === undefined) {
    return locale === 'ar' ? 'مجاني' : locale === 'fr' ? 'Gratuit' : 'Free';
  }
  
  const symbol = currency?.symbol ?? '';
  const formatted = price.toLocaleString(locale);
  
  return locale === 'ar' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

function timeAgo(dateString: string, locale: Locale): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = [
    { label: locale === 'ar' ? 'سنة' : locale === 'fr' ? 'an' : 'year', seconds: 31536000 },
    { label: locale === 'ar' ? 'شهر' : locale === 'fr' ? 'mois' : 'month', seconds: 2592000 },
    { label: locale === 'ar' ? 'أسبوع' : locale === 'fr' ? 'semaine' : 'week', seconds: 604800 },
    { label: locale === 'ar' ? 'يوم' : locale === 'fr' ? 'jour' : 'day', seconds: 86400 },
    { label: locale === 'ar' ? 'ساعة' : locale === 'fr' ? 'heure' : 'hour', seconds: 3600 },
    { label: locale === 'ar' ? 'دقيقة' : locale === 'fr' ? 'minute' : 'minute', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return locale === 'ar' ? `منذ ${count} ${interval.label}` 
        : locale === 'fr' ? `Il y a ${count} ${interval.label}${count > 1 ? 's' : ''}`
        : `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  
  return locale === 'ar' ? 'الآن' : locale === 'fr' ? 'À l\'instant' : 'Just now';
}

// ─── Animation Variants ─────────────────────────────────────────────

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// ─── Component ──────────────────────────────────────────────────────

export default function ListingCard({
  listing,
  onFavorite,
  isFavorited = false,
  showSeller = false,
  variant = 'default',
}: ListingCardProps) {
  const { t, locale } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const [favState, setFavState] = useState(isFavorited);
  const [imageError, setImageError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Get primary image or first image
  const primaryImage = useMemo(() => {
    if (!listing.media || listing.media.length === 0) return null;
    const primary = listing.media.find((m) => m.is_primary);
    return primary ?? listing.media[0];
  }, [listing.media]);

  // Location info
  const locationText = useMemo(() => {
    const parts: string[] = [];
    // Note: We'd need to fetch city/country names separately or include them in the query
    return parts.join(', ');
  }, []);

  // Handle favorite toggle
  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || !user) {
      // Could trigger login modal here
      return;
    }

    if (onFavorite) {
      onFavorite(listing.id);
      setFavState(!favState);
    }
  };

  // Variant-specific rendering
  if (variant === 'compact') {
    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <Link href={`/listings/${listing.id}`}>
          <Card className="group overflow-hidden border-border transition-all duration-300 hover:border-emerald/50 hover:shadow-lg hover:shadow-emerald/5">
            <CardContent className="flex gap-3 p-3">
              {/* Thumbnail */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {primaryImage && !imageError ? (
                  <Image
                    src={primaryImage.url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground/30">
                    <ExternalLink className="size-6" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-foreground group-hover:text-emerald transition-colors">
                  {listing.title}
                </h3>
                <p className="mt-1 text-sm font-bold text-emerald">
                  {formatPrice(listing.price, listing.currency, locale)}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{timeAgo(listing.created_at, locale)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" />
                    {listing.view_count}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <Link href={`/listings/${listing.id}`}>
          <Card className="group overflow-hidden border-2 border-gold/30 bg-gradient-to-br from-card to-gold/5 transition-all duration-300 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/10">
            {/* Featured Badge */}
            <div className="absolute start-3 top-3 z-10">
              <Badge className="bg-gold text-primary border-0 gap-1">
                <Star className="size-3 fill-current" />
                {t('common.featured')}
              </Badge>
            </div>

            {/* Urgent Badge */}
            {listing.is_urgent && (
              <div className="absolute end-3 top-3 z-10">
                <Badge className="bg-destructive text-white border-0">
                  {t('common.urgent')}
                </Badge>
              </div>
            )}

            {/* Image */}
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              {primaryImage && !imageError ? (
                <>
                  {!imgLoaded && (
                    <Skeleton className="absolute inset-0" />
                  )}
                  <Image
                    src={primaryImage.url}
                    alt={listing.title}
                    fill
                    className={`object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                </>
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground/30">
                  <ExternalLink className="size-12" />
                </div>
              )}

              {/* Favorite Button */}
              <button
                onClick={handleFavorite}
                className={`absolute end-3 bottom-3 flex size-9 items-center justify-center rounded-full backdrop-blur-sm transition-all ${
                  favState 
                    ? 'bg-destructive text-white' 
                    : 'bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60'
                }`}
                aria-label={favState ? t('listing.detail.remove_from_favorites') : t('listing.detail.add_to_favorites')}
              >
                <Heart className={`size-4 ${favState ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Content */}
            <CardContent className="p-4">
              {/* Title */}
              <h3 className="line-clamp-1 text-base font-semibold text-foreground group-hover:text-emerald transition-colors">
                {listing.title}
              </h3>

              {/* Price */}
              <p className="mt-2 text-xl font-bold text-emerald">
                {formatPrice(listing.price, listing.currency, locale)}
              </p>

              {/* Meta */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {getLocalizedName(listing.category ?? {}, locale)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="size-3" />
                  {listing.view_count} {t('listings.views')}
                </span>
                <span>{timeAgo(listing.created_at, locale)}</span>
              </div>

              {/* Seller Info (optional) */}
              {showSeller && listing.seller && (
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                  <div className="relative">
                    {listing.seller.avatar_url ? (
                      <Image
                        src={listing.seller.avatar_url}
                        alt={listing.seller.display_name}
                        width={28}
                        height={28}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {listing.seller.display_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {listing.seller.is_verified && (
                      <BadgeCheck className="absolute -end-1 -top-1 size-4 text-emerald" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {listing.seller.display_name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Link href={`/listings/${listing.id}`}>
        <Card className="group overflow-hidden border-border transition-all duration-300 hover:border-emerald/50 hover:shadow-lg hover:shadow-emerald/5">
          {/* Badges */}
          <div className="absolute start-3 top-3 z-10 flex gap-2">
            {listing.is_featured && (
              <Badge className="bg-gold text-primary border-0 gap-1">
                <Star className="size-3 fill-current" />
                {t('common.featured')}
              </Badge>
            )}
          </div>
          
          {listing.is_urgent && (
            <div className="absolute end-3 top-3 z-10">
              <Badge className="bg-destructive text-white border-0">
                {t('common.urgent')}
              </Badge>
            </div>
          )}

          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            {primaryImage && !imageError ? (
              <>
                {!imgLoaded && (
                  <Skeleton className="absolute inset-0" />
                )}
                <Image
                  src={primaryImage.url}
                  alt={listing.title}
                  fill
                  className={`object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground/30">
                <ExternalLink className="size-12" />
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={handleFavorite}
              className={`absolute end-3 bottom-3 flex size-9 items-center justify-center rounded-full backdrop-blur-sm transition-all ${
                favState 
                  ? 'bg-destructive text-white' 
                  : 'bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60'
              }`}
              aria-label={favState ? t('listing.detail.remove_from_favorites') : t('listing.detail.add_to_favorites')}
            >
              <Heart className={`size-4 ${favState ? 'fill-current' : ''}`} />
            </button>

            {/* Image count indicator */}
            {listing.media && listing.media.length > 1 && (
              <div className="absolute start-3 bottom-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                {listing.media.length}+
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-4">
            {/* Category */}
            {listing.category && (
              <p className="mb-1 text-xs font-medium text-emerald">
                {getLocalizedName(listing.category, locale)}
              </p>
            )}

            {/* Title */}
            <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-emerald transition-colors leading-snug">
              {listing.title}
            </h3>

            {/* Price */}
            <p className="mt-2 text-lg font-bold text-emerald">
              {formatPrice(listing.price, listing.currency, locale)}
            </p>

            {/* Meta Info */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{timeAgo(listing.created_at, locale)}</span>
              <span className="flex items-center gap-1">
                <Eye className="size-3" />
                {listing.view_count}
              </span>
            </div>

            {/* Seller Info (optional) */}
            {showSeller && listing.seller && (
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <div className="relative">
                  {listing.seller.avatar_url ? (
                    <Image
                      src={listing.seller.avatar_url}
                      alt={listing.seller.display_name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                      {listing.seller.display_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {listing.seller.is_verified && (
                    <BadgeCheck className="absolute -end-1 -top-1 size-3.5 text-emerald" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {listing.seller.display_name}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────

export function ListingCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden border-border">
        <CardContent className="flex gap-3 p-3">
          <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="space-y-3 p-4">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-6 w-1/3" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}
