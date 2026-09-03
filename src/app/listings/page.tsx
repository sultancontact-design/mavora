'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import ListingCard from '@/components/listing/ListingCard';
import MavoraLogo from '@/components/common/MavoraLogo';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  Plus,
  MapPin,
  ChevronDown,
  Loader2
} from 'lucide-react';
import type { Listing, Category, PaginatedResponse } from '@/lib/types';

export default function ListingsPage() {
  const { t } = useTranslation();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: sortBy,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedCategory !== 'all' && { category_id: selectedCategory }),
      });

      const res = await fetch(`/api/listings?${params}`);
      if (res.ok) {
        const data: PaginatedResponse<Listing> = await res.json();
        if (page === 1) {
          setListings(data.items || []);
        } else {
          setListings(prev => [...prev, ...(data.items || [])]);
        }
        setHasMore(data.hasNextPage || false);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, selectedCategory, sortBy]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MavoraLogo size="sm" />
              <div>
                <h1 className="text-2xl font-bold text-primary">{t('listings.browse_listings')}</h1>
                <p className="text-sm text-muted-foreground">
                  {listings.length} {t('listings.listings_found')}
                </p>
              </div>
            </div>
            
            <Link href="/listings/create">
              <Button className="gap-2 bg-emerald hover:bg-emerald/90 shadow-lg shadow-emerald/20">
                <Plus className="size-4" />
                {t('common.post_ad')}
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('hero.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 ps-10 pe-4"
              />
            </form>

            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-48 h-11">
                  <SelectValue placeholder={t('categories.all_categories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('categories.all_categories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full md:w-40 h-11">
                  <SelectValue placeholder={t('listings.sort_by')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('sort.newest')}</SelectItem>
                  <SelectItem value="price_low">{t('sort.price_low_high')}</SelectItem>
                  <SelectItem value="price_high">{t('sort.price_high_low')}</SelectItem>
                  <SelectItem value="popular">{t('sort.most_popular')}</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden md:flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && page === 1 ? (
          /* Loading Skeleton */
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length === 0 && !isLoading ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">{t('listings.no_results')}</h3>
            <p className="text-muted-foreground mb-6">{t('listings.try_different_search')}</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              {t('listings.clear_filters')}
            </Button>
          </div>
        ) : (
          <>
            {/* Listings Grid/List */}
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="gap-2 min-w-32"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                      t('common.load_more')
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
