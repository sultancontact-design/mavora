'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getCategoryIcon } from '@/lib/category-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { Category, Locale } from '@/lib/types';

interface CategoryGridProps {
  categories: Category[] | null;
  isLoading: boolean;
  onSelectCategory: (categoryId: string) => void;
}

/* ── Helpers ── */

function getCategoryName(category: Category, locale: Locale): string {
  switch (locale) {
    case 'ar':
      return category.name_ar;
    case 'fr':
      return category.name_fr;
    case 'en':
    default:
      return category.name_en;
  }
}

// Simulated listing counts per category (in real app, this would come from API)
const MOCK_LISTING_COUNTS: Record<string, number> = {
  vehicles: 12500,
  'real-estate': 8900,
  electronics: 15600,
  jobs: 6700,
  services: 9200,
  fashion: 11300,
  'home-garden': 5400,
  sports: 4100,
};

/* ── Main Component ── */

export default function CategoryGrid({
  categories,
  isLoading,
  onSelectCategory,
}: CategoryGridProps) {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';

  // Memoize processed categories
  const processedCategories = useMemo(() => {
    if (!categories) return [];
    
    return categories.map((category) => ({
      ...category,
      localName: getCategoryName(category, locale),
      Icon: getCategoryIcon(category.slug),
      listingCount: MOCK_LISTING_COUNTS[category.slug] ?? Math.floor(Math.random() * 10000) + 1000,
      childCount: category.children?.length ?? 0,
    }));
  }, [categories, locale]);

  // Loading State
  if (isLoading) {
    return (
      <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Section Header Skeleton */}
        <div className="mb-10">
          <Skeleton className="mb-3 h-9 w-56" />
          <Skeleton className="h-5 w-96" />
        </div>
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border p-5 sm:p-6"
            >
              <Skeleton className="size-14 rounded-full sm:size-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty State
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      
      {/* ── Section Header ── */}
      <div className="mb-10 text-center">
        <Badge 
          variant="secondary" 
          className="mb-4 bg-emerald/10 text-emerald hover:bg-emerald/15"
        >
          {locale === 'ar' ? 'تصفح حسب الاهتمام' : locale === 'fr' ? 'Parcourir par intérêt' : 'Browse by Interest'}
        </Badge>
        <h2 className="text-h2 mb-3 text-foreground">
          {t('categories.title')}
        </h2>
        <p className="mx-auto max-w-xl text-body-sm text-muted-foreground">
          {locale === 'ar' 
            ? 'اختر التصنيف الذي يناسبك واكتشف آلاف الإعلانات' 
            : locale === 'fr' 
              ? 'Choisissez la catégorie qui vous convient et découvrez des milliers d\'annonces'
              : 'Choose your category and discover thousands of listings'}
        </p>
      </div>

      {/* ── Categories Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-5">
        {processedCategories.map((category, index) => {
          const Icon = category.Icon;
          
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-emerald/40 hover:shadow-lg hover:shadow-emerald/5 active:scale-[0.98] sm:p-6 animate-scale-in`}
              style={{ animationDelay: `${index * 50}ms` }}
              aria-label={`${category.localName} - ${category.listingCount.toLocaleString()} ${locale === 'ar' ? 'إعلان' : 'listings'}`}
            >
              
              {/* Icon Container */}
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald/10 to-emerald/5 text-emerald transition-all duration-300 group-hover:scale-110 group-hover:from-emerald/15 group-hover:to-emerald/10 group-hover:shadow-md sm:size-16">
                <Icon className="size-7 sm:size-8" strokeWidth={1.5} />
              </div>

              {/* Category Name */}
              <span className="text-center text-sm font-semibold text-foreground transition-colors group-hover:text-emerald sm:text-base">
                {category.localName}
              </span>

              {/* Listing Count */}
              <span className="text-xs text-muted-foreground">
                {category.listingCount.toLocaleString()}{' '}
                {locale === 'ar' ? 'إعلان' : locale === 'fr' ? 'annonces' : 'listings'}
              </span>

              {/* Hover Arrow Indicator */}
              <div className={`absolute ${isRtl ? 'start-3' : 'end-3'} top-3 flex size-7 items-center justify-center rounded-full bg-emerald/0 text-emerald opacity-0 transition-all duration-300 group-hover:bg-emerald/10 group-hover:opacity-100`}>
                <ArrowRight className={`size-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </div>

              {/* Subcategories Count Badge (if any) */}
              {category.childCount > 0 && (
                <div className="absolute ${isRtl ? 'left-3' : 'right-3'} bottom-3">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {category.childCount}+ {locale === 'ar' ? 'فرعي' : locale === 'fr' ? 'sous' : 'sub'}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── View All Link ── */}
      <div className="mt-10 text-center">
        <button
          onClick={() => window.location.hash = '#all-categories'}
          className="group inline-flex items-center gap-2 text-sm font-medium text-emerald transition-colors hover:text-emerald/80"
        >
          {t('common.view_all')}
          <ArrowRight className={`size-4 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
        </button>
      </div>
    </section>
  );
}
