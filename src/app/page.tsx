'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/footer/Footer';
import HeroSection from '@/components/marketplace/HeroSection';
import CategoryGrid from '@/components/marketplace/CategoryGrid';
import CreateListingForm from '@/components/listing/CreateListingForm';
import ProfilePage from '@/components/profile/ProfilePage';
import FavoritesPage from '@/components/favorites/FavoritesPage';
import ConversationsPage from '@/components/messages/ConversationsPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import SellerProfilePage from '@/components/seller/SellerProfilePage';
import OrganizationPage from '@/components/organization/OrganizationPage';
import WalletPage from '@/components/wallet/WalletPage';
import InvoicesPage from '@/components/invoices/InvoicesPage';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigationStore } from '@/stores/navigation';
import type { Category, Listing, PaginatedResponse, Locale, Country, City, Currency, ListingFieldValue } from '@/lib/types';
import FilterSidebar from '@/components/marketplace/FilterSidebar';

import {
  Search,
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  Star,
  ChevronRight,
  ChevronDown,
  X,
  Loader2,
  Inbox,
  Database,
  CheckCircle2,
  Shield,
  Camera,
  Heart,
  RefreshCw,
  ExternalLink,
  Globe,
  Zap,
  AlertCircle,
  Info,
  Share2,
  Flag,
  Pencil,
  Trash2,
  Settings2,
  Play,
  // New icons for homepage sections
  ArrowRight,
  Users,
  TrendingUp,
  Smartphone,
  Download,
  Quote,
  Sparkles,
  Target,
  MessageSquare,
  Gift,
  Award,
} from 'lucide-react';
import { motion } from 'framer-motion';
import MavoraLogo from '@/components/common/MavoraLogo';
import ReportDialog from '@/components/common/ReportDialog';
import ReviewsSection from '@/components/listing/ReviewsSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCategoryIcon } from '@/lib/category-icons';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

// ─── Helpers ────────────────────────────────────────────────────────

function getLocalizedName(item: { name_ar: string; name_fr: string; name_en: string }, locale: Locale): string {
  switch (locale) {
    case 'ar': return item.name_ar;
    case 'fr': return item.name_fr;
    default: return item.name_en;
  }
}

function getVideoEmbedUrl(url: string): string | null {
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return null;
}

function timeAgo(dateStr: string, locale: Locale): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const months = Math.floor(days / 30);

  if (locale === 'ar') {
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 30) return `منذ ${days} يوم`;
    return `منذ ${months} شهر`;
  }
  if (locale === 'fr') {
    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 30) return `il y a ${days}j`;
    return `il y a ${months}m`;
  }
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${months}mo ago`;
}

// ─── Setup View ─────────────────────────────────────────────────────

function SetupView() {
  const { t, locale } = useTranslation();
  const { setDbConfigured, navigateHome } = useNavigationStore();
  const [checking, setChecking] = useState(false);
  const [configured, setConfigured] = useState(false);

  // Auto-migration state
  const [autoOpen, setAutoOpen] = useState(false);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateSuccess, setMigrateSuccess] = useState(false);
  const [migrateError, setMigrateError] = useState('');

  const handleCheck = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/setup/check');
      const data = await res.json();
      if (data.configured) {
        setConfigured(true);
        setDbConfigured(true);
        setTimeout(() => navigateHome(), 1500);
      }
    } catch {
      // still not configured
    } finally {
      setChecking(false);
    }
  }, [setDbConfigured, navigateHome]);

  const handleAutoMigrate = useCallback(async () => {
    if (!token.trim()) {
      setMigrateError(t('setup.enter_token_first'));
      return;
    }
    setMigrating(true);
    setMigrateError('');
    setMigrateSuccess(false);
    try {
      const res = await fetch('/api/setup/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMigrateSuccess(true);
        // Auto-trigger the check after successful migration
        setTimeout(() => handleCheck(), 1000);
      } else {
        setMigrateError(data.error || data.message || t('setup.migrate_error'));
      }
    } catch {
      setMigrateError(t('setup.migrate_error'));
    } finally {
      setMigrating(false);
    }
  }, [token, t, handleCheck]);

  const features = [
    { icon: Shield, key: 'setup.feature_auth' },
    { icon: Search, key: 'setup.feature_listings' },
    { icon: Globe, key: 'setup.feature_categories' },
    { icon: Camera, key: 'setup.feature_media' },
    { icon: Heart, key: 'setup.feature_favorites' },
  ];

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MavoraLogo size="lg" className="justify-center" />
        </motion.div>

        {/* Welcome heading */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('setup.welcome_title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('setup.setup_subtitle')}
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Card header with icon */}
          <div className="relative overflow-hidden px-6 py-8 md:px-10 md:py-10">
            {/* Decorative gradient blobs */}
            <div className="pointer-events-none absolute -top-20 -start-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -end-16 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              {/* Large styled Database icon */}
              <div className="mb-5 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 ring-1 ring-emerald-500/20">
                <Database className="size-10 text-emerald-500" />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                {locale === 'ar' ? 'تهيئة المنصة' : locale === 'fr' ? 'Configuration de la plateforme' : 'Platform Setup'}
              </h2>

              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                {t('setup.description')}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Auto-migration collapsible section */}
          <div className="px-6 py-5 md:px-10">
            <Collapsible open={autoOpen} onOpenChange={setAutoOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-start transition-all hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                      <Zap className="size-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('setup.auto_migrate_title')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('setup.auto_migrate_desc')}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${autoOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-3">
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-4">
                  {/* Token input */}
                  <div className="space-y-2">
                    <Label htmlFor="access-token" className="text-sm font-medium text-foreground">
                      {t('setup.token_label')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="access-token"
                        type={showToken ? 'text' : 'password'}
                        placeholder={t('setup.token_placeholder')}
                        value={token}
                        onChange={(e) => { setToken(e.target.value); setMigrateError(''); }}
                        disabled={migrating}
                        className="pe-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showToken ? t('setup.hide_token') : t('setup.show_token')}
                      >
                        {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* How to get token info */}
                  <Alert className="border-blue-200/60 bg-blue-50/50">
                    <Info className="size-4 text-blue-500" />
                    <AlertTitle className="text-xs font-semibold text-blue-700">
                      {t('setup.get_token')}
                    </AlertTitle>
                    <AlertDescription className="text-xs text-blue-600">
                      {t('setup.get_token_steps')}
                    </AlertDescription>
                  </Alert>

                  {/* Error display */}
                  {migrateError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertTitle className="text-xs font-semibold">
                          {t('setup.migrate_error')}
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          {migrateError}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Success display */}
                  {migrateSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert className="border-emerald-200/60 bg-emerald-50/50">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <AlertDescription className="text-xs text-emerald-700 font-medium">
                          {t('setup.migrate_success')}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Run auto migration button */}
                  <button
                    onClick={handleAutoMigrate}
                    disabled={migrating || configured}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {migrating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {t('setup.running')}
                      </>
                    ) : (
                      <>
                        <Zap className="size-4" />
                        {t('setup.run_auto')}
                      </>
                    )}
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Manual migration fallback */}
          <div className="px-6 py-5 md:px-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground">
                {t('setup.manual_fallback')}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t('setup.open_dashboard')}
            </p>
            <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
              {t('setup.run_sql_steps')}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Features list */}
          <div className="px-6 py-6 md:px-10">
            <p className="text-sm font-semibold text-foreground mb-4">
              {t('setup.features')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feat, idx) => (
                <motion.div
                  key={feat.key}
                  className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3"
                  initial={{ opacity: 0, x: locale === 'ar' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 + idx * 0.08 }}
                >
                  <feat.icon className="size-4 shrink-0 text-emerald-500" />
                  <span className="text-sm text-foreground">{t(feat.key)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Action buttons */}
          <div className="px-6 py-6 md:px-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href="https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 hover:shadow-md active:scale-[0.98]"
            >
              {t('setup.run_migration')}
              <ExternalLink className="size-4" />
            </a>

            <button
              onClick={handleCheck}
              disabled={checking || configured}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/60 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checking ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('setup.checking')}
                </>
              ) : configured ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  {t('setup.configured_msg')}
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  {t('setup.check_status')}
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Subtle branding footer inside setup */}
        <motion.p
          className="mt-6 text-center text-xs text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          MAVORA — {t('app.tagline')}
        </motion.p>
      </div>
    </div>
  );
}

// ─── Home View ──────────────────────────────────────────────────────

function HomeView({
  categories,
  categoriesLoading,
  onSearch,
  onSelectCategory,
  onSelectListing,
}: {
  categories: Category[] | null;
  categoriesLoading: boolean;
  onSearch: (query: string) => void;
  onSelectCategory: (id: string) => void;
  onSelectListing: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  const [listings, setListings] = useState<PaginatedResponse<Listing> | null>(null);
  const [listingsLoading, setListingsLoading] = useState(true);
  const isRtl = locale === 'ar';

  useEffect(() => {
    async function fetchListings() {
      try {
        const params = new URLSearchParams({
          sort_by: 'newest',
          page: '1',
          per_page: '8',
        });
        const res = await fetch(`/api/listings?${params}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data);
        }
      } catch {
        // Silently fail — just show empty state
      } finally {
        setListingsLoading(false);
      }
    }
    fetchListings();
  }, []);

  return (
    <>
      {/* Hidden but accessible SEO heading for search engines */}
      <h1 className="sr-only">
        MAVORA — سوقك الإلكتروني الموثوق في المغرب وشمال إفريقيا. اشترِ وبِع السيارات والعقارات والإلكترونيات والأزياء والمزيد.
      </h1>
      
      {/* Hero Section with Search */}
      <HeroSection onSearch={onSearch} />
      
      {/* Categories Grid */}
      <CategoryGrid
        categories={categories}
        isLoading={categoriesLoading}
        onSelectCategory={onSelectCategory}
      />

      {/* Featured Listings Section */}
      <section id="featured" className="bg-muted/30 py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-10 flex items-end justify-between">
            <div>
              <Badge variant="secondary" className="mb-3 bg-gold/10 text-gold hover:bg-gold/15">
                <Sparkles className="me-1.5 size-3" />
                {t('common.featured')}
              </Badge>
              <h2 className="text-h2 text-foreground">
                {t('listings.featured')}
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                {locale === 'ar' 
                  ? 'إعلانات مميزة من أفضل البائعين في المنطقة'
                  : locale === 'fr'
                    ? 'Annonces en vedette des meilleurs vendeurs de la région'
                    : 'Featured listings from top sellers in the region'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              className="hidden gap-1.5 text-emerald sm:inline-flex"
              onClick={() => window.location.hash = '#all-listings'}
            >
              {t('common.view_all')}
              <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Featured Listings Grid */}
          {listingsLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-4">
                    <Skeleton className="mb-2 h-5 w-3/4" />
                    <Skeleton className="mb-2 h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings && listings.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {listings.data.slice(0, 4).map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => onSelectListing(listing.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
              <Inbox className="mb-3 size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t('listings.no_listings')}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">{t('listings.no_listings_subtitle')}</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="about" className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary hover:bg-primary/15">
              <Target className="me-1.5 size-3" />
              {locale === 'ar' ? 'كيف يعمل' : locale === 'fr' ? 'Comment ça marche' : 'How It Works'}
            </Badge>
            <h2 className="text-h2 mb-3 text-foreground">
              {locale === 'ar' ? 'ابدأ في دقائق معدودة' : locale === 'fr' ? 'Commencez en quelques minutes' : 'Get Started in Minutes'}
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              {locale === 'ar'
                ? 'ثلاث خطوات بسيطة للبيع أو الشراء على مافورا'
                : locale === 'fr'
                  ? 'Trois étapes simples pour acheter ou vendre sur MAVORA'
                  : 'Three simple steps to buy or sell on MAVORA'}
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="group relative text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald/15 to-emerald/5 text-emerald transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald/20">
                <Search className="size-7" strokeWidth={1.5} />
              </div>
              <div className="mb-2 inline-flex items-center justify-center size-8 rounded-full bg-emerald/10 text-xs font-bold text-emerald">
                1
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {locale === 'ar' ? 'ابحث' : locale === 'fr' ? 'Rechercher' : 'Search'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? 'ابحث عن ما تريده من بين آلاف الإعلانات'
                  : locale === 'fr'
                    ? 'Cherchez ce que vous voulez parmi des milliers d\'annonces'
                    : 'Browse thousands of listings to find what you need'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="group relative text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/15 to-gold/5 text-gold transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-gold/20">
                <MessageSquare className="size-7" strokeWidth={1.5} />
              </div>
              <div className="mb-2 inline-flex items-center justify-center size-8 rounded-full bg-gold/10 text-xs font-bold text-gold">
                2
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {locale === 'ar' ? 'تواصل' : locale === 'fr' ? 'Contacter' : 'Connect'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? 'تواصل مباشرة مع البائع واتفق على التفاصيل'
                  : locale === 'fr'
                    ? 'Contactez directement le vendeur et convenez des détails'
                    : 'Contact sellers directly and agree on details'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="group relative text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
                <CheckCircle2 className="size-7" strokeWidth={1.5} />
              </div>
              <div className="mb-2 inline-flex items-center justify-center size-8 rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {locale === 'ar' ? 'تداول' : locale === 'fr' ? 'Échanger' : 'Trade'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? 'أتمم الصفقة بأمان واستلم مشترياتك'
                  : locale === 'fr'
                    ? 'Finalisez la transaction en toute sécurité et recevez vos achats'
                    : 'Complete the deal safely and receive your items'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative overflow-hidden bg-primary py-14 lg:py-20">
        {/* Background Pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Stat 1 */}
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-white md:text-5xl">100K+</div>
              <div className="text-sm text-white/70">
                {locale === 'ar' ? 'إعلان نشط' : locale === 'fr' ? 'Annonces actives' : 'Active Listings'}
              </div>
            </div>
            
            {/* Stat 2 */}
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-white md:text-5xl">50K+</div>
              <div className="text-sm text-white/70">
                {locale === 'ar' ? 'مستخدم مسجل' : locale === 'fr' ? 'Utilisateurs inscrits' : 'Registered Users'}
              </div>
            </div>
            
            {/* Stat 3 */}
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-white md:text-5xl">6+</div>
              <div className="text-sm text-white/70">
                {locale === 'ar' ? 'دول مدعومة' : locale === 'fr' ? 'Pays supportés' : 'Countries Supported'}
              </div>
            </div>
            
            {/* Stat 4 */}
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-emerald md:text-5xl">98%</div>
              <div className="text-sm text-white/70">
                {locale === 'ar' ? 'رضا العملاء' : locale === 'fr' ? 'Satisfaction client' : 'Customer Satisfaction'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4 bg-emerald/10 text-emerald hover:bg-emerald/15">
              <Quote className="me-1.5 size-3" />
              {locale === 'ar' ? 'آراء المستخدمين' : locale === 'fr' ? 'Témoignages' : 'Testimonials'}
            </Badge>
            <h2 className="text-h2 mb-3 text-foreground">
              {locale === 'ar' ? 'ماذا يقول عملاؤنا' : locale === 'fr' ? 'Que disent nos clients' : 'What Our Users Say'}
            </h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-emerald/30 hover:shadow-lg">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-gold text-gold" />
                ))}
              </div>
              <Quote className="mb-4 size-8 text-emerald/20" />
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                {locale === 'ar'
                  ? 'مافورا غيرت طريقة بيعي للمنتجات. سهلة الاستخدام ووصلني بعملاء كثيرين.'
                  : locale === 'fr'
                    ? 'MAVORA a changé ma façon de vendre. Facile à utiliser et m\'a connecté à de nombreux clients.'
                    : 'MAVORA changed how I sell products. Easy to use and connected me with many customers.'}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald/10 text-emerald font-semibold">
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Ahmed M.</p>
                  <p className="text-xs text-muted-foreground">Casablanca</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-emerald/30 hover:shadow-lg">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-gold text-gold" />
                ))}
              </div>
              <Quote className="mb-4 size-8 text-emerald/20" />
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                {locale === 'ar'
                  ? 'وجدت سيارتي أحلام خلال أسبوع فقط! الأسعار هنا أفضل بكثير من الأماكن الأخرى.'
                  : locale === 'fr'
                    ? 'J\'ai trouvé ma voiture de rêve en seulement une semaine ! Les prix sont bien meilleurs qu\'ailleurs.'
                    : 'Found my dream car in just a week! Prices here are much better than elsewhere.'}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gold/10 text-gold font-semibold">
                  S
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Sarah K.</p>
                  <p className="text-xs text-muted-foreground">Rabat</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-emerald/30 hover:shadow-lg">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-gold text-gold" />
                ))}
              </div>
              <Quote className="mb-4 size-8 text-emerald/20" />
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                {locale === 'ar'
                  ? 'منصة رائعة للأعمال الصغيرة. زادت مبيعاتي بنسبة 200% منذ انضمامي.'
                  : locale === 'fr'
                    ? 'Une plateforme incroyable pour les petites entreprises. Mes ventes ont augmenté de 200%.'
                    : 'Amazing platform for small businesses. My sales increased by 200%.'}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  M
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Mohammed R.</p>
                  <p className="text-xs text-muted-foreground">Marrakech</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download App CTA Section */}
      <section className="overflow-hidden bg-gradient-to-br from-emerald to-emerald-dark py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="items-center gap-12 lg:flex">
            {/* Content */}
            <div className="flex-1 text-center lg:text-start">
              <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
                <Smartphone className="me-1.5 size-3" />
                {locale === 'ar' ? 'تطبيق الموبايل' : locale === 'fr' ? 'Application mobile' : 'Mobile App'}
              </Badge>
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                {locale === 'ar'
                  ? 'حمّل تطبيق مافورا الآن'
                  : locale === 'fr'
                    ? 'Téléchargez l\'application MAVORA'
                    : 'Download the MAVORA App'}
              </h2>
              <p className="mb-8 text-lg text-white/80">
                {locale === 'ar'
                  ? 'تسوق وأبعث في أي وقت ومن أي مكان. تجربة سلسة على جوالك.'
                  : locale === 'fr'
                    ? 'Achetez et vendez à tout moment, de n\'importe où. Une expérience fluide sur mobile.'
                    : 'Shop and sell anytime, anywhere. A seamless experience on your phone.'}
              </p>
              
              {/* App Store Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button className="inline-flex items-center gap-3 rounded-xl bg-black/20 px-6 py-3 text-left transition-all hover:bg-black/30">
                  <svg className="size-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div>
                    <div className="text-[10px] text-white/70">{locale === 'fr' ? 'Télécharger sur' : 'Download on the'}</div>
                    <div className="text-base font-semibold text-white">App Store</div>
                  </div>
                </button>
                
                <button className="inline-flex items-center gap-3 rounded-xl bg-black/20 px-6 py-3 text-left transition-all hover:bg-black/30">
                  <svg className="size-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/>
                  </svg>
                  <div>
                    <div className="text-[10px] text-white/70">{locale === 'fr' ? 'Disponible sur' : 'GET IT ON'}</div>
                    <div className="text-base font-semibold text-white">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Phone Mockup Illustration */}
            <div className="hidden lg:block flex-1">
              <div className="relative mx-auto w-72">
                <div className="rounded-[3rem] border-4 border-white/20 bg-gradient-to-b from-white/10 to-transparent p-3 shadow-2xl">
                  <div className="aspect-[9/19] rounded-[2.5rem] bg-gradient-to-b from-primary to-primary-dark p-4">
                    <div className="flex h-full flex-col">
                      {/* Mock App Header */}
                      <div className="mb-4 flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald/20" />
                        <div class="h-4 w-20 rounded bg-white/20" />
                      </div>
                      {/* Mock Search */}
                      <div className="mb-4 h-10 rounded-full bg-white/10" />
                      {/* Mock Cards */}
                      <div className="space-y-3">
                        <div className="flex gap-3 rounded-xl bg-white/10 p-3">
                          <div className="size-16 rounded-lg bg-white/10" />
                          <div class="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-white/20" />
                            <div className="h-3 w-1/2 rounded bg-white/10" />
                          </div>
                        </div>
                        <div className="flex gap-3 rounded-xl bg-white/10 p-3">
                          <div className="size-16 rounded-lg bg-white/10" />
                          <div class="flex-1 space-y-2">
                            <div className="h-4 w-2/3 rounded bg-white/20" />
                            <div className="h-3 w-1/2 rounded bg-white/10" />
                          </div>
                        </div>
                        <div className="flex gap-3 rounded-xl bg-white/10 p-3">
                          <div className="size-16 rounded-lg bg-white/10" />
                          <div class="flex-1 space-y-2">
                            <div className="h-4 w-4/5 rounded bg-white/20" />
                            <div className="h-3 w-2/5 rounded bg-white/10" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 size-20 rounded-full bg-gold/20 blur-2xl" />
                <div className="absolute -bottom-4 -left-4 size-20 rounded-full bg-emerald/20 blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-navy-dark p-10 md:p-16">
            <Gift className="mx-auto mb-6 size-14 text-gold" />
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              {locale === 'ar'
                ? 'جاهز للبدء؟'
                : locale === 'fr'
                  ? 'Prêt à commencer ?'
                  : 'Ready to Get Started?'}
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
              {locale === 'ar'
                ? 'انضم إلى آلاف المستخدمين الذين يشترون ويبيعون يومياً على مافورا'
                : locale === 'fr'
                  ? 'Rejoignez des milliers d\'utilisateurs qui achètent et vendent chaque jour sur MAVORA'
                  : 'Join thousands of users who buy and sell on MAVORA every day'}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gap-2 bg-emerald px-8 text-base font-semibold text-white shadow-lg shadow-emerald/30 hover:bg-emerald/90"
                onClick={() => useNavigationStore.getState().navigateCreateListing()}
              >
                <Gift className="size-5" />
                {t('common.post_ad')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10"
                onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('categories.title')}
                <ArrowRight className={`size-5 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Listings Section */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-h3 text-foreground">{t('listings.latest')}</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1.5 text-emerald"
              onClick={() => window.location.hash = '#browse'}
            >
              {t('common.view_all')}
              <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-3">
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="mb-1 h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings && listings.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {listings.data.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => onSelectListing(listing.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <Inbox className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t('listings.no_listings')}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">{t('listings.no_listings_subtitle')}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ─── Listing Card ───────────────────────────────────────────────────

function ListingCard({ listing, onClick, isFavorited }: { listing: Listing; onClick: () => void; isFavorited?: boolean }) {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const [favorited, setFavorited] = useState(isFavorited ?? false);
  const [toggling, setToggling] = useState(false);
  const primaryImage = listing.media?.find((m) => m.is_primary) ?? listing.media?.[0];
  const categoryName = listing.category
    ? getLocalizedName(listing.category, locale)
    : '';

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error(t('favorites.login_required'));
      return;
    }
    setToggling(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}/favorite`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
        toast.success(data.favorited ? t('favorites.added') : t('favorites.removed'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setToggling(false);
    }
  }, [user, listing.id, t]);

  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-xl border border-border bg-card text-start transition-all duration-200 hover:border-emerald/40 hover:shadow-lg hover:shadow-emerald/5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={listing.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/30">
            <Search className="size-10" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute start-2 top-2 flex gap-1.5">
          {listing.is_featured && (
            <Badge className="border-0 bg-gold text-primary text-[10px] font-semibold">
              {t('common.featured')}
            </Badge>
          )}
          {listing.is_urgent && (
            <Badge className="border-0 bg-destructive text-white text-[10px] font-semibold">
              {t('common.urgent')}
            </Badge>
          )}
        </div>
        {/* Heart button */}
        <button
          onClick={handleToggleFavorite}
          disabled={toggling}
          className="absolute end-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-50"
          aria-label={favorited ? t('listing.detail.remove_from_favorites') : t('listing.detail.add_to_favorites')}
        >
          {toggling ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <Heart className={`size-4 transition-colors ${favorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'}`} />
          )}
        </button>
        {/* Price overlay */}
        {listing.price != null && listing.currency && (
          <div className="absolute bottom-0 end-0 start-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
            <span className="text-base font-bold text-white">
              {listing.currency.symbol}{listing.price.toLocaleString(locale)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-emerald">
          {listing.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {categoryName && (
            <span className="truncate">{categoryName}</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {timeAgo(listing.created_at, locale)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {listing.view_count}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Browse View ────────────────────────────────────────────────────

function BrowseView({
  categories,
  categoriesLoading,
}: {
  categories: Category[] | null;
  categoriesLoading: boolean;
}) {
  const { t, locale } = useTranslation();
  const { selectedCategoryId, searchQuery, navigateHome, navigateDetail } = useNavigationStore();
  const [listings, setListings] = useState<PaginatedResponse<Listing> | null>(null);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Filter states
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [cities, setCities] = useState<City[] | null>(null);
  const [currencies, setCurrencies] = useState<Currency[] | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Fetch countries & currencies on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/countries').then((r) => r.ok ? r.json() : []),
      fetch('/api/currencies').then((r) => r.ok ? r.json() : []),
    ]).then(([countriesData, currenciesData]) => {
      setCountries(countriesData);
      setCurrencies(currenciesData);
    });
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    if (!selectedCountryId) {
      setCities(null);
      return;
    }
    fetch(`/api/cities?country_id=${selectedCountryId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCities(data));
  }, [selectedCountryId]);

  // Compute active filter count
  const activeFilterCount = [
    selectedCountryId,
    selectedCityId,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  const fetchListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        page: String(page),
        per_page: '12',
      });
      if (selectedCategoryId) params.set('category_id', selectedCategoryId);
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCountryId) params.set('country_id', selectedCountryId);
      if (selectedCityId) params.set('city_id', selectedCityId);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);

      const res = await fetch(`/api/listings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch {
      // silent
    } finally {
      setListingsLoading(false);
    }
  }, [selectedCategoryId, searchQuery, sortBy, page, selectedCountryId, selectedCityId, minPrice, maxPrice]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [selectedCategoryId, searchQuery, sortBy, selectedCountryId, selectedCityId, minPrice, maxPrice]);

  const handleClearAllFilters = useCallback(() => {
    setSelectedCountryId(null);
    setSelectedCityId(null);
    setMinPrice('');
    setMaxPrice('');
  }, []);

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back + Title */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={navigateHome}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {searchQuery
              ? `${t('listings.search_results')} "${searchQuery}"`
              : selectedCategory
                ? getLocalizedName(selectedCategory, locale)
                : t('listings.latest')}
          </h1>
          {listings && (
            <Badge variant="secondary" className="text-xs">
              {listings.total}
            </Badge>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
          >
            <option value="newest">{t('filters.sort_newest')}</option>
            <option value="oldest">{t('filters.sort_oldest')}</option>
            <option value="price_asc">{t('filters.sort_price_low')}</option>
            <option value="price_desc">{t('filters.sort_price_high')}</option>
          </select>
        </div>
      </div>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {selectedCountryId && countries && (
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1.5 hover:bg-destructive/10"
              onClick={() => setSelectedCountryId(null)}
            >
              {countries.find((c) => c.id === selectedCountryId)?.flag_emoji}{' '}
              {getLocalizedName(countries.find((c) => c.id === selectedCountryId)!, locale)}
              <X className="size-3" />
            </Badge>
          )}
          {selectedCityId && cities && (
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1.5 hover:bg-destructive/10"
              onClick={() => setSelectedCityId(null)}
            >
              {getLocalizedName(cities.find((c) => c.id === selectedCityId)!, locale)}
              <X className="size-3" />
            </Badge>
          )}
          {minPrice && (
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1.5 hover:bg-destructive/10"
              onClick={() => setMinPrice('')}
            >
              {t('filters.min_price')}: {minPrice}
              <X className="size-3" />
            </Badge>
          )}
          {maxPrice && (
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1.5 hover:bg-destructive/10"
              onClick={() => setMaxPrice('')}
            >
              {t('filters.max_price')}: {maxPrice}
              <X className="size-3" />
            </Badge>
          )}
          <button
            onClick={handleClearAllFilters}
            className="text-xs font-medium text-emerald hover:text-emerald/80 transition-colors"
          >
            {t('filters.clear_all')}
          </button>
        </div>
      )}

      {/* Subcategories if a parent is selected */}
      {selectedCategory && selectedCategory.children && selectedCategory.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {selectedCategory.children.map((child) => {
            const Icon = getCategoryIcon(child.slug);
            return (
              <button
                key={child.id}
                onClick={() => useNavigationStore.getState().navigateBrowse(child.id, searchQuery)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-all hover:border-emerald/50 hover:bg-emerald/5"
              >
                <Icon className="size-4 text-emerald" />
                {getLocalizedName(child, locale)}
                <ChevronRight className="size-3 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}

      {/* Main content: filter sidebar + listings grid */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filter Sidebar (desktop) */}
        <div className="hidden lg:block">
          <FilterSidebar
            countries={countries}
            cities={cities}
            currencies={currencies}
            selectedCountryId={selectedCountryId}
            selectedCityId={selectedCityId}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onCountryChange={setSelectedCountryId}
            onCityChange={setSelectedCityId}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onClearAll={handleClearAllFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* Listings Grid */}
        <div className="min-w-0 flex-1">
          {listingsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-3">
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="mb-1 h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings && listings.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {listings.data.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => navigateDetail(listing.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {listings.total_pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t('common.previous')}
                  </Button>
                  <span className="px-3 text-sm text-muted-foreground">
                    {page} / {listings.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= listings.total_pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
              <Inbox className="mb-3 size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? t('listings.search_no_results') : t('listings.no_listings')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Sidebar (rendered separately for the floating button) */}
      <div className="lg:hidden">
        <FilterSidebar
          countries={countries}
          cities={cities}
          currencies={currencies}
          selectedCountryId={selectedCountryId}
          selectedCityId={selectedCityId}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onCountryChange={setSelectedCountryId}
          onCityChange={setSelectedCityId}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onClearAll={handleClearAllFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>
    </div>
  );
}

// ─── Detail View ────────────────────────────────────────────────────

function DetailView() {
  const { t, locale } = useTranslation();
  const { selectedListingId, navigateBrowse, navigateHome, navigateEditListing, navigateMessages, navigateSeller, selectListing } = useNavigationStore();
  const { user } = useAuthStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [listingFields, setListingFields] = useState<ListingFieldValue[]>([]);

  useEffect(() => {
    if (!selectedListingId) return;
    let cancelled = false;
    fetch(`/api/listings/${selectedListingId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled) setListing(data); })
      .catch(() => { if (!cancelled) setListing(null); });
    return () => { cancelled = true; };
  }, [selectedListingId]);

  // Fetch listing dynamic field values
  useEffect(() => {
    if (!selectedListingId) return;
    let cancelled = false;
    setListingFields([]);
    fetch(`/api/listings/${selectedListingId}/fields`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (!cancelled) setListingFields(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setListingFields([]); });
    return () => { cancelled = true; };
  }, [selectedListingId]);

  const handleToggleFavorite = useCallback(async () => {
    if (!user || !listing) {
      toast.error(t('favorites.login_required'));
      return;
    }
    setTogglingFav(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}/favorite`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
        toast.success(data.favorited ? t('favorites.added') : t('favorites.removed'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setTogglingFav(false);
    }
  }, [user, listing, t]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(locale === 'ar' ? 'تم نسخ الرابط' : locale === 'fr' ? 'Lien copié !' : 'Link copied!');
    } catch {
      toast.error(t('common.error'));
    }
  }, [locale, t]);

  const [contacting, setContacting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleContact = useCallback(async () => {
    if (!user) {
      toast.error(t('favorites.login_required'));
      return;
    }
    if (!listing) return;
    if (listing.seller_id === user.id) {
      toast.error(locale === 'ar' ? 'لا يمكنك التواصل مع نفسك' : locale === 'fr' ? 'Vous ne pouvez pas vous contacter' : 'You cannot contact yourself');
      return;
    }
    setContacting(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listing.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          selectListing(null);
          navigateMessages();
        }
      } else {
        const err = await res.json().catch(() => ({ error: t('common.error') }));
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setContacting(false);
    }
  }, [user, listing, t, locale, navigateMessages]);

  const handleReport = useCallback(() => {
    if (!user) {
      toast.error(t('report.login_required'));
      return;
    }
    setReportOpen(true);
  }, [user, t]);

  const handleDelete = useCallback(async () => {
    if (!listing) return;
    if (!window.confirm(t('listing.confirm_delete'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('listing.deleted'));
        navigateHome();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  }, [listing, t, navigateHome]);

  if (listing === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5" onClick={navigateHome}>
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="mb-4 h-8 w-3/4" />
            <Skeleton className="mb-4 h-10 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-sm text-muted-foreground">{t('error.not_found')}</p>
        <Button variant="outline" onClick={navigateHome}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const primaryImage = listing.media?.find((m) => m.is_primary) ?? listing.media?.[0];
  const sellerName = listing.seller?.display_name ?? '';
  const categoryName = listing.category
    ? getLocalizedName(listing.category, locale)
    : '';
  const currencySymbol = listing.currency?.symbol ?? '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateBrowse(listing.category_id)}
        className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('common.back')}
      </Button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Images */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            {primaryImage ? (
              <div className="relative aspect-[4/3]">
                <img
                  src={primaryImage.url}
                  alt={listing.title}
                  className="size-full object-cover"
                />
                {listing.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex size-16 items-center justify-center rounded-full bg-black/50 text-white">
                      <Play className="size-8" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground/30">
                <Search className="size-16" />
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {listing.media && listing.media.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {listing.media.map((m) => (
                <div
                  key={m.id}
                  className={`size-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    m.is_primary ? 'border-emerald' : 'border-border'
                  }`}
                >
                  <img src={m.url} alt="" className="size-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Video Embed */}
          {listing.video_url && (() => {
            const embedUrl = getVideoEmbedUrl(listing.video_url);
            if (!embedUrl) return null;
            return (
              <div className="mt-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
                  <iframe
                    src={embedUrl}
                    className="size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Listing video"
                  />
                </div>
              </div>
            );
          })()}

          {/* Description */}
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-foreground">
              {t('listing.detail.description')}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          </div>

          {/* Dynamic Fields (Properties) */}
          {listingFields.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
                <Settings2 className="size-5 text-[#0E9F6E]" />
                {t('listing.dynamic_fields')}
              </h2>
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
                {listingFields.map((fv) => {
                  if (!fv.field) return null;
                  const fieldName = getLocalizedName(fv.field, locale);
                  const unit = locale === 'ar'
                    ? fv.field.unit_ar ?? ''
                    : locale === 'fr'
                      ? fv.field.unit_fr ?? ''
                      : fv.field.unit_en ?? '';
                  let displayValue = fv.value;

                  // For boolean fields
                  if (fv.field.field_type === 'boolean') {
                    displayValue = fv.value === 'true' ? t('common.yes') : t('common.no');
                  }
                  // For select fields, resolve option name
                  else if (fv.field.field_type === 'select' && fv.field.options) {
                    const opt = fv.field.options.find((o) => o.id === fv.value);
                    if (opt) {
                      displayValue = locale === 'ar'
                        ? opt.value_ar
                        : locale === 'fr'
                          ? opt.value_fr
                          : opt.value_en;
                    }
                  }
                  // For multiselect fields, resolve option names
                  else if (fv.field.field_type === 'multiselect' && fv.field.options) {
                    const ids = fv.value.split(',').filter(Boolean);
                    const names = ids
                      .map((id) => {
                        const opt = fv.field!.options!.find((o) => o.id === id);
                        if (!opt) return null;
                        return locale === 'ar'
                          ? opt.value_ar
                          : locale === 'fr'
                            ? opt.value_fr
                            : opt.value_en;
                      })
                      .filter(Boolean);
                    displayValue = names.join(', ');
                  }
                  // For number fields, append unit
                  else if (fv.field.field_type === 'number' && unit) {
                    displayValue = `${fv.value} ${unit}`;
                  }

                  return (
                    <div key={fv.id} className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground">{fieldName}</span>
                      <span className="text-sm font-semibold text-foreground">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <ReviewsSection listingId={listing.id} />
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {listing.is_featured && (
                <Badge className="border-0 bg-gold text-primary">
                  <Star className="me-1 size-3" />
                  {t('common.featured')}
                </Badge>
              )}
              {listing.is_urgent && (
                <Badge className="border-0 bg-destructive text-white">
                  {t('common.urgent')}
                </Badge>
              )}
              {categoryName && (
                <Badge variant="secondary">{categoryName}</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold leading-tight text-foreground">
              {listing.title}
            </h1>

            {/* Price */}
            {listing.price != null && (
              <div className="text-3xl font-bold text-emerald">
                {currencySymbol}{listing.price.toLocaleString(locale)}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="size-4" />
                {listing.view_count} {t('listings.views')}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                {timeAgo(listing.created_at, locale)}
              </span>
            </div>

            {/* Owner actions */}
            {user && listing.seller_id === user.id && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => navigateEditListing(listing.id)}
                >
                  <Pencil className="size-4" />
                  {t('listing.edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {t('listing.delete')}
                </Button>
              </div>
            )}

            {/* Contact Button + Favorite, Share, Report */}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald text-white hover:bg-emerald/90"
                size="lg"
                onClick={handleContact}
                disabled={contacting}
              >
                {contacting ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
                {t('listings.contact_seller')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="shrink-0"
                onClick={handleToggleFavorite}
                disabled={togglingFav}
                aria-label={favorited ? t('listing.detail.remove_from_favorites') : t('listing.detail.add_to_favorites')}
              >
                {togglingFav ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Heart className={`size-5 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleShare}>
                <Share2 className="size-4" />
                {t('listing.detail.share')}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleReport}>
                <Flag className="size-4" />
                {t('listing.detail.report')}
              </Button>
            </div>

            {listing && (
              <ReportDialog
                listingId={listing.id}
                open={reportOpen}
                onOpenChange={setReportOpen}
              />
            )}

            {/* Seller Card */}
            {listing.seller && (
              <button
                type="button"
                onClick={() => navigateSeller(listing.seller_id)}
                className="w-full cursor-pointer rounded-xl border border-border p-4 text-start transition-colors hover:border-emerald/30 hover:bg-accent/50"
              >
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('listing.detail.seller')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {sellerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sellerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {listing.seller.is_verified && (
                        <span className="inline-flex items-center gap-1 text-emerald">
                          <Star className="size-3" />
                          {t('common.active')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function Home() {
  const { locale } = useTranslation();
  const { view, selectedListingId, selectedSellerId, dbConfigured, setDbConfigured, navigateBrowse, navigateDetail, navigateHome } =
    useNavigationStore();

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Sync locale direction
  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  // Check DB setup
  useEffect(() => {
    fetch('/api/setup/check')
      .then((res) => res.json())
      .then((data) => setDbConfigured(data.configured ?? false))
      .catch(() => setDbConfigured(false));
  }, [setDbConfigured]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch {
        // silent
      } finally {
        setCategoriesLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Navigation handlers
  const handleSearch = useCallback(
    (query: string) => {
      navigateBrowse(null, query);
    },
    [navigateBrowse]
  );

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      navigateBrowse(categoryId);
    },
    [navigateBrowse]
  );

  // Show setup view if DB not configured
  if (dbConfigured === false && view === 'home') {
    return (
      <>
        <Header />
        <SetupView />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        {view === 'home' && (
          <HomeView
            categories={categories}
            categoriesLoading={categoriesLoading}
            onSearch={handleSearch}
            onSelectCategory={handleSelectCategory}
            onSelectListing={navigateDetail}
          />
        )}
        {view === 'browse' && (
          <BrowseView
            categories={categories}
            categoriesLoading={categoriesLoading}
          />
        )}
        {view === 'detail' && selectedListingId && <DetailView key={selectedListingId} />}
        {view === 'create-listing' && <CreateListingForm />}
        {view === 'profile' && <ProfilePage />}
        {view === 'favorites' && <FavoritesPage />}
        {view === 'messages' && <ConversationsPage />}
        {view === 'admin' && <AdminDashboard />}
        {view === 'seller' && selectedSellerId && <SellerProfilePage key={selectedSellerId} />}
        {view === 'organization' && <OrganizationPage />}
        {view === 'wallet' && <WalletPage />}
        {view === 'invoices' && <InvoicesPage />}
      </main>
      <Footer />
    </>
  );
}
