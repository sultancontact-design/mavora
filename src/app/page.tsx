'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigationInit } from '@/hooks/useNavigationInit';
import MavoraLogo from '@/components/common/MavoraLogo';
import ListingCard from '@/components/listing/ListingCard';

// ═══════════════════════════════════════════════════════════════
// 2026 MODERN COMPONENTS IMPORTS
// ═══════════════════════════════════════════════════════════════
import HeroSection from '@/components/marketplace/HeroSection';
import StatsBar from '@/components/marketplace/StatsBar';
import FeaturedCategories from '@/components/marketplace/FeaturedCategories';
import HowItWorks from '@/components/marketplace/HowItWorks';
import Testimonials from '@/components/marketplace/Testimonials';
import AppDownloadCTA from '@/components/marketplace/AppDownloadCTA';
import TrustBadges from '@/components/marketplace/TrustBadges';

import type { Listing, Category } from '@/lib/types';

// Mock data for when API is unavailable
const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max - جديد في الصندوق',
    description: 'آيفون 15 برو ماكس 256GB لون تيتانيوم طبيعي - ضمان سنة',
    price: 15000,
    currency: 'MAD',
    location: 'الدار البيضاء',
    category: { id: 'electronics', name: 'إلكترونيات', slug: 'electronics' },
    images: ['https://placehold.co/400x300/1a1a2e/eee?text=iPhone+15+Pro+Max'],
    seller: {
      id: 'seller-1',
      name: 'أحمد محمد',
      avatar: null,
      rating: 4.8,
      isVerified: true
    },
    status: 'active',
    featured: true,
    views: 245,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'شقة فاخرة للإيجار في مركز الدار البيضاء',
    description: 'شقة 120م² مع إطلالة بحرية - طابق 6 مصعد - garage',
    price: 5000,
    currency: 'MAD',
    location: 'الدار البيضاء',
    category: { id: 'realestate', name: 'عقارات', slug: 'realestate' },
    images: ['https://placehold.co/400x300/16213e/eee?text=Apartment+Casablanca'],
    seller: {
      id: 'seller-2',
      name: 'فاطمة الزهراء',
      avatar: null,
      rating: 4.9,
      isVerified: true
    },
    status: 'active',
    featured: true,
    views: 189,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'سيارة تويوتا كامري 2023 - 20,000 كم فقط',
    description: 'تويوتا كامري هايبريد 2023 لون أبيض - حالة ممتازة',
    price: 280000,
    currency: 'MAD',
    location: 'الرباط',
    category: { id: 'cars', name: 'سيارات', slug: 'cars' },
    images: ['https://placehold.co/400x300/0f3460/eee?text=Toyota+Camry+2023'],
    seller: {
      id: 'seller-3',
      name: 'محمد الأمين',
      avatar: null,
      rating: 4.7,
      isVerified: true
    },
    status: 'active',
    featured: true,
    views: 567,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'كنبة مودرن 3 مقاعد - حالة ممتازة',
    description: 'كنبة إيطالية أصلية - جلد طبيعي - شراء قبل شهرين',
    price: 3500,
    currency: 'MAD',
    location: 'مراكش',
    category: { id: 'furniture', name: 'أثاث', slug: 'furniture' },
    images: ['https://placehold.co/400x300/533483/eee?text=Modern+Sofa'],
    seller: {
      id: 'seller-4',
      name: 'سعيد',
      avatar: null,
      rating: 4.5,
      isVerified: false
    },
    status: 'active',
    featured: true,
    views: 98,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'لابتوب Dell XPS 15 - OLED Touch',
    description: 'Dell XPS 9530 i7 32GB RAM 1TB SSD RTX 4060 - ضمان',
    price: 12000,
    currency: 'MAD',
    location: 'فاس',
    category: { id: 'electronics', name: 'إلكترونيات', slug: 'electronics' },
    images: ['https://placehold.co/400x300/1a1a2e/eee?text=Dell+XPS+15'],
    seller: {
      id: 'seller-1',
      name: 'أحمد محمد',
      avatar: null,
      rating: 4.8,
      isVerified: true
    },
    status: 'active',
    featured: true,
    views: 334,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'دراجة هوائية جبلية Trek - جديدة',
    description: 'Trek Marlin 7 2024 - إطار M - لم تستخدم أبداً',
    price: 2500,
    currency: 'MAD',
    location: 'أكادير',
    category: { id: 'sports', name: 'رياضة', slug: 'sports' },
    images: ['https://placehold.co/400x300/e94560/eee?text=Mountain+Bike'],
    seller: {
      id: 'seller-5',
      name: 'كريم',
      avatar: null,
      rating: 4.6,
      isVerified: true
    },
    status: 'active',
    featured: true,
    views: 156,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    title: 'مكنسة روبوت سامسونج Jet Bot AI+',
    description: 'سامسونج Jet Bot AI+ - ذكية - تعمل مع التطبيق',
    price: 1800,
    currency: 'MAD',
    location: 'طنجة',
    category: { id: 'appliances', name: 'أجهزة منزلية', slug: 'appliances' },
    images: ['https://placehold.co/400x300/0f3460/eee?text=Samsung+Robot+Vacuum'],
    seller: {
      id: 'seller-6',
      name: 'نادية',
      avatar: null,
      rating: 4.4,
      isVerified: false
    },
    status: 'active',
    featured: true,
    views: 78,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    title: 'جهاز iPad Pro 12.9 M2 256GB WiFi',
    description: 'آيباد برو 2022 مع Apple Pencil 2 - لونه فضي',
    price: 9000,
    currency: 'MAD',
    location: 'الدار البيضاء',
    category: { id: 'electronics', name: 'إلكترونيات', slug: 'electronics' },
    images: ['https://placehold.co/400x300/1a1a2e/eee?text=iPad+Pro+12.9'],
    seller: {
      id: 'seller-7',
      name: 'ليلى',
      avatar: null,
      rating: 4.9,
      isVerified: true
    },
    status: 'active',
    featured: true,
    views: 412,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'electronics', name: 'إلكترونيات', slug: 'electronics', icon: '📱', listingCount: 156 },
  { id: 'realestate', name: 'عقارات', slug: 'realestate', icon: '🏠', listingCount: 89 },
  { id: 'cars', name: 'سيارات', slug: 'cars', icon: '🚗', listingCount: 67 },
  { id: 'furniture', name: 'أثاث', slug: 'furniture', icon: '🛋️', listingCount: 45 },
  { id: 'fashion', name: 'أزياء', slug: 'fashion', icon: '👗', listingCount: 134 },
  { id: 'sports', name: 'رياضة', slug: 'sports', icon: '⚽', listingCount: 78 },
  { id: 'appliances', name: 'أجهزة منزلية', slug: 'appliances', icon: '🏠', listingCount: 56 },
  { id: 'jobs', name: 'وظائف', slug: 'jobs', icon: '💼', listingCount: 92 },
];

/* ── Homepage Component ── */

export default function HomePage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';
  
  // Initialize navigation (important for RTL)
  useNavigationInit();

  // State for data fetching
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Fetch featured listings
  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        const res = await fetch('/api/listings?limit=8&featured=true');
        if (res.ok) {
          const data = await res.json();
          if (data.listings && data.listings.length > 0) {
            setListings(data.listings);
          } else {
            // Use mock data when API returns empty
            setListings(MOCK_LISTINGS);
          }
        } else {
          // Use mock data when API fails
          setListings(MOCK_LISTINGS);
        }
      } catch (error) {
        console.error('Failed to fetch listings, using mock data:', error);
        // Use mock data when API is unavailable
        setListings(MOCK_LISTINGS);
      } finally {
        setIsLoadingListings(false);
      }
    };

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setCategories(data);
          } else {
            setCategories(MOCK_CATEGORIES);
          }
        } else {
          setCategories(MOCK_CATEGORIES);
        }
      } catch (error) {
        console.error('Failed to fetch categories, using mock data:', error);
        // Use mock data when API is unavailable
        setCategories(MOCK_CATEGORIES);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchFeaturedListings();
    fetchCategories();
  }, []);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }, [router]);

  // Category selection handler
  const handleCategorySelect = useCallback((categoryId: string) => {
    router.push(`/category/${categoryId}`);
  }, [router]);

  return (
    <main className="min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ════════════════════════════════════════════════════════
          SECTION 1: HERO - Full Screen with Animations
         ════════════════════════════════════════════════════════ */}
      <HeroSection onSearch={handleSearch} />

      {/* ════════════════════════════════════════════════════════
          SECTION 2: STATS BAR - Animated Counters
         ════════════════════════════════════════════════════════ */}
      <Suspense fallback={
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      }>
        <StatsBar variant="default" />
      </Suspense>

      {/* ════════════════════════════════════════════════════════
          SECTION 3: FEATURED CATEGORIES - Bento Grid Layout
         ════════════════════════════════════════════════════════ */}
      <Suspense fallback={
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Skeleton className="h-6 w-40 mx-auto mb-4" />
              <Skeleton className="h-10 w-64 mx-auto mb-3" />
              <Skeleton className="h-5 w-96 mx-auto" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      }>
        <FeaturedCategories 
          categories={categories}
          isLoading={isLoadingCategories}
          onSelectCategory={handleCategorySelect}
        />
      </Suspense>

      {/* ════════════════════════════════════════════════════════
          SECTION 4: HOW IT WORKS - 3-Step Process
         ════════════════════════════════════════════════════════ */}
      <Suspense fallback={
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-card border border-border/50 animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      }>
        <HowItWorks variant="default" />
      </Suspense>

      {/* ════════════════════════════════════════════════════════
          SECTION 5: FEATURED LISTINGS GRID
         ════════════════════════════════════════════════════════ */}
      <section id="listings" className="py-16 sm:py-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <Badge 
                variant="secondary" 
                className="mb-3 px-4 py-1.5 bg-gold/10 text-gold border-0 font-semibold"
              >
                ⭐ {locale === 'ar' ? 'مميز' : locale === 'fr' ? 'En vedette' : 'Featured'}
              </Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                {locale === 'ar' ? 'أحدث الإعلانات المميزة' : locale === 'fr' ? 'Dernières annonces en vedette' : 'Latest Featured Listings'}
              </h2>
            </div>
            
            <Link href="/listings">
              <Button 
                variant="outline" 
                className="group rounded-xl font-medium"
              >
                {t('common.view_all')}
                <svg 
                  className={`w-4 h-4 ms-2 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>

          {/* Listings Grid */}
          {isLoadingListings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {locale === 'ar' ? 'لا توجد إعلانات حالياً' : locale === 'fr' ? 'Aucune annonce pour le moment' : 'No listings yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {locale === 'ar' 
                  ? 'كن أول من يضيف إعلاناً في منطقتك! سجل الآن وابدأ في البيع.'
                  : locale === 'fr'
                    ? 'Soyez le premier à ajouter une annonce dans votre région ! Inscrivez-vous et commencez à vendre.'
                    : 'Be the first to add a listing in your area! Sign up and start selling.'
                }
              </p>
              <Link href="/listings/create">
                <Button size="lg" className="rounded-xl">
                  {t('listings.create_listing')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 6: TESTIMONIALS CAROUSEL
         ════════════════════════════════════════════════════════ */}
      <Suspense fallback={
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-72 rounded-3xl bg-card border border-border/50 animate-pulse" />
          </div>
        </section>
      }>
        <Testimonials variant="default" />
      </Suspense>

      {/* ════════════════════════════════════════════════════════
          SECTION 7: APP DOWNLOAD CTA
         ════════════════════════════════════════════════════════ */}
      <Suspense fallback={
        <section className="py-16 bg-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-48 rounded-3xl bg-white/10 animate-pulse" />
          </div>
        </section>
      }>
        <AppDownloadCTA variant="compact" />
      </Suspense>

      {/* ════════════════════════════════════════════════════════
          SECTION 8: TRUST BADGES & SECURITY
         ════════════════════════════════════════════════════════ */}
      <TrustBadges variant="default" />

      {/* ════════════════════════════════════════════════════════
          FINAL CTA SECTION
         ════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary via-teal-700 to-violet-900 relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-[100px]" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {locale === 'ar' && (
              <>
                <span className="block">جاهز للبدء؟</span>
                <span className="block mt-2 bg-gradient-to-l from-gold via-orange-300 to-gold bg-clip-text text-transparent">
                  انضم إلى آلاف المستخدمين اليوم!
                </span>
              </>
            )}
            {locale === 'fr' && (
              <>
                <span className="block">Prêt à commencer ?</span>
                <span className="block mt-2 bg-gradient-to-r from-gold via-orange-300 to-gold bg-clip-text text-transparent">
                  Rejoignez des milliers d'utilisateurs aujourd'hui !
                </span>
              </>
            )}
            {locale === 'en' && (
              <>
                <span className="block">Ready to Get Started?</span>
                <span className="block mt-2 bg-gradient-to-r from-gold via-orange-300 to-gold bg-clip-text text-transparent">
                  Join Thousands of Users Today!
                </span>
              </>
            )}
          </h2>

          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'سجل مجاناً وابدأ في البيع والشراء في دقائق. مافورا هي بوصلتك لعالم من الفرص!'
              : locale === 'fr'
                ? 'Inscrivez-vous gratuitement et commencez à acheter et vendre en quelques minutes. Mavora est votre passerelle vers un monde d\'opportunités !'
                : 'Sign up for free and start buying and selling in minutes. Mavora is your gateway to a world of opportunities!'
            }
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button 
                size="lg" 
                className="px-10 py-6 text-base font-semibold rounded-2xl bg-white text-primary hover:bg-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
              >
                {locale === 'ar' ? 'إنشاء حساب مجاني' : locale === 'fr' ? 'Créer un compte gratuit' : 'Create Free Account'}
              </Button>
            </Link>
            
            <Link href="/listings/create">
              <Button 
                size="lg" 
                variant="outline" 
                className="px-10 py-6 text-base font-semibold rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              >
                {locale === 'ar' ? 'نشر إعلان الآن' : locale === 'fr' ? 'Publier une annonce maintenant' : 'Post a Listing Now'}
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {locale === 'ar' ? 'مجاني تماماً' : locale === 'fr' ? 'Entièrement gratuit' : '100% Free'}
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {locale === 'ar' ? 'بدون بطاقة ائتمان' : locale === 'fr' ? 'Sans carte de crédit' : 'No Credit Card'}
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {locale === 'ar' ? 'إعداد في دقيقة واحدة' : locale === 'fr' ? 'Configuration en 1 minute' : 'Setup in 1 Minute'}
            </span>
          </div>
        </div>
      </section>

    </main>
  );
}
