'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Plus, Menu, Globe, ChevronDown, User, LogOut, Heart, MessageSquare, Settings, Package, MapPin, Loader2, Wallet, FileText } from 'lucide-react';
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
import type { Locale } from '@/lib/types';

const LOCALE_OPTIONS: { value: Locale; flag: string; label: string }[] = [
  { value: 'ar', flag: '🇲🇦', label: 'العربية' },
  { value: 'fr', flag: '🇫🇷', label: 'Français' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
];

const COUNTRIES = [
  { code: 'MA', flag: '🇲🇦', nameAr: 'المغرب', nameFr: 'Maroc', nameEn: 'Morocco' },
  { code: 'DZ', flag: '🇩🇿', nameAr: 'الجزائر', nameFr: 'Algérie', nameEn: 'Algeria' },
  { code: 'TN', flag: '🇹🇳', nameAr: 'تونس', nameFr: 'Tunisie', nameEn: 'Tunisia' },
  { code: 'EG', flag: '🇪🇬', nameAr: 'مصر', nameFr: 'Égypte', nameEn: 'Egypt' },
  { code: 'SA', flag: '🇸🇦', nameAr: 'السعودية', nameFr: 'Arabie Saoudite', nameEn: 'Saudi Arabia' },
  { code: 'AE', flag: '🇦🇪', nameAr: 'الإمارات', nameFr: 'Émirats', nameEn: 'UAE' },
];

function MavoraLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MAVORA"
    >
      {/* Left downward arrow (supply) */}
      <path
        d="M8 8 L22 32 L28 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18 32 L22 32 L26 24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right upward arrow (demand) */}
      <path
        d="M32 32 L46 8 L52 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M42 8 L46 8 L50 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* MAVORA text */}
      <text
        x="60"
        y="28"
        fontFamily="var(--font-inter), sans-serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="2"
        fill="currentColor"
      >
        MAVORA
      </text>
    </svg>
  );
}

export default function Header() {
  const { t, locale } = useTranslation();
  const { setLocale } = useLocaleStore();
  const { user, setUser, isLoading } = useAuthStore();
  const { navigateCreateListing, navigateProfile, navigateFavorites, navigateMessages, navigateWallet, navigateInvoices } = useNavigationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

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

  const handleLocaleChange = useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale);
    },
    [setLocale]
  );

  const currentLocaleOption = useMemo(
    () => LOCALE_OPTIONS.find((o) => o.value === locale) ?? LOCALE_OPTIONS[0],
    [locale]
  );

  const getCountryName = useCallback(
    (country: (typeof COUNTRIES)[0]) => {
      switch (locale) {
        case 'ar':
          return country.nameAr;
        case 'fr':
          return country.nameFr;
        default:
          return country.nameEn;
      }
    },
    [locale]
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

  const userInitials = useMemo(() => {
    if (!user?.display_name) return '?';
    return user.display_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.display_name]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-4 lg:px-6">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <MavoraLogo className="h-8 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {user ? (
                    <>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3" onClick={() => navigateProfile(user?.id)}>
                          <User className="size-4" />
                          {t('common.profile')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3">
                          <Package className="size-4" />
                          {t('common.my_listings')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3" onClick={navigateFavorites}>
                          <Heart className="size-4" />
                          {t('common.favorites')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3" onClick={navigateMessages}>
                          <MessageSquare className="size-4" />
                          {t('common.messages')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3" onClick={navigateWallet}>
                          <Wallet className="size-4" />
                          {t('common.wallet')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3" onClick={navigateInvoices}>
                          <FileText className="size-4" />
                          {t('invoices.title')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start gap-3">
                          <Settings className="size-4" />
                          {t('common.settings')}
                        </Button>
                      </SheetClose>
                      <div className="my-2 border-t border-border" />
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 text-destructive hover:text-destructive"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                        {isLoggingOut ? t('common.loading') : t('common.logout')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button
                          variant="default"
                          className="w-full justify-center bg-primary hover:bg-primary/90"
                          onClick={() => openAuth('login')}
                        >
                          {t('common.login')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-center"
                          onClick={() => openAuth('signup')}
                        >
                          {t('common.signup')}
                        </Button>
                      </SheetClose>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            <MavoraLogo className="h-8 w-auto text-primary" />
          </div>

          {/* Desktop: logo */}
          <div className="hidden lg:flex lg:items-center lg:shrink-0">
            <MavoraLogo className="h-9 w-auto text-primary" />
          </div>

          {/* Country selector — desktop only */}
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
            <DropdownMenuContent align="start" className="w-48">
              {COUNTRIES.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => setSelectedCountry(country)}
                  className="gap-2"
                >
                  <span>{country.flag}</span>
                  <span>{getCountryName(country)}</span>
                  {selectedCountry.code === country.code && (
                    <Badge variant="secondary" className="ms-auto text-xs">
                      ✓
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search bar — desktop */}
          <div className="hidden flex-1 justify-center px-4 md:flex">
            <div className="relative w-full max-w-xl">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('hero.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="h-10 rounded-full border-border bg-secondary pe-4 ps-10 text-sm transition-all focus-visible:ring-emerald"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2 ms-auto lg:ms-0">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label={t('common.search')}
            >
              <Search className="size-5" />
            </Button>

            {/* Notification bell */}
            {user && <NotificationBell />}

            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-sm font-normal text-muted-foreground hover:text-foreground"
                >
                  <Globe className="size-4" />
                  <span className="hidden sm:inline">{currentLocaleOption.flag} {currentLocaleOption.label}</span>
                  <span className="sm:hidden">{currentLocaleOption.flag}</span>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {LOCALE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleLocaleChange(opt.value)}
                    className="gap-2"
                  >
                    <span className="text-base">{opt.flag}</span>
                    <span>{opt.label}</span>
                    {locale === opt.value && (
                      <Badge variant="secondary" className="ms-auto text-xs">
                        ✓
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Post Ad button — desktop */}
            <Button
              size="sm"
              className="hidden gap-1.5 bg-emerald text-emerald-foreground shadow-sm hover:bg-emerald/90 sm:inline-flex"
              onClick={handlePostAd}
            >
              <Plus className="size-4" />
              <span className="hidden lg:inline">{t('common.post_ad')}</span>
            </Button>

            {/* Auth buttons or user menu */}
            {isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="size-8">
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
                      <p className="text-sm font-medium">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={() => navigateProfile(user?.id)}>
                    <User className="size-4" />
                    {t('common.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Package className="size-4" />
                    {t('common.my_listings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={navigateFavorites}>
                    <Heart className="size-4" />
                    {t('common.favorites')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={navigateMessages}>
                    <MessageSquare className="size-4" />
                    {t('common.messages')}
                    <Badge variant="secondary" className="ms-auto h-5 min-w-5 rounded-full px-1.5 text-xs">
                      3
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={navigateWallet}>
                    <Wallet className="size-4" />
                    {t('common.wallet')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={navigateInvoices}>
                    <FileText className="size-4" />
                    {t('invoices.title')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <Settings className="size-4" />
                    {t('common.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
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
                >
                  {t('common.login')}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => openAuth('signup')}
                >
                  {t('common.signup')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search bar (expandable) */}
        {mobileSearchOpen && (
          <div className="border-t border-border px-3 py-2 md:hidden">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('hero.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-10 rounded-full border-border bg-secondary pe-4 ps-10 text-sm"
              />
            </div>
          </div>
        )}

        {/* Mobile bottom bar — Post Ad CTA */}
        <div className="border-t border-border px-3 py-2 md:hidden">
          <Button
            size="sm"
            className="w-full gap-1.5 bg-emerald text-emerald-foreground hover:bg-emerald/90"
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
