'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, ArrowRight, Sparkles, TrendingUp, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

/* ── Quick Filter Options ── */

const QUICK_FILTERS = [
  { key: 'categories.vehicles', icon: '🚗', value: 'vehicles', gradient: 'from-blue-500 to-cyan-500' },
  { key: 'categories.real_estate', icon: '🏠', value: 'real-estate', gradient: 'from-emerald-500 to-teal-500' },
  { key: 'categories.electronics', icon: '📱', value: 'electronics', gradient: 'from-violet-500 to-purple-500' },
  { key: 'categories.jobs', icon: '💼', value: 'jobs', gradient: 'from-orange-500 to-amber-500' },
  { key: 'categories.services', icon: '🔧', value: 'services', gradient: 'from-pink-500 to-rose-500' },
  { key: 'categories.fashion', icon: '👗', value: 'fashion', gradient: 'from-fuchsia-500 to-pink-500' },
];

/* ── Animated Text Component ── */
function AnimatedText({ texts, className = '' }: { texts: string[]; className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsAnimating(false);
      }, 500);
    }, 3500);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span className={`inline-block transition-all duration-500 ${isAnimating ? 'translate-y-[-20px] opacity-0' : 'translate-y-0 opacity-100'} ${className}`}>
      {texts[currentIndex]}
    </span>
  );
}

/* ── Floating Element Component ── */
function FloatingElement({ 
  children, 
  className = '', 
  delay = 0,
  distance = 20 
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
  distance?: number;
}) {
  return (
    <div 
      className={`absolute animate-float ${className}`}
      style={{ 
        animationDelay: `${delay}ms`,
        '--float-distance': `${distance}px` 
      } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

/* ── Glass Card Component ── */
function GlassCard({ children, className = '', hover = true }: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-3xl 
      bg-white/10 backdrop-blur-xl 
      border border-white/20
      shadow-[0_8px_32px_rgba(0,0,0,0.1)]
      ${hover ? 'transition-all duration-500 hover:bg-white/15 hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] hover:-translate-y-1' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

/* ── Main Component ── */

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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

  // Animated text variations by locale
  const animatedTexts = locale === 'ar' 
    ? ['أسرع طريقة للبيع والشراء', 'آمنة وموثوقة 100%', 'مجانية للأبد']
    : locale === 'fr'
    ? ['Le moyen le plus rapide d\'acheter et de vendre', '100% sûr et fiable', 'Gratuit pour toujours']
    : ['The fastest way to buy & sell', '100% Safe & Trusted', 'Free Forever'];

  return (
    <section 
      ref={heroRef}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      
      {/* ═══════════════════════════════════════════════════════════════
          BACKGROUND - Gradient Mesh with Animated Orbs
         ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Main Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-teal-600 via-violet-900 to-primary" />
        
        {/* Animated Gradient Mesh Overlay */}
        <div 
          className="absolute inset-0 opacity-60 animate-gradient"
          style={{
            background: `
              radial-gradient(at 20% 30%, rgba(124, 58, 237, 0.4) 0%, transparent 50%),
              radial-gradient(at 80% 20%, rgba(20, 184, 166, 0.4) 0%, transparent 50%),
              radial-gradient(at 50% 80%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
              radial-gradient(at 10% 90%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
              radial-gradient(at 90% 80%, rgba(139, 92, 246, 0.35) 0%, transparent 50%)
            `,
            backgroundSize: '200% 200%',
          }}
        />

        {/* Floating Orbs */}
        <FloatingElement className="-start-32 -top-32 w-[500px] h-[500px] rounded-full bg-emerald-400/20 blur-[100px]" delay={0} distance={30} />
        <FloatingElement className="-end-24 top-1/4 w-[400px] h-[400px] rounded-full bg-violet-400/20 blur-[100px]" delay={1000} distance={25} />
        <FloatingElement className="-bottom-20 start-1/3 w-[350px] h-[350px] rounded-full bg-gold/20 blur-[100px]" delay={2000} distance={20} />
        <FloatingElement className="end-1/4 bottom-1/3 w-[250px] h-[250px] rounded-full bg-teal-300/20 blur-[80px]" delay={1500} distance={15} />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, white 1px, transparent 0)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Noise Texture Overlay for Depth */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FLOATING 3D ELEMENTS / SHAPES
         ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Geometric Shapes */}
        <FloatingElement className="top-[15%] start-[8%] w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 rotate-12" delay={0} distance={15}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
        </FloatingElement>
        
        <FloatingElement className="top-[25%] end-[10%] w-12 h-12 md:w-20 md:h-20 rounded-full bg-white/5 backdrop-blur-sm border border-white/10" delay={500} distance={20} />
        
        <FloatingElement className="bottom-[30%] start-[12%] w-10 h-10 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-gold/20 to-transparent backdrop-blur-sm border border-gold/20 rotate-45" delay={800} distance={12} />
        
        <FloatingElement className="bottom-[20%] end-[15%] w-14 h-14 md:w-24 md:h-24 rounded-2xl bg-violet-500/10 backdrop-blur-sm border border-violet-500/20 -rotate-12" delay={1200} distance={18} />

        {/* Decorative Lines */}
        <div className="absolute top-1/4 start-0 w-32 md:w-64 h-px bg-gradient-to-l from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-1/3 end-0 w-48 md:w-96 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        
        {/* Circle Outlines */}
        <FloatingElement className="top-[60%] start-[5%] w-20 h-20 md:w-32 md:h-32 rounded-full border border-white/10" delay={300} distance={10} />
        <FloatingElement className="top-[10%] end-[20%] w-12 h-12 md:w-20 md:h-20 rounded-full border border-dashed border-white/10" delay={700} distance={8} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT
         ═══════════════════════════════════════════════════════════════ */}
      <div className={`relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Trust Badge - Top */}
        <div className="flex justify-center mb-8">
          <GlassCard hover={false} className="px-5 py-2.5">
            <div className="flex items-center gap-3 text-white/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-sm font-medium">
                {locale === 'ar' ? 'أكبر سوق إلكتروني في المغرب وشمال إفريقيا' : locale === 'fr' ? 'Le plus grand marché en ligne au Maroc et en Afrique du Nord' : 'Largest Marketplace in Morocco & North Africa'}
              </span>
              <Sparkles className="size-4 text-gold" />
            </div>
          </GlassCard>
        </div>

        {/* Main Heading with Animated Text */}
        <h1 className="text-center mb-6">
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white tracking-tight leading-[1.1]">
            {locale === 'ar' && (
              <>
                <span className="block">ابحث، اعرض وتبادل</span>
                <span className="block mt-2 md:mt-4">
                  <span className="bg-gradient-to-l from-emerald-300 via-teal-200 to-gold bg-clip-text text-transparent animate-gradient bg-[size:200%_200%]">
                    في مكان واحد
                  </span>
                </span>
              </>
            )}
            {locale === 'fr' && (
              <>
                <span className="block">Cherchez, Vendez</span>
                <span className="block mt-2 md:mt-4">
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-gold bg-clip-text text-transparent animate-gradient bg-[size:200%_200%]">
                    Tout en un seul endroit
                  </span>
                </span>
              </>
            )}
            {locale === 'en' && (
              <>
                <span className="block">Search, Sell & Trade</span>
                <span className="block mt-2 md:mt-4">
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-gold bg-clip-text text-transparent animate-gradient bg-[size:200%_200%]">
                    All in One Place
                  </span>
                </span>
              </>
            )}
          </span>
        </h1>

        {/* Animated Subtitle */}
        <div className="h-8 md:h-10 flex justify-center mb-10">
          <p className="text-lg md:text-xl lg:text-2xl text-white/70 text-center">
            <AnimatedText texts={animatedTexts} className="font-medium text-white/90" />
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════
            SEARCH BAR - Glassmorphism Style
           ════════════════════════════════════════════════════════ */}
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="max-w-3xl mx-auto mb-6"
        >
          <div className="relative">
            {/* Glow Effect Behind Search Bar */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald/40 via-teal/40 to-violet/40 rounded-3xl blur-xl opacity-60" />
            
            {/* Search Container */}
            <div className="relative flex flex-col sm:flex-row gap-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
              
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 size-5 text-muted-foreground transition-colors ${query ? 'text-emerald' : ''}`} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('hero.search_placeholder')}
                  className={`w-full h-14 sm:h-16 ps-11 pe-4 sm:pe-36 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base sm:text-lg ${isRtl ? 'pr-11 pl-36 sm:pl-44' : ''}`}
                  aria-label={t('hero.search_placeholder')}
                />
                
                {/* Desktop Search Button */}
                <Button
                  type="submit"
                  className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 h-11 px-6 rounded-xl bg-gradient-to-r from-emerald to-teal-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hidden sm:inline-flex`}
                >
                  {t('common.search')}
                  <ArrowRight className={`${isRtl ? 'ml-2 rotate-180' : 'mr-2'} size-4`} />
                </Button>
              </div>

              {/* Mobile Search Button */}
              <Button
                type="submit"
                className="h-14 w-full sm:hidden bg-gradient-to-r from-emerald to-teal-500 text-white font-semibold text-lg rounded-t-none hover:from-emerald/90 hover:to-teal/90 transition-all duration-300"
              >
                {t('common.search')}
                <ArrowRight className={`${isRtl ? 'mr-2 rotate-180' : 'ml-2'} size-4`} />
              </Button>
            </div>
          </div>

          {/* Quick Filters - Pill Style */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-white/50 me-1 font-medium">
              {locale === 'ar' ? 'شائع:' : locale === 'fr' ? 'Populaire :' : 'Popular:'}
            </span>
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleFilterClick(filter.value)}
                className={`group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  activeFilter === filter.value
                    ? `bg-gradient-to-r ${filter.gradient} text-white shadow-lg scale-105`
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-sm border border-white/10'
                }`}
              >
                <span className="text-base">{filter.icon}</span>
                <span>{t(filter.key)}</span>
              </button>
            ))}
          </div>
        </form>

        {/* ════════════════════════════════════════════════════════
            TRUST INDICATORS
           ════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-12">
          {[
            { icon: Shield, text: locale === 'ar' ? 'آمن وموثوق' : locale === 'fr' ? 'Sûr et fiable' : 'Safe & Trusted', color: 'text-emerald-400' },
            { icon: TrendingUp, text: locale === 'ar' ? '+50,000 إعلان' : locale === 'fr' ? '+50,000 annonces' : '+50K Listings', color: 'text-gold' },
            { icon: Sparkles, text: locale === 'ar' ? 'مجاني تماماً' : locale === 'fr' ? 'Entièrement gratuit' : '100% Free', color: 'text-violet-400' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-white/70">
              <item.icon className={`size-5 ${item.color}`} />
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SCROLL INDICATOR
         ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
        <span className="text-xs font-medium">{locale === 'ar' ? 'اكتشف المزيد' : locale === 'fr' ? 'Découvrir plus' : 'Discover More'}</span>
        <ChevronDown className="size-5" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM WAVE DECORATION
         ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none" aria-hidden="true">
        <svg
          className="relative block w-full h-16 sm:h-24 lg:h-32"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            fill="currentColor"
            className="text-background"
            d="M0,64 C360,120 1080,0 1440,64 L1440,120 L0,120 Z"
          />
          <path
            fill="currentColor"
            className="text-background opacity-50"
            d="M0,80 C480,140 960,20 1440,80 L1440,120 L0,120 Z"
            style={{ transform: 'translateY(-10px)' }}
          />
        </svg>
      </div>
    </section>
  );
}
