'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  ArrowRight
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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          
          {/* ── Mobile: Hamburger + Logo ── */}
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 touch-target" 
                  aria-label={isRtl ? 'فتح القائمة' : 'Open menu'}
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRtl ? 'right' : 'left'} className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    <MavoraLogo size="sm" />
                  </SheetTitle>
                </SheetHeader>
                
                {/* Mobile Navigation */}
                <nav className="mt-8 flex flex-col gap-1">
                  {/* Quick Links */}
                  <div className="mb-4">
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('categories.title')}
                    </p>
                    {NAV_LINKS.map((link) => (
                      <SheetClose asChild key={link.key}>
                        <a
                          href={link.href}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                        >
                          {t(link.key)}
                          <ArrowRight className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
                        </a>
                      </SheetClose>
                    ))}
                  </div>

                  <div className="my-3 border-t border-border" />

                  {/* Auth State */}
                  {user ? (
                    <>
                      {/* User Info */}
                      <div className="mb-4 flex items-center gap-3 rounded-lg bg-accent px-3 py-3">
                        <Avatar className="size-10">
                          <AvatarImage src={user.avatar_url} alt={user.display_name} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{user.display_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>

                      {/* User Links */}
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full" onClick={() => navigateProfile(user?.id)}>
                          <User className="size-4" />
                          {t('common.profile')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full">
                          <Package className="size-4" />
                          {t('common.my_listings')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full" onClick={navigateFavorites}>
                          <Heart className="size-4" />
                          {t('common.favorites')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full" onClick={navigateMessages}>
                          <MessageSquare className="size-4" />
                          {t('common.messages')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3 w-full" onClick={navigateWallet}>
                          <Wallet className="size-4" />
                          {t('common.wallet')}
                        </Button>
                      </SheetClose>
                      
                      <div className="my-3 border-t border-border" />
                      
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                        {isLoggingOut ? t('common.loading') : t('common.logout')}
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Button
                          variant="default"
                          className="w-full bg-emerald hover:bg-emerald/90 text-white font-semibold"
                          onClick={() => openAuth('login')}
                        >
                          {t('common.login')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-full"
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
            
            <MavoraLogo size="sm" className="text-primary" />
          </div>

          {/* ── Desktop: Logo ── */}
          <div className="hidden lg:flex lg:items-center lg:shrink-0">
            <MavoraLogo size="md" className="text-primary" />
          </div>

          {/* ── Country Selector (Desktop) ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden gap-1.5 text-sm font-normal text-muted-foreground hover:text-foreground md:inline-flex"
              >
                <MapPin className="size-3.5" />
                <span>{selectedCountry.flag}</span>
                <span className="hidden xl:inline">{getCountryName(selectedCountry)}</span>
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {COUNTRIES.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => setSelectedCountry(country)}
                  className="gap-2 cursor-pointer"
                >
                  <span className="text-base">{country.flag}</span>
                  <span className="flex-1">{getCountryName(country)}</span>
                  {selectedCountry.code === country.code && (
                    <Badge variant="secondary" className="ms-auto text-[10px] px-1.5">
                      ✓
                    </Badge>
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
            <div className={`relative w-full max-w-xl transition-all duration-200 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <Search className={`absolute start-4 top-1/2 size-4 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-emerald' : 'text-muted-foreground'}`} />
              <Input
                type="search"
                placeholder={t('hero.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`h-10 rounded-full border-border bg-secondary pe-12 ps-10 text-sm transition-all duration-200 focus-visible:border-emerald/50 focus-visible:ring-2 focus-visible:ring-emerald/20 ${
                  isSearchFocused ? 'shadow-lg shadow-emerald/10' : ''
                }`}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute end-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full bg-emerald px-4 text-sm font-semibold text-white hover:bg-emerald/90 transition-all"
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
              className="md:hidden touch-target"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label={t('common.search')}
            >
              <Search className="size-5" />
            </Button>

            {/* Notification Bell */}
            {user && <NotificationBell />}

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-sm font-normal text-muted-foreground hover:text-foreground touch-target"
                >
                  <Globe className="size-4" />
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <span className="text-base">{currentLocaleOption.flag}</span>
                    <span className="hidden lg:inline">{currentLocaleOption.nativeName}</span>
                  </span>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {LOCALE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleLocaleChange(opt.value)}
                    className="gap-2 cursor-pointer"
                  >
                    <span className="text-base">{opt.flag}</span>
                    <span className="flex-1">{opt.nativeName}</span>
                    {locale === opt.value && (
                      <Badge variant="secondary" className="ms-auto text-[10px] px-1.5">
                        ✓
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Post Ad Button (Desktop) */}
            <Button
              size="sm"
              className="hidden gap-1.5 bg-emerald text-emerald-foreground shadow-sm shadow-emerald/20 hover:bg-emerald/90 hover:shadow-emerald/30 transition-all sm:inline-flex btn-press"
              onClick={handlePostAd}
            >
              <Plus className="size-4" />
              <span className="hidden lg:inline font-semibold">{t('common.post_ad')}</span>
            </Button>

            {/* Auth Buttons or User Menu */}
            {isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative touch-target">
                    <Avatar className="size-8 ring-2 ring-emerald/20">
                      <AvatarImage src={user.avatar_url} alt={user.display_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigateProfile(user?.id)}>
                    <User className="size-4" />
                    {t('common.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Package className="size-4" />
                    {t('common.my_listings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={navigateFavorites}>
                    <Heart className="size-4" />
                    {t('common.favorites')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={navigateMessages}>
                    <MessageSquare className="size-4" />
                    {t('common.messages')}
                    <Badge variant="secondary" className="ms-auto h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                      3
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={navigateWallet}>
                    <Wallet className="size-4" />
                    {t('common.wallet')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={navigateInvoices}>
                    <FileText className="size-4" />
                    {t('invoices.title')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Settings className="size-4" />
                    {t('common.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                    {isLoggingOut ? t('common.loading') : t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth('login')}
                  className="font-medium"
                >
                  {t('common.login')}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold btn-press"
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
          <div className="border-t border-border bg-card px-4 py-3 md:hidden animate-slide-down">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('hero.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-11 rounded-full border-border bg-secondary pe-11 ps-10 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute end-2 top-1/2 -translate-y-1/2 size-7"
                onClick={() => setMobileSearchOpen(false)}
                aria-label={t('common.close')}
              >
                <X className="size-4" />
              </Button>
            </form>
          </div>
        )}

        {/* ── Mobile Bottom Bar — Post Ad CTA ── */}
        <div className="border-t border-border bg-card px-4 py-2 md:hidden">
          <Button
            size="sm"
            className="w-full gap-1.5 bg-emerald text-emerald-foreground hover:bg-emerald/90 font-semibold shadow-sm shadow-emerald/20 btn-press"
            onClick={handlePostAd}
          >
            <Plus className="size-4" />
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
