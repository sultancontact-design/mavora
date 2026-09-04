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
  item: { name_ar?: string; name_fr?: string; name_en?: string; nameAr?: string; nameFr?: string; name?: string } | null | undefined,
  locale: Locale
): string {
  if (!item) return '';
  switch (locale) {
    case 'ar': return item.nameAr ?? item.name_ar ?? item.name ?? item.name_en ?? '';
    case 'fr': return item.nameFr ?? item.name_fr ?? item.name ?? item.name_en ?? '';
    default: return item.name ?? item.name_en ?? '';
  }
}

function formatPrice(
  price: number | null,
  currency: Currency | null | undefined | string,
  locale: Locale
): string {
  if (price === null || price === undefined) {
    return locale === 'ar' ? 'مجاني' : locale === 'fr' ? 'Gratuit' : 'Free';
  }
  
  // Handle both Currency object and string (currencyCode from API)
  const symbol = typeof currency === 'string' ? currency : currency?.symbol ?? '';
  const formatted = price.toLocaleString(locale);
  
  // For MAD, show the code after the number
  if (symbol === 'MAD') {
    return locale === 'ar' ? `${formatted} د.م` : `${formatted} MAD`;
  }
  
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
    // Handle both isPrimary (camelCase from API) and is_primary (snake_case)
    const primary = listing.media.find((m: Record<string, unknown>) => m.isPrimary || m.is_primary);
    return primary ?? listing.media[0];
  }, [listing.media]);

  // Location info
  const locationText = useMemo(() => {
    const parts: string[] = [];
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
          <Card className="group overflow-hidden border-gray-100 transition-all duration-300 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/10 rounded-2xl">
            <CardContent className="flex gap-4 p-3.5">
              {/* Thumbnail */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                {primaryImage && !imageError ? (
                  <Image
                    src={primaryImage.url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-gray-200">
                    <ExternalLink className="size-6" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                  {listing.title}
                </h3>
                <p className="mt-1.5 text-base font-bold text-teal-600">
                  {formatPrice(listing.price, listing.currency || listing.currencyCode, locale)}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span>{timeAgo(listing.created_at || listing.createdAt, locale)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {listing.view_count || listing.viewCount || 0}
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
          <Card className="group overflow-hidden border-2 border-gold/30 bg-gradient-to-br from-white to-gold/5 transition-all duration-300 hover:border-gold/60 hover:shadow-2xl hover:shadow-gold/15 rounded-2xl">
            {/* Featured Badge */}
            <div className="absolute start-3 top-3 z-10">
              <Badge className="bg-gradient-to-r from-gold to-gold-light text-gray-900 border-0 gap-1.5 font-semibold shadow-lg shadow-gold/30 px-3 py-1 rounded-full">
                <Star className="size-3.5 fill-current" />
                {t('common.featured')}
              </Badge>
            </div>

            {/* Urgent Badge */}
            {listing.is_urgent && (
              <div className="absolute end-3 top-3 z-10">
                <Badge className="bg-gradient-to-r from-coral to-coral-light text-white border-0 font-semibold shadow-lg shadow-coral/30 px-3 py-1 rounded-full">
                  {t('common.urgent')}
                </Badge>
              </div>
            )}

            {/* Image */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gray-50">
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
                <div className="flex size-full items-center justify-center text-gray-200">
                  <ExternalLink className="size-12" />
                </div>
              )}

              {/* Favorite Button */}
              <button
                onClick={handleFavorite}
                className={`absolute end-3 bottom-3 flex size-10 items-center justify-center rounded-xl backdrop-blur-md transition-all duration-200 ${
                  favState 
                    ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg'
                    : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50'
                }`}
                aria-label={favState ? t('listing.detail.remove_from_favorites') : t('listing.detail.add_to_favorites')}
              >
                <Heart className={`size-4.5 ${favState ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Content */}
            <CardContent className="p-5">
              {/* Title */}
              <h3 className="line-clamp-1 text-base font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                {listing.title}
              </h3>

              {/* Price */}
              <p className="mt-2.5 text-xl font-bold bg-gradient-to-r from-gold-dark to-gold bg-clip-text text-transparent">
                {formatPrice(listing.price, listing.currency || listing.currencyCode, locale)}
              </p>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-teal-500" />
                  {getLocalizedName(listing.category ?? {}, locale)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4 text-teal-500" />
                  {listing.view_count || listing.viewCount || 0} {t('listings.views')}
                </span>
                <span>{timeAgo(listing.created_at || listing.createdAt, locale)}</span>
              </div>

              {/* Seller Info (optional) */}
              {showSeller && listing.seller && (
                <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className="relative">
                    {listing.seller.avatar_url ? (
                      <Image
                        src={listing.seller.avatar_url}
                        alt={listing.seller.display_name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover ring-2 ring-teal-200"
                      />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-xs font-bold">
                        {listing.seller.display_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {(listing.seller.is_verified || listing.seller.isVerified) && (
                      <BadgeCheck className="absolute -end-1 -top-1 size-4 text-teal-500" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
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
        <Card className="group overflow-hidden border-gray-100 transition-all duration-300 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/10 rounded-2xl">
          {/* Badges */}
          <div className="absolute start-3 top-3 z-10 flex gap-2">
            {(listing.is_featured || listing.isFeatured) && (
              <Badge className="bg-gradient-to-r from-gold to-gold-light text-gray-900 border-0 gap-1.5 font-semibold shadow-lg shadow-gold/30 px-2.5 py-1 rounded-full">
                <Star className="size-3 fill-current" />
                {t('common.featured')}
              </Badge>
            )}
          </div>
          
          {(listing.is_urgent || listing.isUrgent) && (
            <div className="absolute end-3 top-3 z-10">
              <Badge className="bg-gradient-to-r from-coral to-coral-light text-white border-0 font-semibold shadow-lg shadow-coral/30 px-2.5 py-1 rounded-full">
                {t('common.urgent')}
              </Badge>
            </div>
          )}

          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
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
              <div className="flex size-full items-center justify-center text-gray-200">
                <ExternalLink className="size-12" />
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={handleFavorite}
              className={`absolute end-3 bottom-3 flex size-10 items-center justify-center rounded-xl backdrop-blur-md transition-all duration-200 ${
                favState 
                  ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg'
                  : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50'
              }`}
              aria-label={favState ? t('listing.detail.remove_from_favorites') : t('listing.detail.add_to_favorites')}
            >
              <Heart className={`size-4.5 ${favState ? 'fill-current' : ''}`} />
            </button>

            {/* Image count indicator */}
            {listing.media && listing.media.length > 1 && (
              <div className="absolute start-3 bottom-3 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs text-white">
                {listing.media.length}+
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-5">
            {/* Category */}
            {listing.category && (
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-600">
                {getLocalizedName(listing.category, locale)}
              </p>
            )}

            {/* Title */}
            <h3 className="line-clamp-2 text-base font-bold text-gray-900 group-hover:text-teal-600 transition-colors leading-snug">
              {listing.title}
            </h3>

            {/* Price */}
            <p className="mt-2.5 text-lg font-bold text-teal-600">
              {formatPrice(listing.price, listing.currency || listing.currencyCode, locale)}
            </p>

            {/* Meta Info */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <span>{timeAgo(listing.created_at || listing.createdAt, locale)}</span>
              <span className="flex items-center gap-1.5">
                <Eye className="size-4 text-teal-400" />
                {listing.view_count || listing.viewCount || 0}
              </span>
            </div>

            {/* Seller Info (optional) */}
            {showSeller && listing.seller && (
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="relative">
                  {listing.seller.avatar_url ? (
                    <Image
                      src={listing.seller.avatar_url}
                      alt={listing.seller.display_name}
                      width={28}
                      height={28}
                      className="rounded-full object-cover ring-2 ring-teal-200"
                    />
                  ) : (
                    <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-[10px] font-bold">
                      {listing.seller.display_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {(listing.seller.is_verified || listing.seller.isVerified) && (
                    <BadgeCheck className="absolute -end-1 -top-1 size-3.5 text-teal-500" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-600">
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
      <Card className="overflow-hidden border-gray-100 rounded-2xl">
        <CardContent className="flex gap-3.5 p-3.5">
          <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-100 rounded-2xl">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardContent className="space-y-3.5 p-5">
        <Skeleton className="h-3 w-1/4 rounded-lg" />
        <Skeleton className="h-5 w-full rounded-lg" />
        <Skeleton className="h-6 w-1/3 rounded-lg" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-4 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
