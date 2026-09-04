'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Share2,
  MapPin,
  Eye,
  Calendar,
  Tag,
  Phone,
  MessageCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  BadgeCheck,
  Star,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';
import ReportDialog from '@/components/common/ReportDialog';
import ReviewsSection from './ReviewsSection';
import type { 
  Listing, 
  ListingMedia, 
  ListingFieldValue, 
  CategoryField, 
  Locale,
  User,
  Category,
  Currency
} from '@/lib/types';

// ─── Props ──────────────────────────────────────────────────────────

interface ListingDetailProps {
  listingId?: string;
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
  price: number | null | undefined,
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

function formatDate(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(
    locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
}

// ─── Types ──────────────────────────────────────────────────────────

interface ExtendedListing extends Listing {
  field_values?: (ListingFieldValue & { field?: CategoryField })[];
}

// ─── Animation Variants ─────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// ─── Image Gallery Component ────────────────────────────────────────

function ImageGallery({ 
  media, 
  title 
}: { 
  media: ListingMedia[]; 
  title: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentImage = media[currentIndex];
  const hasMultipleImages = media.length > 1;

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  if (!currentImage) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-muted">
        <ExternalLink className="size-12 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted group">
        <Image
          src={currentImage.url}
          alt={`${title} - ${currentIndex + 1}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          priority
        />
        
        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrev}
              className="absolute start-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute end-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Zoom/Lightbox button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100"
          aria-label="Zoom image"
        >
          <ZoomIn className="size-4" />
        </button>

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute start-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {media.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                idx === currentIndex
                  ? 'border-emerald ring-2 ring-emerald/20'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <Image
                src={m.url}
                alt=""
                fill
                className="object-cover"
              />
              {m.is_primary && (
                <div className="absolute start-1 top-1 flex items-center gap-0.5 rounded bg-emerald px-1 py-0.5">
                  <Star className="size-2.5 fill-white text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute end-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close lightbox"
            >
              <X className="size-5" />
            </button>

            {hasMultipleImages && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute start-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-lg"
            >
              <Image
                src={currentImage.url}
                alt={title}
                width={1200}
                height={900}
                className="max-h-[85vh] w-auto object-contain"
              />
            </motion.div>

            {hasMultipleImages && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute end-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ListingDetail({ listingId: propListingId }: ListingDetailProps) {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();

  const listingId = propListingId || (params?.id as string);
  
  const [listing, setListing] = useState<ExtendedListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Fetch listing data
  const fetchListing = useCallback(async () => {
    if (!listingId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/listings/${listingId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch listing');
      }

      setListing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  // Check favorite status
  const checkFavoriteStatus = useCallback(async () => {
    if (!listingId || !isAuthenticated || !user) return;

    try {
      const res = await fetch(`/api/favorites?listing_id=${listingId}`);
      if (res.ok) {
        const data = await res.json();
        // Check if this listing is in favorites
        const isFav = Array.isArray(data) && data.some((f: { listing_id: string }) => f.listing_id === listingId);
        setIsFavorited(isFav);
      }
    } catch {
      // Ignore errors for favorite check
    }
  }, [listingId, isAuthenticated, user]);

  useEffect(() => {
    fetchListing();
    checkFavoriteStatus();
  }, [fetchListing, checkFavoriteStatus]);

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!isAuthenticated || !user || !listingId) {
      toast.error(t('favorites.login_required'));
      return;
    }

    setIsFavoriteLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/favorite`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to update favorite');

      const data = await res.json();
      setIsFavorited(data.favorited);
      toast.success(data.favorited ? t('favorites.added') : t('favorites.removed'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: listing?.description?.slice(0, 150),
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  // Handle contact seller
  const handleContactSeller = () => {
    if (!isAuthenticated) {
      toast.error(t('auth.login_to_continue'));
      return;
    }
    // Navigate to messages or open conversation
    router.push(`/messages?listing=${listingId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="mb-4 size-12 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">{t('error.not_found')}</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  // Get localized values
  const categoryName = getLocalizedName(listing.category ?? {}, locale);
  const sellerName = listing.seller?.display_name ?? 'Unknown Seller';

  return (
    <motion.div
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      {/* Breadcrumb / Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        {t('listings.back_to_browse')}
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Column - Images & Description */}
        <div className="space-y-6 lg:col-span-3">
          {/* Image Gallery */}
          <ImageGallery media={listing.media} title={listing.title} />

          {/* Title & Badges */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {listing.is_featured && (
                <Badge className="bg-gold text-primary border-0 gap-1">
                  <Star className="size-3 fill-current" />
                  {t('common.featured')}
                </Badge>
              )}
              {listing.is_urgent && (
                <Badge className="bg-destructive text-white border-0">
                  {t('common.urgent')}
                </Badge>
              )}
              <Badge variant="secondary">{categoryName}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {listing.title}
            </h1>
          </div>

          {/* Price */}
          <div className="text-3xl font-bold text-emerald">
            {formatPrice(listing.price, listing.currency, locale)}
          </div>

          {/* Posted Date & Views */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {formatDate(listing.created_at, locale)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-4" />
              {listing.view_count} {t('listings.views')}
            </span>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {t('listing.detail.description')}
            </h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </div>
          </div>

          {/* Dynamic Field Values */}
          {listing.field_values && listing.field_values.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  {t('listing.dynamic_fields')}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {listing.field_values.map((fv) => (
                    fv.field && (
                      <div
                        key={fv.id}
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                      >
                        <span className="text-sm text-muted-foreground">
                          {getLocalizedName(fv.field, locale)}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {fv.value}
                          {fv.field.unit_ar && (
                            <span className="ms-1 text-muted-foreground">
                              ({getLocalizedName(
                                { 
                                  name_ar: fv.field.unit_ar, 
                                  name_fr: fv.field.unit_fr, 
                                  name_en: fv.field.unit_en 
                                }, 
                                locale
                              )})
                            </span>
                          )}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Video Embed */}
          {listing.video_url && (
            <>
              <Separator />
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  {t('listing.video_preview')}
                </h2>
                <div className="aspect-video overflow-hidden rounded-xl">
                  <iframe
                    src={listing.video_url.replace('watch?v=', 'embed/')}
                    title="Video"
                    className="h-full w-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            </>
          )}

          {/* Reviews Section */}
          <ReviewsSection listingId={listing.id} sellerId={listing.userId} />
        </div>

        {/* Right Column - Seller Info & Actions */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            {/* Price (Mobile Hidden, Desktop Show) */}
            <Card className="lg:hidden">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-emerald">
                  {formatPrice(listing.price, listing.currency, locale)}
                </div>
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/30 pb-4">
                <CardTitle className="text-base">{t('listing.detail.seller')}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {listing.seller && (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {listing.seller.avatar_url ? (
                        <Image
                          src={listing.seller.avatar_url}
                          alt={sellerName}
                          width={56}
                          height={56}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-14 items-center justify-center rounded-full bg-emerald/10 text-lg font-bold text-emerald">
                          {sellerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {listing.seller.is_verified && (
                        <BadgeCheck className="absolute -bottom-0.5 -end-0.5 size-5 rounded-full border-2 border-background text-emerald" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{sellerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('seller.member_since')} {formatDate(listing.seller.created_at, locale)}
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full gap-2 bg-emerald hover:bg-emerald/90"
                    onClick={handleContactSeller}
                  >
                    <MessageCircle className="size-4" />
                    {t('listings.contact_seller')}
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className={`gap-2 ${isFavorited ? 'border-destructive text-destructive hover:bg-destructive/10' : ''}`}
                      onClick={handleFavoriteToggle}
                      disabled={isFavoriteLoading}
                    >
                      <Heart className={`size-4 ${isFavorited ? 'fill-current' : ''}`} />
                      {isFavorited ? t('listing.detail.remove_from_favorites') : t('listing.detail.add_to_favorites')}
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="size-4" />
                      {t('listing.detail.share')}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground hover:text-destructive"
                    onClick={() => setShowReportDialog(true)}
                  >
                    <Flag className="size-4" />
                    {t('listing.detail.report')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips Card */}
            <Card className="bg-amber/5 border-amber/20">
              <CardContent className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-dark">
                  ⚠️ {locale === 'ar' ? 'نصائح الأمان' : locale === 'fr' ? "Conseils de sécurité" : 'Safety Tips'}
                </h3>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>• {locale === 'ar' ? 'قابل البائع في مكان عام' : locale === 'fr' ? 'Rencontre le vendeur dans un lieu public' : 'Meet in a public place'}</li>
                  <li>• {locale === 'ar' ? 'افحص المنتج قبل الدفع' : locale === 'fr' ? 'Inspectez l\'article avant de payer' : 'Inspect the item before payment'}</li>
                  <li>• {locale === 'ar' ? 'ادفع فقط بعد استلام المنتج' : locale === 'fr' ? 'Payez seulement après réception' : 'Pay only after receiving the item'}</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        targetType="listing"
        targetId={listing.id}
      />
    </motion.div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────

export function ListingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
