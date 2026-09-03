'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { getCategoryIcon } from '@/lib/category-icons';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category, Locale } from '@/lib/types';

interface CategoryGridProps {
  categories: Category[] | null;
  isLoading: boolean;
  onSelectCategory: (categoryId: string) => void;
}

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

export default function CategoryGrid({
  categories,
  isLoading,
  onSelectCategory,
}: CategoryGridProps) {
  const { t, locale } = useTranslation();

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-border p-4"
            >
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-xl font-bold text-foreground sm:text-2xl">
        {t('categories.title')}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.slug);
          const name = getCategoryName(category, locale);
          const childCount = category.children?.length ?? 0;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-emerald/50 hover:shadow-lg hover:shadow-emerald/5 active:scale-[0.98] sm:p-6"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald/10 text-emerald transition-colors duration-200 group-hover:bg-emerald/15 sm:size-14">
                <Icon className="size-6 sm:size-7" />
              </div>
              <span className="text-center text-xs font-medium text-foreground sm:text-sm">
                {name}
              </span>
              {childCount > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {childCount} {locale === 'ar' ? 'تصنيف فرعي' : locale === 'fr' ? 'sous-catégories' : 'subcategories'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
