'use client';

import { useState, useMemo } from 'react';
import { 
  Car, Home, Smartphone, Briefcase, Wrench, Shirt, 
  Gamepad2, Dumbbell, BookOpen, PawPrint, Baby, Flower2,
  ArrowRight, ChevronRight, Sparkles
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/lib/types';

/* ── Category Data with Full Styling ── */
const CATEGORIES_CONFIG = [
  { 
    slug: 'vehicles', 
    icon: Car, 
    gradient: 'from-blue-500 to-cyan-400',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/30',
    emoji: '🚗',
    size: 'large' as const,
  },
  { 
    slug: 'real-estate', 
    icon: Home, 
    gradient: 'from-emerald-500 to-teal-400',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/30',
    emoji: '🏠',
    size: 'large' as const,
  },
  { 
    slug: 'electronics', 
    icon: Smartphone, 
    gradient: 'from-violet-500 to-purple-400',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/30',
    emoji: '📱',
    size: 'medium' as const,
  },
  { 
    slug: 'jobs', 
    icon: Briefcase, 
    gradient: 'from-orange-500 to-amber-400',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/30',
    emoji: '💼',
    size: 'medium' as const,
  },
  { 
    slug: 'services', 
    icon: Wrench, 
    gradient: 'from-pink-500 to-rose-400',
    bgLight: 'bg-pink-50',
    bgDark: 'dark:bg-pink-950/30',
    emoji: '🔧',
    size: 'small' as const,
  },
  { 
    slug: 'fashion', 
    icon: Shirt, 
    gradient: 'from-fuchsia-500 to-pink-400',
    bgLight: 'bg-fuchsia-50',
    bgDark: 'dark:bg-fuchsia-950/30',
    emoji: '👗',
    size: 'small' as const,
  },
  { 
    slug: 'gaming', 
    icon: Gamepad2, 
    gradient: 'from-indigo-500 to-blue-400',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/30',
    emoji: '🎮',
    size: 'small' as const,
  },
  { 
    slug: 'sports', 
    icon: Dumbbell, 
    gradient: 'from-green-500 to-emerald-400',
    bgLight: 'bg-green-50',
    bgDark: 'dark:bg-green-950/30',
    emoji: '💪',
    size: 'small' as const,
  },
  { 
    slug: 'books', 
    icon: BookOpen, 
    gradient: 'from-yellow-500 to-orange-400',
    bgLight: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-950/30',
    emoji: '📚',
    size: 'small' as const,
  },
  { 
    slug: 'pets', 
    icon: PawPrint, 
    gradient: 'from-amber-500 to-yellow-400',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/30',
    emoji: '🐾',
    size: 'small' as const,
  },
  { 
    slug: 'kids', 
    icon: Baby, 
    gradient: 'from-rose-500 to-pink-400',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/30',
    emoji: '👶',
    size: 'small' as const,
  },
  { 
    slug: 'garden', 
    icon: Flower2, 
    gradient: 'from-lime-500 to-green-400',
    bgLight: 'bg-lime-50',
    bgDark: 'dark:bg-lime-950/30',
    emoji: '🌸',
    size: 'small' as const,
  },
];

/* ── Bento Grid Card Component ── */
interface BentoCardProps {
  category: {
    id?: string;
    name_ar?: string;
    name_fr?: string;
    name_en?: string;
    slug: string;
    _count?: { listings?: number };
  } & typeof CATEGORIES_CONFIG[0];
  index: number;
  onClick: (slug: string) => void;
  isRtl: boolean;
  locale: string;
}

function BentoCard({ category, index, onClick, isRtl, locale }: BentoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = category.icon;
  
  // Get localized name
  const getName = () => {
    if (category.name_ar) {
      return locale === 'ar' ? category.name_ar : locale === 'fr' ? (category.name_fr || category.name_en || '') : (category.name_en || '');
    }
    return ''; // Will use fallback
  };

  // Size-based classes for bento layout
  const sizeClasses = {
    large: 'md:col-span-2 md:row-span-2',
    medium: 'md:col-span-1 md:row-span-1',
    small: 'col-span-1 row-span-1',
  };

  return (
    <button
      onClick={() => onClick(category.slug)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative overflow-hidden rounded-3xl
        ${sizeClasses[category.size]}
        bg-gradient-to-br ${category.gradient} p-6 md:p-8
        text-right transition-all duration-500 ease-out
        hover:shadow-2xl hover:scale-[1.02]
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50
        animate-fade-in-up
      `}
      style={{ animationDelay: `${index * 80}ms` }}
      aria-label={getName() || category.slug}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
      </div>

      {/* Glass Overlay on Hover */}
      <div className={`absolute inset-0 bg-white/0 backdrop-blur-sm transition-all duration-500 ${isHovered ? 'bg-white/10' : ''}`} />

      {/* Content Container */}
      <div className="relative h-full flex flex-col justify-between">
        {/* Top Section - Icon & Name */}
        <div>
          {/* Icon */}
          <div className={`
            inline-flex items-center justify-center
            ${category.size === 'large' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-14 h-14'}
            rounded-2xl bg-white/20 backdrop-blur-sm
            mb-4 transition-all duration-500
            group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/30
            shadow-lg
          `}>
            <span className={`${category.size === 'large' ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
              {category.emoji}
            </span>
          </div>

          {/* Category Name */}
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
            {getName() || (
              locale === 'ar' ? 'تصنيف' : locale === 'fr' ? 'Catégorie' : 'Category'
            )}
          </h3>

          {/* Description for large cards */}
          {category.size === 'large' && (
            <p className="text-white/70 text-sm md:text-base max-w-xs line-clamp-2">
              {locale === 'ar' 
                ? `اكتشف أفضل العروض في فئة ${getName()}`
                : locale === 'fr'
                  ? `Découvrez les meilleures offres dans la catégorie ${getName()}`
                  : `Discover the best deals in ${getName()}`
              }
            </p>
          )}
        </div>

        {/* Bottom Section - Count & Arrow */}
        <div className="flex items-center justify-between mt-4">
          {/* Listing Count */}
          {category._count?.listings ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-white/80" />
              <span className="text-sm font-medium text-white">
                {category._count.listings.toLocaleString(isRtl ? 'ar-SA' : 'en-US')} 
                {locale === 'ar' ? ' إعلان' : locale === 'fr' ? ' annonces' : ' listings'}
              </span>
            </div>
          ) : (
            <div className="h-8" /> /* Spacer for alignment */
          )}

          {/* Arrow Indicator */}
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full
            bg-white/20 backdrop-blur-sm
            transition-all duration-300
            ${isHovered ? 'translate-x-[-8px] bg-white/30' : ''}
          `}>
            <ChevronRight className={`w-5 h-5 text-white transition-transform ${isRtl ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className={`
        absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10 blur-2xl
        transition-all duration-500
        ${isHovered ? 'opacity-100 scale-150' : 'opacity-0 scale-100'}
      `} />
      
      {/* Corner Accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/20 to-transparent rounded-bl-3xl`} />
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
    MAIN FEATURED CATEGORIES COMPONENT
   ════════════════════════════════════════════════════════════════════ */

interface FeaturedCategoriesProps {
  categories?: Category[] | null;
  isLoading?: boolean;
  onSelectCategory: (categoryId: string) => void;
}

export default function FeaturedCategories({ 
  categories, 
  isLoading = false, 
  onSelectCategory 
}: FeaturedCategoriesProps) {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';

  // Merge API data with config
  const mergedCategories = useMemo(() => {
    if (!categories || categories.length === 0) {
      // Return default config without API data
      return CATEGORIES_CONFIG.slice(0, 8).map((cat, index) => ({
        ...cat,
        id: cat.slug,
        name_ar: t(`categories.${cat.slug}`) || undefined,
        _count: { listings: Math.floor(Math.random() * 5000) + 500 },
      }));
    }

    return categories.map((cat) => {
      const config = CATEGORIES_CONFIG.find(c => c.slug === cat.slug);
      return {
        ...cat,
        ...(config || CATEGORIES_CONFIG[0]),
      };
    });
  }, [categories, t]);

  // Loading State
  if (isLoading) {
    return (
      <section id="categories" className="py-16 sm:py-20" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="inline-block h-6 w-32 rounded-full bg-muted animate-pulse mb-4" />
            <div className="h-8 w-64 rounded-lg bg-muted animate-pulse mx-auto mb-3" />
            <div class="h-5 w-96 rounded bg-muted animate-pulse mx-auto" />
          </div>
          
          {/* Grid Skeleton - Bento Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[160px] md:auto-rows-[180px]">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className={`rounded-3xl bg-muted animate-pulse ${
                  i === 0 ? 'md:col-span-2 md:row-span-2' : ''
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="py-16 sm:py-20 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ═════════════════════ SECTION HEADER ═════════════════════ */}
        <div className="text-center mb-12">
          <Badge 
            variant="secondary" 
            className="mb-4 px-4 py-1.5 bg-gradient-to-r from-primary/10 to-violet/10 text-primary border-0 text-sm font-semibold"
          >
            <Sparkles className="ms-2 w-4 h-4" />
            {locale === 'ar' ? 'تصفح حسب الاهتمام' : locale === 'fr' ? 'Parcourir par intérêt' : 'Browse by Interest'}
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            {locale === 'ar' 
              ? 'اكتشف تصنيفاتنا المميزة'
              : locale === 'fr'
                ? 'Découvrez nos catégories en vedette'
                : 'Discover Our Featured Categories'
            }
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'اختر التصنيف الذي يناسبك واكتشف آلاف الإعلانات في مكان واحد'
              : locale === 'fr'
                ? 'Choisissez la catégorie qui vous convient et découvrez des milliers d\'annonces en un seul endroit'
                : 'Choose your category and discover thousands of listings in one place'
            }
          </p>
        </div>

        {/* ═════════════════════ BENTO GRID ═════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[140px] sm:auto-rows-[160px] md:auto-rows-[180px]">
          {mergedCategories.map((category, index) => (
            <BentoCard
              key={category.id || category.slug}
              category={category}
              index={index}
              onClick={onSelectCategory}
              isRtl={isRtl}
              locale={locale}
            />
          ))}
        </div>

        {/* ═════════════════════ VIEW ALL BUTTON ═════════════════════ */}
        <div className="text-center mt-12">
          <button
            onClick={() => window.location.hash = '#all-categories'}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-foreground text-background font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            {t('common.view_all')}
            <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  );
}

export { CATEGORIES_CONFIG, BentoCard };
