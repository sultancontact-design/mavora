'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Loader2,
  Search,
  Car,
  Home,
  Smartphone,
  Briefcase,
  Wrench,
  Shirt,
  Gamepad2,
  Dumbbell,
  BookOpen,
  PawPrint,
  Baby,
  Flower2
} from 'lucide-react';
import type { Listing, Category } from '@/lib/types';

// Categories with icons for the homepage - using translation keys
const CATEGORIES_DATA = [
  { id: 'vehicles', slug: 'vehicles', key: 'categories.vehicles', icon: Car, color: 'bg-blue-500' },
  { id: 'real-estate', slug: 'real-estate', key: 'categories.real_estate', icon: Home, color: 'bg-emerald-500' },
  { id: 'electronics', slug: 'electronics', key: 'categories.electronics', icon: Smartphone, color: 'bg-purple-500' },
  { id: 'jobs', slug: 'jobs', key: 'categories.jobs', icon: Briefcase, color: 'bg-orange-500' },
  { id: 'services', slug: 'services', key: 'categories.services', icon: Wrench, color: 'bg-cyan-500' },
  { id: 'fashion', slug: 'fashion', key: 'categories.fashion', icon: Shirt, color: 'bg-pink-500' },
  { id: 'sports', slug: 'sports', key: 'categories.sports', icon: Dumbbell, color: 'bg-green-500' },
  { id: 'home-garden', slug: 'home-garden', key: 'categories.home', icon: Flower2, color: 'bg-lime-500' },
  { id: 'education', slug: 'education', key: 'categories.education', icon: BookOpen, color: 'bg-indigo-500' },
  { id: 'animals', slug: 'animals', key: 'categories.animals', icon: PawPrint, color: 'bg-amber-500' },
  { id: 'kids', slug: 'kids', key: 'categories.kids', icon: Baby, color: 'bg-red-400' },
  { id: 'entertainment', slug: 'entertainment', key: 'categories.entertainment', icon: Gamepad2, color: 'bg-violet-500' },
];

export default function HomePage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  
  // Initialize navigation router
  useNavigationInit();
  
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{ listings: number; users: number; categories: number; cities: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isRtl = locale === 'ar';

  // Fetch data on mount
  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch featured listings
      const listingsRes = await fetch('/api/listings?limit=8&sort=featured&status=active');
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setFeaturedListings(Array.isArray(listingsData) ? listingsData : listingsData.data || []);
      }

      // Fetch real stats from API
      try {
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            listings: statsData.totalListings || 0,
            users: statsData.totalUsers || 0,
            categories: statsData.totalCategories || 0,
            cities: statsData.totalCities || 0,
          });
        }
      } catch (statsError) {
        // Stats are optional - don't fail if not available
        console.warn('Stats not available:', statsError);
      }
    } catch (error) {
      console.error('Error fetching home page data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/listings?category=${categoryId}`);
  };

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K+`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[#1a3a5c] px-4 py-16 sm:py-20 lg:py-28">
        {/* Background Decorations */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -start-32 -top-32 size-[500px] rounded-full bg-emerald/10 blur-3xl" />
          <div className="absolute -end-24 top-1/4 size-[400px] rounded-full bg-emerald/8 blur-3xl" />
          <div className="absolute -bottom-20 start-1/3 size-[350px] rounded-full bg-gold/8 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Logo & Badge */}
          <div className="mb-6 flex justify-center">
            <MavoraLogo size="lg" className="text-white" />
          </div>
          
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm">
              <Sparkles className="size-4 text-gold" />
              <span>{t('home.largest_marketplace')}</span>
              <TrendingUp className="size-4 text-emerald" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="block">{t('home.search_sell_trade')}</span>
            <span className="block mt-2 bg-gradient-to-l from-emerald to-gold bg-clip-text text-transparent">
              {t('home.in_one_place')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            {t('hero.subtitle')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto max-w-3xl">
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? 'end-4' : 'start-4'} top-1/2 size-5 -translate-y-1/2 text-white/50`} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('hero.search_placeholder')}
                  className={`h-14 w-full rounded-2xl border-0 bg-white/95 pe-36 ps-12 text-base text-foreground shadow-xl backdrop-blur-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 focus-visible:bg-white sm:rounded-r-none sm:pe-44`}
                  dir="ltr"
                />
                <Button
                  type="submit"
                  className={`absolute ${isRtl ? 'start-2.5' : 'end-2.5'} top-1/2 h-10 -translate-y-1/2 rounded-xl bg-emerald px-6 text-sm font-semibold text-white shadow-md hover:bg-emerald/90 hidden sm:inline-flex`}
                >
                  {t('common.search')}
                  <ArrowRight className={`ms-2 size-4 ${isRtl ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              <Button
                type="submit"
                className="h-14 w-full rounded-2xl bg-emerald px-8 text-base font-semibold text-white shadow-lg hover:bg-emerald/90 sm:hidden"
              >
                {t('common.search')}
                <ArrowRight className={`ms-2 size-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </form>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2 text-white/60">
              <Shield className="size-5 text-emerald" />
              <span className="text-sm">{t('home.secure_platform')}</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2 text-white/60">
              <Users className="size-5 text-gold" />
              <span className="text-sm">{stats ? `${formatNumber(stats.users)} ${t('admin.total_users')}` : t('home.large_community')}</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2 text-white/60">
              <Zap className="size-5 text-emerald" />
              <span className="text-sm">100% {t('common.free')}</span>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 start-0 w-full overflow-hidden leading-none" aria-hidden="true">
          <svg className="relative block w-full h-12 sm:h-16 lg:h-20" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path fill="currentColor" className="text-background" d="M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </section>

      {/* ── Categories Section ── */}
      <section id="categories" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-emerald/10 text-emerald border-emerald/20">
              {t('home.browse_by_category')}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              {t('categories.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>
          
          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES_DATA.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card hover:border-emerald/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`flex size-14 items-center justify-center rounded-2xl ${category.color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="size-7" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-semibold text-center text-foreground group-hover:text-emerald transition-colors">
                    {t(category.key)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Listings Section ── */}
      <section id="featured" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                {t('home.featured_listings_title')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('home.featured_listings_subtitle')}
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
              
              <div className="mt-8 text-center sm:hidden">
                <Link href="/listings">
                  <Button variant="outline" className="gap-2 w-full">
                    {t('common.view_all')}
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
              <h3 className="text-xl font-semibold text-primary mb-2">
                {t('home.no_listings_yet')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('home.be_first_to_post')}
              </p>
              <Link href="/listings/create">
                <Button className="bg-emerald hover:bg-emerald/90 gap-2">
                  <Zap className="size-4" />
                  {t('common.post_ad')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Why Choose MAVORA Section ── */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-emerald/10 text-emerald border-emerald/20">
              {t('home.why_mavora')}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              {t('home.mavora_advantages')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('home.mavora_description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="size-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {t('home.secure_transactions')}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t('home.secure_transactions_desc')}
                </p>
                <ul className="space-y-2">
                  {[t('home.verified_users'), t('home.secure_payments'), t('home.buyer_protection')].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-4 text-emerald shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="size-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {t('home.wide_reach')}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t('home.wide_reach_desc')}
                </p>
                <ul className="space-y-2">
                  {[t('home.morocco_north_africa'), t('home.multi_language'), t('home.mobile_optimized')].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-4 text-emerald shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="size-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {t('home.easy_to_use')}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t('home.easy_to_use_desc')}
                </p>
                <ul className="space-y-2">
                  {[t('home.easy_posting'), t('home.smart_search'), t('home.instant_messaging')].map((item) => (
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

      {/* ── Stats Section (Real Data) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-primary/90 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stats ? formatNumber(stats.listings) : '0'}
              </div>
              <div className="text-white/80 text-sm uppercase tracking-wider">
                {t('listings.featured')}
              </div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stats ? formatNumber(stats.users) : '0'}
              </div>
              <div className="text-white/80 text-sm uppercase tracking-wider">
                {t('admin.total_users')}
              </div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stats ? formatNumber(stats.categories) : '0'}
              </div>
              <div className="text-white/80 text-sm uppercase tracking-wider">
                {t('admin.total_categories')}
              </div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stats ? formatNumber(stats.cities) : '0'}
              </div>
              <div className="text-white/80 text-sm uppercase tracking-wider">
                {t('admin.total_countries')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <MavoraLogo size="lg" className="mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            {t('home.ready_to_start')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('home.join_thousands')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings/create">
              <Button size="lg" className="bg-emerald hover:bg-emerald/90 text-white gap-2 shadow-lg shadow-emerald/30 text-base px-8 h-12">
                <Zap className="size-5" />
                {t('home.post_free_ad')}
              </Button>
            </Link>
            <Link href="/listings">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                {t('home.browse_listings')}
                <ArrowRight className={`size-5 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="size-4 text-emerald" />
              {t('home.secure_platform')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4 text-emerald" />
              {t('home.large_community')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="size-4 text-emerald" />
              {t('home.top_rated')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-emerald" />
              {t('home.local_focus')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Missing icon import
function Sparkles(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3.5 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 20.5l1.912-5.813a2 2 0 0 1 1.275-1.275L20.5 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}
