'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigationInit } from '@/hooks/useNavigationInit';
import HeroSection from '@/components/marketplace/HeroSection';
import CategoryGrid from '@/components/marketplace/CategoryGrid';
import ListingCard from '@/components/listing/ListingCard';
import MavoraLogo from '@/components/common/MavoraLogo';
import { 
  TrendingUp, 
  Shield, 
  Users, 
  Globe,
  ArrowRight,
  Star,
  CheckCircle2,
  Zap,
  Heart,
  MapPin,
  Loader2
} from 'lucide-react';
import type { Listing, Category } from '@/lib/types';

export default function HomePage() {
  const { t, locale } = useTranslation();
  
  // Initialize navigation router
  useNavigationInit();
  
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch featured listings and categories in parallel
      const [listingsRes, categoriesRes] = await Promise.all([
        fetch('/api/listings?limit=8&sort=featured&status=active'),
        fetch('/api/categories'),
      ]);

      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setFeaturedListings(Array.isArray(listingsData) ? listingsData : listingsData.items || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || []);
      }
    } catch (error) {
      console.error('Error fetching home page data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isRtl = locale === 'ar';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Categories Section */}
      <section id="categories" className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              {t('categories.browse_by_category')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('categories.find_what_you_need')}
            </p>
          </div>
          
          <CategoryGrid categories={categories} isLoading={isLoading} />
        </div>
      </section>

      {/* Featured Listings Section */}
      <section id="featured" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                {t('listings.featured_listings')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('listings.handpicked_for_you')}
              </p>
            </div>
            <Link href="/listings">
              <Button variant="outline" className="gap-2 hidden sm:flex">
                {t('common.view_all')}
                <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            /* Loading Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredListings.slice(0, 8).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              
              {/* Mobile View All Button */}
              <div className="mt-8 text-center sm:hidden">
                <Link href="/listings">
                  <Button variant="outline" className="gap-2 w-full">
                    {t('common.view_all')} {t('listings.listings').toLowerCase()}
                    <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="size-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">{t('listings.no_featured_yet')}</h3>
              <p className="text-muted-foreground mb-6">{t('listings.check_back_soon')}</p>
              <Link href="/listings/create">
                <Button className="bg-emerald hover:bg-emerald/90 gap-2">
                  {t('common.post_ad')}
                  <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose MAVORA Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-emerald/10 text-emerald border-emerald/20">
              {t('home.why_choose_us')}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              {t('home.mavora_advantage')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('home.platform_description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Security */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="size-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {t('features.secure_transactions.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.secure_transactions.description')}
                </p>
                <ul className="mt-4 space-y-2">
                  {['Verified users', 'Secure payments', 'Protection policies'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-4 text-emerald shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 - Wide Reach */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="size-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {t('features.wide_reach.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.wide_reach.description')}
                </p>
                <ul className="mt-4 space-y-2">
                  {['Morocco & North Africa', 'Multi-language', 'Mobile optimized'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-4 text-emerald shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 - Easy to Use */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="size-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {t('features.easy_to_use.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.easy_to_use.description')}
                </p>
                <ul className="mt-4 space-y-2">
                  {['Simple posting', 'Smart search', 'Instant messages'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-4 text-emerald shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-primary/90 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">10K+</div>
              <div className="text-white/80 text-sm uppercase tracking-wider">{t('stats.active_listings')}</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">5K+</div>
              <div className="text-white/80 text-sm uppercase tracking-wider">{t('stats.happy_users')}</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">50+</div>
              <div className="text-white/80 text-sm uppercase tracking-wider">{t('stats.categories')}</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">100+</div>
              <div className="text-white/80 text-sm uppercase tracking-wider">{t('stats.cities')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <MavoraLogo size="lg" className="mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            {t('cta.ready_to_start')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('cta.join_thousands')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings/create">
              <Button size="lg" className="bg-emerald hover:bg-emerald/90 text-white gap-2 shadow-lg shadow-emerald/30 text-base px-8 h-12">
                <Zap className="size-5" />
                {t('common.post_free_ad')}
              </Button>
            </Link>
            <Link href="/listings">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                {t('common.browse_listings')}
                <ArrowRight className={`size-5 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="size-4 text-emerald" />
              {t('trust.secure_platform')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4 text-emerald" />
              {t('trust.large_community')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="size-4 text-emerald" />
              {t('trust.top_rated')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-emerald" />
              {t('trust.local_focus')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
