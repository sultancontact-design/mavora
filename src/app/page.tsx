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
          setListings(data.listings || []);
        }
      } catch (error) {
        console.error('Failed to fetch listings:', error);
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
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
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
