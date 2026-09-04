'use client';

import { useState, useCallback } from 'react';
import { Search, ArrowRight, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

/* ── Quick Filter Options ── */

const QUICK_FILTERS = [
  { key: 'categories.vehicles', icon: '🚗', value: 'vehicles' },
  { key: 'categories.real_estate', icon: '🏠', value: 'real-estate' },
  { key: 'categories.electronics', icon: '📱', value: 'electronics' },
  { key: 'categories.jobs', icon: '💼', value: 'jobs' },
  { key: 'categories.services', icon: '🔧', value: 'services' },
  { key: 'categories.fashion', icon: '👗', value: 'fashion' },
];

/* ── Main Component ── */

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const searchQuery = (activeFilter ? `${activeFilter} ` : '') + query.trim();
      if (searchQuery.trim()) {
        onSearch(searchQuery.trim());
      }
    },
    [query, activeFilter, onSearch]
  );

  const handleFilterClick = useCallback((value: string) => {
    setActiveFilter((prev) => (prev === value ? null : value));
  }, []);

  const isRtl = locale === 'ar';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[#1a3a5c] px-4 py-16 sm:py-20 lg:py-28">
      
      {/* ── Background Decorations ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Gradient Orbs */}
        <div className="absolute -start-32 -top-32 size-[500px] rounded-full bg-emerald/10 blur-3xl animate-float" />
        <div className="absolute -end-24 top-1/4 size-[400px] rounded-full bg-emerald/8 blur-3xl animate-float stagger-2" />
        <div className="absolute -bottom-20 start-1/3 size-[350px] rounded-full bg-gold/8 blur-3xl animate-float stagger-4" />
        
        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, white 1px, transparent 0)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Diagonal Lines Pattern */}
        <svg 
          className="absolute bottom-0 start-0 w-full opacity-5" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="diagonal-lines" patternUnits="userSpaceOnUse" width="40" height="40">
              <path d="M-10,10 l20,-20 M0,40 l40,-40 M30,50 l20,-20" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
        </svg>
      </div>

      {/* ── Content Container ── */}
      <div className="relative mx-auto max-w-5xl">
        
        {/* Badge / Trust Indicator */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm animate-fade-in">
            <Sparkles className="size-4 text-gold" />
            <span>{locale === 'ar' ? 'سوقك الإلكتروني في المغرب وشمال إفريقيا' : locale === 'fr' ? 'Votre marché en ligne au Maroc et en Afrique du Nord' : 'Your marketplace in Morocco & North Africa'}</span>
            <TrendingUp className="size-4 text-emerald" />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl animate-slide-up">
          {locale === 'ar' && (
            <>
              <span className="block">ابحث، اعرض وتبادل</span>
              <span className="block mt-2 bg-gradient-to-l from-emerald to-gold bg-clip-text text-transparent">
                في مكان واحد
              </span>
            </>
          )}
          {locale === 'fr' && (
            <>
              <span className="block">Cherchez, Vendez, Échangez</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald to-gold bg-clip-text text-transparent">
                Tout en un seul endroit
              </span>
            </>
          )}
          {locale === 'en' && (
            <>
              <span className="block">Search, Sell & Trade</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald to-gold bg-clip-text text-transparent">
                All in One Place
              </span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-white/70 sm:text-lg animate-slide-up stagger-1">
          {t('hero.subtitle')}
        </p>

        {/* ── Search Bar ── */}
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="mx-auto max-w-3xl animate-slide-up stagger-2"
        >
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
            
            {/* Search Input Container */}
            <div className="relative flex-1">
              <Search className={`absolute ${isRtl ? 'end-4' : 'start-4'} top-1/2 size-5 -translate-y-1/2 transition-colors ${query ? 'text-emerald' : 'text-white/50'}`} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('hero.search_placeholder')}
                className={`h-14 w-full rounded-2xl border-0 bg-white/95 pe-36 ps-12 text-base text-foreground shadow-xl backdrop-blur-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 focus-visible:bg-white sm:rounded-r-none sm:pe-44 ${
                  query ? 'shadow-emerald/20' : ''
                }`}
                aria-label={t('hero.search_placeholder')}
              />
              
              {/* Search Button (inside input on desktop) */}
              <Button
                type="submit"
                className={`absolute ${isRtl ? 'start-2.5' : 'end-2.5'} top-1/2 h-10 -translate-y-1/2 rounded-xl bg-emerald px-6 text-sm font-semibold text-white shadow-md hover:bg-emerald/90 hover:shadow-lg transition-all hidden sm:inline-flex`}
              >
                {t('common.search')}
                <ArrowRight className={`ms-2 size-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Mobile Search Button */}
            <Button
              type="submit"
              className="h-14 w-full rounded-2xl bg-emerald px-8 text-base font-semibold text-white shadow-lg hover:bg-emerald/90 sm:hidden btn-press"
            >
              {t('common.search')}
              <ArrowRight className={`ms-2 size-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-white/50 me-2">
              {locale === 'ar' ? 'بحث سريع:' : locale === 'fr' ? 'Recherche rapide :' : 'Quick search:'}
            </span>
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleFilterClick(filter.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeFilter === filter.value
                    ? 'bg-emerald text-white shadow-md'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <span>{filter.icon}</span>
                {t(filter.key)}
              </button>
            ))}
          </div>
        </form>

        {/* ── Trust Badges ── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 animate-slide-up stagger-3">
          <div className="flex items-center gap-2 text-white/60">
            <Shield className="size-5 text-emerald" />
            <span className="text-sm">{locale === 'ar' ? 'آمن وموثوق' : locale === 'fr' ? 'Sûr et fiable' : 'Safe & Trusted'}</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-white/20" />
          <div className="flex items-center gap-2 text-white/60">
            <TrendingUp className="size-5 text-gold" />
            <span className="text-sm">{locale === 'ar' ? 'إعلانات متنوعة' : locale === 'fr' ? 'Annonces variées' : 'Diverse Listings'}</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-white/20" />
          <div className="flex items-center gap-2 text-white/60">
            <Sparkles className="size-5 text-emerald" />
            <span className="text-sm">{locale === 'ar' ? 'مجاني تماماً' : locale === 'fr' ? 'Entièrement gratuit' : '100% Free'}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Wave Decoration ── */}
      <div className="absolute bottom-0 start-0 w-full overflow-hidden leading-none" aria-hidden="true">
        <svg
          className="relative block w-full h-12 sm:h-16 lg:h-20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            className="text-background"
            d="M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z"
          />
        </svg>
      </div>
    </section>
  );
}
