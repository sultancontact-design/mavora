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
  { id: 'vehicles', slug: 'vehicles', key: 'categories.vehicles', icon: Car, color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50' },
  { id: 'real-estate', slug: 'real-estate', key: 'categories.real_estate', icon: Home, color: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50' },
  { id: 'electronics', slug: 'electronics', key: 'categories.electronics', icon: Smartphone, color: 'from-violet-500 to-violet-600', bgLight: 'bg-violet-50' },
  { id: 'jobs', slug: 'jobs', key: 'categories.jobs', icon: Briefcase, color: 'from-coral to-coral-dark', bgLight: 'bg-orange-50' },
  { id: 'services', slug: 'services', key: 'categories.services', icon: Wrench, color: 'from-cyan-500 to-cyan-600', bgLight: 'bg-cyan-50' },
  { id: 'fashion', slug: 'fashion', key: 'categories.fashion', icon: Shirt, color: 'from-pink-500 to-pink-600', bgLight: 'bg-pink-50' },
  { id: 'sports', slug: 'sports', key: 'categories.sports', icon: Dumbbell, color: 'from-green-500 to-green-600', bgLight: 'bg-green-50' },
  { id: 'home-garden', slug: 'home-garden', key: 'categories.home', icon: Flower2, color: 'from-lime-500 to-lime-600', bgLight: 'bg-lime-50' },
  { id: 'education', slug: 'education', key: 'categories.education', icon: BookOpen, color: 'from-indigo-500 to-indigo-600', bgLight: 'bg-indigo-50' },
  { id: 'animals', slug: 'animals', key: 'categories.animals', icon: PawPrint, color: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50' },
  { id: 'kids', slug: 'kids', key: 'categories.kids', icon: Baby, color: 'from-red-400 to-red-500', bgLight: 'bg-red-50' },
  { id: 'entertainment', slug: 'entertainment', key: 'categories.entertainment', icon: Gamepad2, color: 'from-purple-500 to-purple-600', bgLight: 'bg-purple-50' },
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
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 px-4 py-16 sm:py-20 lg:py-28">
        {/* Background Decorations */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -start-32 -top-32 size-[500px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -end-24 top-1/4 size-[400px] rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-20 start-1/3 size-[350px] rounded-full bg-gold/15 blur-3xl" />
          {/* Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Logo & Badge */}
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm">
              <MavoraLogo size="lg" className="text-white" />
            </div>
          </div>
          
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white/90 backdrop-blur-sm border border-white/10">
              <SparklesIcon className="size-4 text-gold" />
              <span>{t('home.largest_marketplace')}</span>
              <TrendingUp className="size-4 text-emerald-300" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            <span className="block">{t('home.search_sell_trade')}</span>
            <span className="block mt-2 sm:mt-3">
              <span className="bg-gradient-to-l from-gold via-gold-light to-gold bg-clip-text text-transparent">
                {t('home.in_one_place')}
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg leading-relaxed text-white/80">
            {t('hero.subtitle')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto max-w-3xl">
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? 'end-4' : 'start-4'} top-1/2 size-5 -translate-y-1/2 text-white/60`} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('hero.search_placeholder')}
                  className={`h-14 w-full rounded-2xl border-0 bg-white/95 pe-36 ps-12 text-base text-gray-900 shadow-xl backdrop-blur-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:bg-white sm:rounded-r-none sm:pe-44`}
                  dir="ltr"
                />
                <Button
                  type="submit"
                  className={`absolute ${isRtl ? 'start-2.5' : 'end-2.5'} top-1/2 h-10 -translate-y-1/2 rounded-xl bg-gradient-to-r from-coral to-coral-light px-5 text-sm font-bold text-white shadow-lg shadow-coral/30 hover:shadow-coral/40 transition-all hidden sm:inline-flex`}
                >
                  {t('common.search')}
                  <ArrowRight className={`ms-2 size-4 ${isRtl ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              <Button
                type="submit"
                className="h-14 w-full rounded-2xl bg-gradient-to-r from-coral to-coral-light px-8 text-base font-bold text-white shadow-xl shadow-coral/30 hover:shadow-coral/40 transition-all sm:hidden"
              >
                {t('common.search')}
                <ArrowRight className={`ms-2 size-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </form>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2 text-white/70">
              <Shield className="size-5 text-emerald-300" />
              <span className="text-sm font-medium">{t('home.secure_platform')}</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2 text-white/70">
              <Users className="size-5 text-gold" />
              <span className="text-sm font-medium">
                {stats ? `${formatNumber(stats.users)} ${t('admin.total_users')}` : t('home.large_community')}
              </span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2 text-white/70">
              <Zap className="size-5 text-coral-light" />
              <span className="text-sm font-medium">100% {t('common.free')}</span>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 start-0 w-full overflow-hidden leading-none" aria-hidden="true">
          <svg className="relative block w-full h-12 sm:h-16 lg:h-20" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path fill="#FAFAFA" d="M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </section>

      {/* ── Categories Section ── */}
      <section id="categories" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-teal-100 text-teal-700 border-teal-200 font-semibold px-4 py-1.5 rounded-full">
              {t('home.browse_by_category')}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 mt-3">
              {t('categories.title')}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
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
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 bg-white hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.color} text-white group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="size-7" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-semibold text-center text-gray-700 group-hover:text-teal-700 transition-colors">
                    {t(category.key)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Listings Section ── */}
      <section id="featured" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {t('home.featured_listings_title')}
              </h2>
              <p className="text-lg text-gray-500">
                {t('home.featured_listings_subtitle')}
              </p>
            </div>
            <Link href="/listings">
              <Button variant="outline" className="gap-2 hidden sm:flex rounded-xl border-gray-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 h-11 px-5">
                {t('common.view_all')}
                <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            /* Loading Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden rounded-2xl border-gray-100">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                      <Skeleton className="h-4 w-16 rounded-lg" />
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
                  <Button variant="outline" className="gap-2 w-full rounded-xl border-gray-200 hover:bg-teal-50 h-12">
                    {t('common.view_all')}
                    <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="size-20 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Zap className="size-9 text-teal-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('home.no_listings_yet')}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {t('home.be_first_to_post')}
              </p>
              <Link href="/listings/create">
                <Button className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 gap-2 shadow-lg shadow-teal-500/25 rounded-xl h-12 px-7">
                  <Zap className="size-5" />
                  {t('common.post_ad')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Why Choose MAVORA Section ── */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-violet-100 text-violet-700 border-violet-200 font-semibold px-4 py-1.5 rounded-full">
              {t('home.why_mavora')}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 mt-3">
              {t('home.mavora_advantages')}
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              {t('home.mavora_description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                  <Shield className="size-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t('home.secure_transactions')}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-5">
                  {t('home.secure_transactions_desc')}
                </p>
                <ul className="space-y-2.5">
                  {[t('home.verified_users'), t('home.secure_payments'), t('home.buyer_protection')].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="size-4.5 text-teal-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-teal-500/30">
                  <Globe className="size-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t('home.wide_reach')}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-5">
                  {t('home.wide_reach_desc')}
                </p>
                <ul className="space-y-2.5">
                  {[t('home.morocco_north_africa'), t('home.multi_language'), t('home.mobile_optimized')].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="size-4.5 text-teal-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/30">
                  <Zap className="size-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t('home.easy_to_use')}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-5">
                  {t('home.easy_to_use_desc')}
                </p>
                <ul className="space-y-2.5">
                  {[t('home.easy_posting'), t('home.smart_search'), t('home.instant_messaging')].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="size-4.5 text-teal-500 shrink-0" />
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -start-20 top-0 size-60 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -end-20 bottom-0 size-60 rounded-full bg-gold/10 blur-2xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stats ? formatNumber(stats.listings) : '0'}
              </div>
              <div className="text-white/80 text-sm uppercase tracking-wider font-medium">
                {t('listings.featured')}
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stats ? formatNumber(stats.users) : '0'}
              </div>
              <div className="text-white/80 text-sm uppercase tracking-wider font-medium">
                {t('admin.total_users')}
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stats ? formatNumber(stats.categories) : '0'}
              </div>
              <div className="text-white/80 text-sm uppercase tracking-wider font-medium">
                {t('admin.total_categories')}
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stats ? formatNumber(stats.cities) : '0'}
              </div>
              <div className="text-white/80 text-sm uppercase tracking-wider font-medium">
                {t('admin.total_countries')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 mb-6">
            <MavoraLogo size="lg" className="text-teal-600" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t('home.ready_to_start')}
          </h2>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            {t('home.join_thousands')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings/create">
              <Button size="lg" className="bg-gradient-to-r from-coral to-coral-light hover:from-coral-dark hover:to-coral text-white gap-2 shadow-xl shadow-coral/30 text-base px-9 h-13 rounded-xl btn-lift font-bold">
                <Zap className="size-5" />
                {t('home.post_free_ad')}
              </Button>
            </Link>
            <Link href="/listings">
              <Button size="lg" variant="outline" className="gap-2 text-base px-9 h-13 rounded-xl border-gray-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 font-semibold">
                {t('home.browse_listings')}
                <ArrowRight className={`size-5 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="size-4.5 text-teal-500" />
              {t('home.secure_platform')}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="size-4.5 text-teal-500" />
              {t('home.large_community')}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Star className="size-4.5 text-gold" />
              {t('home.top_rated')}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="size-4.5 text-teal-500" />
              {t('home.local_focus')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Missing icon component
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3.5 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 20.5l1.912-5.813a2 2 0 0 1 1.275-1.275L20.5 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}
