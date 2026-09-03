'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Category, Country, City, Locale } from '@/lib/types';

// ─── Props ──────────────────────────────────────────────────────────

interface SearchBarProps {
  categories: Category[] | null;
  countries: Country[] | null;
  cities: City[] | null;
  isLoading?: boolean;
  onSearch?: (params: SearchParams) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  activeFilterCount?: number;
  compact?: boolean;
}

// ─── Types ──────────────────────────────────────────────────────────

export interface SearchParams {
  query?: string;
  category_id?: string;
  country_id?: string;
  city_id?: string;
  sort_by?: string;
  min_price?: string;
  max_price?: string;
  featured?: boolean;
  urgent?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────

function getLocalizedName(
  item: { name_ar?: string; name_fr?: string; name_en?: string },
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return item.name_ar ?? item.name_en ?? '';
    case 'fr': return item.name_fr ?? item.name_en ?? '';
    default: return item.name_en ?? '';
  }
}

// Sort options configuration
const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'filters.sort_newest' },
  { value: 'oldest', labelKey: 'filters.sort_oldest' },
  { value: 'price_asc', labelKey: 'filters.sort_price_low' },
  { value: 'price_desc', labelKey: 'filters.sort_price_high' },
] as const;

// ─── Component ──────────────────────────────────────────────────────

export default function SearchBar({
  categories,
  countries,
  cities,
  isLoading = false,
  onSearch,
  showFilters = true,
  onToggleFilters,
  activeFilterCount = 0,
  compact = false,
}: SearchBarProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Form state
  const [query, setQuery] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country_id') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city_id') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'newest');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Price range
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');

  const inputRef = useRef<HTMLInputElement>(null);

  // Filter cities based on selected country
  const filteredCities = cities?.filter((c) => c.country_id === selectedCountry) ?? [];

  // Reset city when country changes
  useEffect(() => {
    if (selectedCountry) {
      setSelectedCity('');
    }
  }, [selectedCountry]);

  // Handle search submit
  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      const params: SearchParams = {};
      
      if (query.trim()) params.query = query.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedCountry) params.country_id = selectedCountry;
      if (selectedCity) params.city_id = selectedCity;
      if (sortBy && sortBy !== 'newest') params.sort_by = sortBy;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;

      if (onSearch) {
        onSearch(params);
      } else {
        // Build URL and navigate
        const searchQueryString = new URLSearchParams();
        
        if (params.query) searchQueryString.set('search', params.query);
        if (params.category_id) searchQueryString.set('category_id', params.category_id);
        if (params.country_id) searchQueryString.set('country_id', params.country_id);
        if (params.city_id) searchQueryString.set('city_id', params.city_id);
        if (params.sort_by) searchQueryString.set('sort_by', params.sort_by);
        if (params.min_price) searchQueryString.set('min_price', params.min_price);
        if (params.max_price) searchQueryString.set('max_price', params.max_price);

        router.push(`/listings?${searchQueryString.toString()}`);
      }
    },
    [query, selectedCategory, selectedCountry, selectedCity, sortBy, minPrice, maxPrice, onSearch, router]
  );

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setQuery('');
    setSelectedCategory('');
    setSelectedCountry('');
    setSelectedCity('');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    
    if (onSearch) {
      onSearch({});
    } else {
      router.push('/listings');
    }
  }, [onSearch, router]);

  // Check if any filter is active
  const hasActiveFilters = 
    query || 
    selectedCategory || 
    selectedCountry || 
    selectedCity || 
    (sortBy && sortBy !== 'newest') ||
    minPrice || 
    maxPrice;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-full" />
        {!compact && <Skeleton className="h-10 w-full" />}
      </div>
    );
  }

  // Compact variant (for header/embedded use)
  if (compact) {
    return (
      <form onSubmit={handleSearch} className="relative w-full max-w-md">
        <Search className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('hero.search_placeholder')}
          className="h-10 pe-10 ps-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </form>
    );
  }

  // Full search bar with advanced options
  return (
    <div className="space-y-4">
      {/* Main Search Row */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('hero.search_placeholder')}
            className="h-12 pe-24 ps-12 text-base"
          />
          
          {/* Quick Actions inside input */}
          <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5 me-1" />
                {t('filters.clear_all')}
              </Button>
            )}
            
            {showFilters && onToggleFilters && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onToggleFilters}
                className="h-9 gap-1.5 bg-emerald hover:bg-emerald/90"
              >
                <SlidersHorizontal className="size-4" />
                {t('filters.title')}
                {activeFilterCount > 0 && (
                  <Badge className="ms-1 h-5 min-w-5 rounded-full bg-white px-1.5 text-[10px] font-bold text-emerald">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 px-8 bg-emerald hover:bg-emerald/90"
        >
          {t('common.search')}
        </Button>
      </form>

      {/* Advanced Options Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('filters.title')}
          <ChevronDown 
            className={`size-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
          />
        </button>

        {(selectedCategory || selectedCountry || selectedCity || sortBy !== 'newest') && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {getLocalizedName(
                  categories?.find((c) => c.id === selectedCategory) ?? {}, 
                  locale
                )}
                <button onClick={() => setSelectedCategory('')}>
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {selectedCountry && (
              <Badge variant="secondary" className="gap-1">
                {countries?.find((c) => c.id === selectedCountry)?.flag_emoji}
                {' '}
                {getLocalizedName(
                  countries?.find((c) => c.id === selectedCountry) ?? {}, 
                  locale
                )}
                <button onClick={() => setSelectedCountry('')}>
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {sortBy !== 'newest' && (
              <Badge variant="secondary" className="gap-1">
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.labelKey ? t(SORT_OPTIONS.find((o) => o.value === sortBy)!.labelKey) : sortBy}
                <button onClick={() => setSortBy('newest')}>
                  <X className="size-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Advanced Options Panel */}
      {showAdvanced && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category Select */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t('common.category')}
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('create.category_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getLocalizedName(cat, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Select */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t('common.country')}
              </label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('create.country_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag_emoji}</span>
                        <span>{getLocalizedName(country, locale)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Select */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t('common.city')}
              </label>
              <Select 
                value={selectedCity} 
                onValueChange={setSelectedCity}
                disabled={!selectedCountry}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={
                    selectedCountry 
                      ? t('create.city_placeholder')
                      : t('create.country_placeholder')
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredCities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {getLocalizedName(city, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {locale === 'ar' ? 'ترتيب حسب' : locale === 'fr' ? 'Trier par' : 'Sort by'}
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-4 pt-4 border-t border-border">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              {t('filters.price_range')}
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                placeholder={t('filters.min_price')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-9"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="number"
                min="0"
                placeholder={t('filters.max_price')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-9"
              />
              
              <Button
                type="submit"
                variant="outline"
                size="sm"
                onClick={() => handleSearch()}
                className="ms-auto"
              >
                {t('filters.apply')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export types for use in other components ───────────────────────

export type { SearchParams };
