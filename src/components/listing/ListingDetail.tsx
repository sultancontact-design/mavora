'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Share2,
  MapPin,
  Eye,
  Calendar,
  Phone,
  MessageCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  Shield,
  CheckCircle2,
  ExternalLink,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────

interface ListingMedia {
  id: string;
  url: string;
  is_primary?: boolean;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currencyCode: string;
  condition?: string;
  status: string;
  negotiable?: boolean;
  viewCount: number;
  contactPhone?: string;
  locationAddress?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    nameAr?: string;
    slug: string;
  };
  media: ListingMedia[];
  userId: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatPrice(price: number | null, currency: string): string {
  if (price === null || price === undefined) return 'مجاني';
  const symbols: Record<string, string> = { MAD: 'DH', USD: '$', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${price.toLocaleString('ar-MA')} ${symbol}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ar-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Image Gallery (Lightweight) ───────────────────────────────────

function ImageGallery({ media, title }: { media: ListingMedia[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentImage = media[currentIndex];
  const hasMultipleImages = media.length > 1;

  if (!currentImage || media.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-800/50 border border-slate-700/50">
        <div className="text-center p-8">
          <ExternalLink className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">لا توجد صور</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 group">
        <img
          src={currentImage.url}
          alt={`${title} - ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        
        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1))}
              className="absolute start-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1))}
              className="absolute end-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute start-4 bottom-4 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {media.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                idx === currentIndex ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute end-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={currentImage.url}
            alt={title}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── Error State Component ─────────────────────────────────────────

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">عذراً!</h1>
        <p className="text-slate-400 mb-8">{message}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={onBack} variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            العودة للإعلانات
          </Button>
          <Button onClick={() => window.location.reload()} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-video bg-slate-800 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse" />
            <div className="h-12 w-32 bg-slate-800 rounded animate-pulse mt-6" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-full bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ListingDetail({ listingId: propListingId }: { listingId?: string }) {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();

  const listingId = propListingId || (params.id as string);
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch listing data
  const fetchListing = useCallback(async () => {
    if (!listingId) {
      setError('معرف الإعلان مفقود');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/listings/${listingId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل في تحميل الإعلان');
      }

      setListing(data);
    } catch (err) {
      console.error('Failed to fetch listing:', err);
      setError(err instanceof Message ? err.message : 'حدث خطأ أثناء تحميل الإعلان');
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Handlers
  const handleContactSeller = () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      router.push(`/auth/login?redirect=/listings/${listingId}`);
      return;
    }
    toast.success('جاري فتح المحادثة...');
  };

  const handleCallSeller = () => {
    if (listing?.contactPhone) {
      window.open(`tel:${listing.contactPhone}`, '_self');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة');
  };

  // States
  if (isLoading) return <LoadingSkeleton />;
  
  if (error || !listing) {
    return <ErrorState message={error || 'الإعلان غير موجود'} onBack={() => router.push('/listings')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/listings"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للإعلانات
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            <ImageGallery media={listing.media} title={listing.title} />
            
            {/* Quick Actions (Mobile) */}
            <div className="lg:hidden mt-4 flex gap-2">
              <Button onClick={handleContactSeller} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle className="w-4 h-4" />
                تواصل مع البائع
              </Button>
              {listing.contactPhone && (
                <Button onClick={handleCallSeller} variant="outline" className="gap-2">
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {listing.title}
                </h1>
                <button
                  onClick={toggleFavorite}
                  className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                    isFavorite 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {listing.category && (
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                    {listing.category.nameAr || listing.category.name}
                  </Badge>
                )}
                {listing.condition && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    {listing.condition === 'new' ? 'جديد' : listing.condition === 'like_new' ? 'كالجديد' : 'مستعمل'}
                  </Badge>
                )}
                {listing.negotiable && (
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    قابل للتفاوض
                  </Badge>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/20">
              <p className="text-sm text-emerald-400 mb-1">السعر</p>
              <p className="text-4xl font-bold text-white">
                {formatPrice(listing.price, listing.currencyCode)}
              </p>
            </div>

            {/* Seller Info */}
            {listing.user && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg">
                      {(listing.user.display_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{listing.user.display_name || 'بائع'}</p>
                      <p className="text-sm text-slate-500">عضو منذ {formatDate(listing.createdAt)}</p>
                    </div>
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location & Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {listing.locationAddress && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {listing.locationAddress}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {listing.viewCount} مشاهدة
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(listing.createdAt)}
              </span>
            </div>

            <Separator className="bg-slate-800" />

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">الوصف</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {listing.description || 'لا يوجد وصف'}
              </p>
            </div>

            {/* Action Buttons (Desktop) */}
            <div className="hidden lg:flex flex-col gap-3">
              <Button 
                onClick={handleContactSeller} 
                size="lg" 
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-base h-14 shadow-lg shadow-emerald-600/25"
              >
                <MessageCircle className="w-5 h-5" />
                تواصل مع البائع
              </Button>
              
              <div className="flex gap-3">
                {listing.contactPhone && (
                  <Button 
                    onClick={handleCallSeller} 
                    variant="outline" 
                    size="lg" 
                    className="flex-1 gap-2 h-12 border-slate-700 hover:bg-slate-800"
                  >
                    <Phone className="w-4 h-4" />
                    اتصل
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2 h-12 border-slate-700 hover:bg-slate-800"
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2 h-12 border-slate-700 hover:bg-slate-800 text-red-400 hover:text-red-300"
                >
                  <Flag className="w-4 h-4" />
                  إبلاغ
                </Button>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-300 text-sm mb-1">نصائح للأمان</p>
                  <ul className="text-xs text-amber-200/70 space-y-1">
                    <li>• لا ترسل أموالاً قبل استلام المنتج</li>
                    <li>• قابل البائع في مكان عام</li>
                    <li>• افحص المنتج قبل الدفع</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
