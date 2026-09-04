'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Star,
  Package,
  ShieldCheck,
  Calendar,
  Loader2,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigationStore } from '@/stores/navigation';
import { useAuthStore } from '@/stores/auth';
import type { Listing, Category, Currency, Locale } from '@/lib/types';

interface SellerProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  created_at: string;
  listing_count: number;
  average_review_rating: number | null;
}

function formatDate(dateStr: string, locale: Locale): string {
  return new Date(dateStr).toLocaleDateString(
    locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'long' }
  );
}

function getLocalizedName(item: { name_ar: string; name_fr: string; name_en: string }, locale: Locale): string {
  switch (locale) {
    case 'ar': return item.name_ar;
    case 'fr': return item.name_fr;
    default: return item.name_en;
  }
}

function ListingCard({ listing, locale, onSelect }: { listing: Listing; locale: Locale; onSelect: (id: string) => void }) {
  const primaryImage = listing.media?.find((m) => m.is_primary) ?? listing.media?.[0];
  const categoryName = listing.category ? getLocalizedName(listing.category, locale) : '';
  const currencySymbol = listing.currency?.symbol ?? '';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card"
      onClick={() => onSelect(listing.id)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-10 text-muted-foreground/30" />
          </div>
        )}
        {listing.is_featured && (
          <Badge className="absolute start-2 top-2 border-0 bg-gold text-xs text-primary">
            <Star className="me-1 size-3" />
          </Badge>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-emerald">
          {listing.title}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{categoryName}</span>
          {listing.price != null && (
            <span className="text-sm font-bold text-emerald">
              {currencySymbol}{listing.price.toLocaleString(locale)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SellerProfilePage() {
  const { t, locale } = useTranslation();
  const { selectedSellerId, navigateHome, navigateDetail } = useNavigationStore();
  const currentUser = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Fetch seller profile
  const fetchProfile = useCallback(async () => {
    if (!selectedSellerId) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/users/${selectedSellerId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // silent
    } finally {
      setLoadingProfile(false);
    }
  }, [selectedSellerId]);

  // Fetch seller's active listings
  const fetchListings = useCallback(async () => {
    if (!selectedSellerId) return;
    setLoadingListings(true);
    try {
      const params = new URLSearchParams({
        userId: selectedSellerId,
        status: 'active',
        per_page: '24',
      });
      const res = await fetch(`/api/listings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingListings(false);
    }
  }, [selectedSellerId]);

  useEffect(() => {
    fetchProfile();
    fetchListings();
  }, [fetchProfile, fetchListings]);

  const handleBack = useCallback(() => {
    navigateHome();
  }, [navigateHome]);

  const handleSelectListing = useCallback((id: string) => {
    navigateDetail(id);
  }, [navigateDetail]);

  // Loading state
  if (loadingProfile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" dir={direction}>
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Skeleton className="size-28 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-24 rounded-lg" />
              <Skeleton className="h-12 w-24 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" dir={direction}>
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <User className="size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('error.not_found')}</p>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" dir={direction}>
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={handleBack}
      >
        <ArrowLeft className="size-4" />
        {t('common.back')}
      </Button>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <Avatar className="size-28 shrink-0 ring-4 ring-emerald/20">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-emerald/10 text-2xl font-bold text-emerald">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 text-center sm:text-start">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              {profile.is_verified ? (
                <Badge variant="secondary" className="gap-1 border-emerald/30 text-emerald">
                  <ShieldCheck className="size-3.5" />
                  {t('seller.verified')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-muted-foreground">
                  {t('seller.unverified')}
                </Badge>
              )}
              {isOwnProfile && (
                <Badge variant="outline" className="text-muted-foreground">
                  {t('profile.title')}
                </Badge>
              )}
            </div>

            {/* Member Since */}
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <Calendar className="size-4" />
              {t('seller.member_since')} {formatDate(profile.created_at, locale)}
            </p>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5">
                <Package className="size-4 text-emerald" />
                <div>
                  <p className="text-lg font-bold text-foreground">{profile.listing_count}</p>
                  <p className="text-xs text-muted-foreground">{t('seller.listings')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5">
                <Star className="size-4 text-emerald" />
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {profile.average_review_rating != null ? profile.average_review_rating.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('seller.reviews')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Seller's Listings */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-foreground">{t('seller.listings')}</h2>

        {loadingListings ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16">
            <Package className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('seller.no_listings')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
                onSelect={handleSelectListing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
