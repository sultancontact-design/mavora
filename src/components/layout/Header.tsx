'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Menu, 
  Globe, 
  ChevronDown, 
  User, 
  LogOut, 
  Heart, 
  MessageSquare, 
  Settings, 
  Package, 
  MapPin, 
  Loader2, 
  Wallet, 
  FileText,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLocaleStore } from '@/stores/locale';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import AuthModal, { type AuthView } from '@/components/auth/AuthModal';
import NotificationBell from '@/components/common/NotificationBell';
import { ThemeToggle } from '@/components/ThemeProvider';
import MavoraLogo from '@/components/common/MavoraLogo';
import type { Locale } from '@/lib/types';

/* ── Constants ── */

const LOCALE_OPTIONS: { value: Locale; flag: string; label: string; nativeName: string }[] = [
  { value: 'ar', flag: '🇲🇦', label: 'AR', nativeName: 'العربية' },
  { value: 'fr', flag: '🇫🇷', label: 'FR', nativeName: 'Français' },
  { value: 'en', flag: '🇬🇧', label: 'EN', nativeName: 'English' },
];

const COUNTRIES = [
  { code: 'MA', flag: '🇲🇦', nameAr: 'المغرب', nameFr: 'Maroc', nameEn: 'Morocco' },
  { code: 'DZ', flag: '🇩🇿', nameAr: 'الجزائر', nameFr: 'Algérie', nameEn: 'Algeria' },
  { code: 'TN', flag: '🇹🇳', nameAr: 'تونس', nameFr: 'Tunisie', nameEn: 'Tunisia' },
  { code: 'EG', flag: '🇪🇬', nameAr: 'مصر', nameFr: 'Égypte', nameEn: 'Egypt' },
  { code: 'SA', flag: '🇸🇦', nameAr: 'السعودية', nameFr: 'Arabie Saoudite', nameEn: 'Saudi Arabia' },
  { code: 'AE', flag: '🇦🇪', nameAr: 'الإمارات', nameFr: 'Émirats', nameEn: 'UAE' },
];

const NAV_LINKS = [
  { key: 'categories.title', href: '#categories', icon: null },
  { key: 'listings.featured', href: '#featured', icon: null },
  { key: 'footer.about', href: '#about', icon: null },
] as const;

/* ── Main Component ── */

export default function Header() {
  const { t, locale } = useTranslation();
  const { setLocale } = useLocaleStore();
  const { user, setUser, isLoading } = useAuthStore();
  const { navigateCreateListing, navigateProfile, navigateFavorites, navigateMessages, navigateWallet, navigateInvoices } = useNavigationStore();
  const router = useRouter();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isRtl = locale === 'ar';
  const direction = isRtl ? 'rtl' : 'ltr';

  /* ── Back Navigation Handler ── */
  const handleGoBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  /* ── Effects ── */

  const updateDocumentDirection = useCallback(
    (newLocale: Locale) => {
      const dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
      document.documentElement.dir = dir;
    },
    []
  );

  useEffect(() => {
    updateDocumentDirection(locale);
  }, [locale, updateDocumentDirection]);

  /* ── Handlers ── */

  const handleLocaleChange = useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale);
    },
    [setLocale]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        toast.info(t('common.search') + ': ' + searchQuery.trim());
        // Navigate to search results would go here
      }
    },
    [searchQuery, t]
  );

  const openAuth = useCallback((view: AuthView) => {
    setAuthView(view);
    setAuthModalOpen(true);
  }, []);

  const handlePostAd = useCallback(() => {
    if (!user) {
      openAuth('login');
      return;
    }
    navigateCreateListing();
  }, [user, openAuth, navigateCreateListing]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        toast.success(t('auth.logout_success'));
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('auth.error_occurred'));
    } finally {
      setIsLoggingOut(false);
    }
  }, [setUser, t]);

  /* ── Computed Values ── */

  const currentLocaleOption = useMemo(
    () => LOCALE_OPTIONS.find((o) => o.value === locale) ?? LOCALE_OPTIONS[0],
    [locale]
  );

  const getCountryName = useCallback(
    (country: (typeof COUNTRIES)[0]) => {
      switch (locale) {
        case 'ar': return country.nameAr;
        case 'fr': return country.nameFr;
        default: return country.nameEn;
      }
    },
    [locale]
  );

  const userInitials = useMemo(() => {
    if (!user?.display_name) return '?';
    return user.display_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.display_name]);

  /* ── Render ── */

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          
          {/* ── Back Button (visible on all screens when not on homepage) ── */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="shrink-0 touch-target rounded-xl hover:bg-gray-100"
            aria-label={isRtl ? 'رجوع' : 'Go back'}
          >
            <ArrowLeft className={`size-5 text-gray-700 ${!isRtl ? 'rotate-180' : ''}`} />
          </Button>
          
          {/* ── Mobile: Hamburger + Logo ── */}
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 touch-target rounded-xl hover:bg-gray-100" 
                  aria-label={isRtl ? 'فتح القائمة' : 'Open menu'}
                >
                  <Menu className="size-5 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRtl ? 'right' : 'left'} className="w-80 overflow-y-auto border-l border-r-0">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    <MavoraLogo size="sm" />
                  </SheetTitle>
                </SheetHeader>
                
                {/* Mobile Navigation */}
                <nav className="mt-8 flex flex-col gap-1">
                  {/* Quick Links */}
                  <div className="mb-4">
                    <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                      {t('categories.title')}
                    </p>
                    {NAV_LINKS.map((link) => (
                      <SheetClose asChild key={link.key}>
                        <a
                          href={link.href}
                          className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-teal-50 hover:text-teal-700"
                        >
                          {t(link.key)}
                          <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
                        </a>
                      </SheetClose>
                    ))}
                  </div>

                  <div className="my-3 h-px bg-gray-100" />

                  {/* Auth State */}
                  {user ? (
                    <>
                      {/* User Info */}
                      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 p-4">
                        <Avatar className="size-12 ring-2 ring-teal-200">
                          <AvatarImage src={user.avatar_url} alt={user.display_name} />
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-sm font-bold">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">{user.display_name}</p>
                          <p className="truncate text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>

                      {/* User Links */}
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full h-12 rounded-xl hover:bg-gray-50" onClick={() => navigateProfile(user?.id)}>
                          <User className="size-5 text-gray-500" />
                          <span className="font-medium">{t('common.profile')}</span>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full h-12 rounded-xl hover:bg-gray-50">
                          <Package className="size-5 text-gray-500" />
                          <span className="font-medium">{t('common.my_listings')}</span>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full h-12 rounded-xl hover:bg-gray-50" onClick={navigateFavorites}>
                          <Heart className="size-5 text-gray-500" />
                          <span className="font-medium">{t('common.favorites')}</span>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full h-12 rounded-xl hover:bg-gray-50" onClick={navigateMessages}>
                          <MessageSquare className="size-5 text-gray-500" />
                          <span className="font-medium">{t('common.messages')}</span>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full h-12 rounded-xl hover:bg-gray-50" onClick={navigateWallet}>
                          <Wallet className="size-5 text-gray-500" />
                          <span className="font-medium">{t('common.wallet')}</span>
                        </Button>
                      </SheetClose>
                      
                      <div className="my-3 h-px bg-gray-100" />
                      
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 w-full h-12 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? <Loader2 className="size-5 animate-spin" /> : <LogOut className="size-5" />}
                        <span className="font-medium">{isLoggingOut ? t('common.loading') : t('common.logout')}</span>
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <SheetClose asChild>
                        <Button
                          className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/25 rounded-xl btn-lift"
                          onClick={() => openAuth('login')}
                        >
                          {t('common.login')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-semibold"
                          onClick={() => openAuth('signup')}
                        >
                          {t('common.signup')}
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <MavoraLogo size="sm" className="text-teal-600" />
            </Link>
          </div>

          {/* ── Desktop: Logo ── */}
          <div className="hidden lg:flex lg:items-center lg:shrink-0">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <MavoraLogo size="md" className="text-teal-600" />
            </Link>
          </div>

          {/* ── Country Selector (Desktop) ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden gap-1.5 text-sm font-normal text-gray-500 hover:text-gray-700 md:inline-flex rounded-lg"
              >
                <MapPin className="size-4 text-teal-500" />
                <span>{selectedCountry.flag}</span>
                <span className="hidden xl:inline font-medium">{getCountryName(selectedCountry)}</span>
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 rounded-xl p-2">
              {COUNTRIES.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => setSelectedCountry(country)}
                  className="gap-2 cursor-pointer rounded-lg py-2.5"
                >
                  <span className="text-base">{country.flag}</span>
                  <span className="flex-1 font-medium">{getCountryName(country)}</span>
                  {selectedCountry.code === country.code && (
                    <Badge className="ms-auto bg-teal-100 text-teal-700 border-0 text-[10px] px-1.5 h-5">✓</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── Search Bar (Desktop) ── */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden flex-1 justify-center px-4 md:flex"
          >
            <div className={`relative w-full max-w-xl transition-all duration-300 ${isSearchFocused ? 'scale-[1.01]' : ''}`}>
              <Search className={`absolute start-4 top-1/2 size-4.5 -translate-y-1/2 transition-colors duration-200 ${isSearchFocused ? 'text-teal-500' : 'text-gray-400'}`} />
              <Input
                type="search"
                placeholder={t('hero.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`h-11 rounded-xl border-gray-200 bg-gray-50/80 pe-28 ps-11 text-sm transition-all duration-200 focus-visible:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:bg-white ${
                  isSearchFocused ? 'shadow-lg shadow-teal-500/10 border-teal-300' : ''
                }`}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute end-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 px-4 text-sm font-semibold text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all"
              >
                {t('common.search')}
              </Button>
            </div>
          </form>

          {/* ── Right Side Actions ── */}
          <div className="flex items-center gap-1 sm:gap-2 ms-auto lg:ms-0">
            
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden touch-target rounded-xl hover:bg-gray-100"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label={t('common.search')}
            >
              <Search className="size-5 text-gray-700" />
            </Button>

            {/* Notification Bell */}
            {user && <NotificationBell />}
            <ThemeToggle variant="icon-only" />

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-sm font-normal text-gray-500 hover:text-gray-700 touch-target rounded-lg"
                >
                  <Globe className="size-4.5" />
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <span className="text-base">{currentLocaleOption.flag}</span>
                    <span className="hidden lg:inline font-medium">{currentLocaleOption.nativeName}</span>
                  </span>
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl p-2">
                {LOCALE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleLocaleChange(opt.value)}
                    className="gap-2 cursor-pointer rounded-lg py-2.5"
                  >
                    <span className="text-base">{opt.flag}</span>
                    <span className="flex-1 font-medium">{opt.nativeName}</span>
                    {locale === opt.value && (
                      <Badge className="ms-auto bg-teal-100 text-teal-700 border-0 text-[10px] px-1.5 h-5">✓</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Post Ad Button (Desktop) */}
            <Button
              size="sm"
              className="hidden gap-2 bg-gradient-to-r from-coral to-coral-light hover:from-coral-dark hover:to-coral text-white shadow-lg shadow-coral/25 hover:shadow-coral/35 transition-all sm:inline-flex btn-lift rounded-xl font-semibold"
              onClick={handlePostAd}
            >
              <Plus className="size-4.5" />
              <span className="hidden lg:inline">{t('common.post_ad')}</span>
            </Button>

            {/* Auth Buttons or User Menu */}
            {isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="size-5 animate-spin text-teal-500" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative touch-target hover:bg-gray-100">
                    <Avatar className="size-9 ring-2 ring-teal-200 ring-offset-2 ring-offset-white">
                      <AvatarImage src={user.avatar_url} alt={user.display_name} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-xs font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-gray-900">{user.display_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem className="gap-2.5 cursor-pointer rounded-lg py-2.5" onClick={() => navigateProfile(user?.id)}>
                    <User className="size-4 text-gray-500" />
                    <span className="font-medium">{t('common.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2.5 cursor-pointer rounded-lg py-2.5">
                    <Package className="size-4 text-gray-500" />
                    <span className="font-medium">{t('common.my_listings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2.5 cursor-pointer rounded-lg py-2.5" onClick={navigateFavorites}>
                    <Heart className="size-4 text-gray-500" />
                    <span className="font-medium">{t('common.favorites')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2.5 cursor-pointer rounded-lg py-2.5" onClick={navigateMessages}>
                    <MessageSquare className="size-4 text-gray-500" />
                    <span className="font-medium">{t('common.messages')}</span>
                    <Badge variant="secondary" className="ms-auto h-5 min-w-5 rounded-full px-1.5 bg-violet-100 text-violet-700 border-0 text-[10px]">
                      3
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2.5 cursor-pointer rounded-lg py-2.5" onClick={navigateWallet}>
                    <Wallet className="size-4 text-gray-500" />
                    <span className="font-medium">{t('common.wallet')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2.5 cursor-pointer rounded-lg py-2.5" onClick={navigateInvoices}>
                    <FileText className="size-4 text-gray-500" />
                    <span className="font-medium">{t('invoices.title')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem className="gap-2.5 cursor-pointer rounded-lg py-2.5">
                    <Settings className="size-4 text-gray-500" />
                    <span className="font-medium">{t('common.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    className="gap-2.5 text-rose-600 focus:text-rose-700 cursor-pointer rounded-lg py-2.5"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                    <span className="font-medium">{isLoggingOut ? t('common.loading') : t('common.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth('login')}
                  className="font-semibold text-gray-700 hover:text-teal-600 rounded-lg"
                >
                  {t('common.login')}
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold shadow-md shadow-teal-500/20 hover:shadow-lg btn-lift rounded-xl"
                  onClick={() => openAuth('signup')}
                >
                  {t('common.signup')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile Search Bar (Expandable) ── */}
        {mobileSearchOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden animate-slide-down">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder={t('hero.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-12 rounded-xl border-gray-200 bg-gray-50 pe-11 ps-11 text-sm focus:border-teal-400 focus:ring-teal-500/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute end-2 top-1/2 -translate-y-1/2 size-9 rounded-lg hover:bg-gray-100"
                onClick={() => setMobileSearchOpen(false)}
                aria-label={t('common.close')}
              >
                <X className="size-4.5" />
              </Button>
            </form>
          </div>
        )}

        {/* ── Mobile Bottom Bar — Post Ad CTA ── */}
        <div className="border-t border-gray-100 bg-white px-4 py-2.5 md:hidden">
          <Button
            size="sm"
            className="w-full gap-2 bg-gradient-to-r from-coral to-coral-light hover:from-coral-dark hover:to-coral text-white font-semibold shadow-lg shadow-coral/25 btn-lift rounded-xl h-11"
            onClick={handlePostAd}
          >
            <Plus className="size-4.5" />
            {t('common.post_ad')}
          </Button>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultView={authView}
      />
    </>
  );
}
