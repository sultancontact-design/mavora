/**
 * مكون العميل لصفحة البحث
 * Search Page Client Component
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/search/search-bar';
import SearchFilters, { FilterState } from '@/components/search/search-filters';
import SearchResults from '@/components/search/search-results';

// ==================== Types ====================

interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  location: string;
  condition: string;
  images: Array<{ url: string; is_primary?: boolean }>;
  rating: number;
  seller?: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  score: number;
  highlightedTitle?: string;
  highlightedDescription?: string;
  created_at?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: Array<{ name: string; count: number }>;
    conditions: Array<{ name: string; count: number }>;
    locations: Array<{ name: string; count: number }>;
    priceRange: { min: number; max: number };
  };
  suggestions: string[];
  queryTime: number;
  correctedQuery?: string;
}

// ==================== Component ====================

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // حالة البحث
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // الفاسيت
  const [facets, setFacets] = SearchResponse['facets'] || {
    categories: [],
    conditions: [],
    locations: [],
    priceRange: { min: 0, max: 100000 },
  };
  
  // حالة التحميل الأولي
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // تنفيذ البحث
  const performSearch = useCallback(async (searchQuery: string, currentPage = 1) => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      
      // إضافة الفلاتر من URL
      const category = searchParams.get('category');
      const condition = searchParams.get('condition');
      const location = searchParams.get('location');
      const minPrice = searchParams.get('min_price');
      const maxPrice = searchParams.get('max_price');
      const sort = searchParams.get('sort');
      
      if (category) params.set('category', category);
      if (condition) params.set('condition', condition);
      if (location) params.set('location', location);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (sort) params.set('sort', sort);
      
      const response = await fetch(`/api/search?${params.toString()}`);
      const data: SearchResponse = await response.json();
      
      if (currentPage === 1) {
        setResults(data.results || []);
      } else {
        setResults(prev => [...prev, ...(data.results || [])]);
      }
      
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setFacets(data.facets || facets);
      
      // تحديث الاقتراح إن وجدت
      if (data.correctedQuery && currentPage === 1) {
        console.log('هل تقصد:', data.correctedQuery);
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [searchParams]);
  
  // البحث عند تحميل الصفحة أو تغير المعاملات
  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    
    setQuery(searchQuery);
    setPage(currentPage);
    performSearch(searchQuery, currentPage);
  }, [searchParams, performSearch]);
  
  // معالجة البحث الجديد
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', newQuery);
    params.delete('page'); // إعادة للصفحة الأولى
    
    router.push(`/search?${params.toString()}`);
  };
  
  // تحميل المزيد
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', nextPage.toString());
    
    router.push(`/search?${params.toString()}`, { scroll: false });
    performSearch(query, nextPage);
  };
  
  // تغيير الفلاتر
  const handleFiltersChange = (filters: FilterState) => {
    // يمكن استخدامه لتحديث الفلاتر دون إعادة تحميل
  };
  
  // حالة التحميل
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 dir-rtl" dir="rtl">
        {/* الهيدر */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </header>
        
        {/* المحتوى */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* الشريط الجانبي */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
            </aside>
            
            {/* النتائج */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dir-rtl" dir="rtl">
      {/* الهيدر مع شريط البحث */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <SearchBar 
            autoFocus={false}
            onSearch={handleSearch}
            className="max-w-3xl mx-auto"
          />
          
          {/* فلاتر الموبايل */}
          <div className="lg:hidden mt-4">
            <SearchFilters
              variant="horizontal"
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>
      </header>
      
      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* عنوان النتائج */}
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              نتائج البحث عن &quot;{query}&quot;
            </h1>
            {total > 0 && (
              <p className="text-gray-500 mt-1">
                وجدنا {total} نتيجة
              </p>
            )}
          </div>
        )}
        
        <div className="flex gap-8">
          {/* الشريط الجانبي - الفلاتر (ديسكتوب فقط) */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-28">
              <SearchFilters
                variant="sidebar"
                categories={facets.categories.map(c => ({ ...c, slug: c.name }))}
                conditions={facets.conditions.map(c => ({ 
                  name: c.name === 'new' ? 'جديد' : 
                        c.name === 'like_new' ? 'مستعمل - مثل الجديد' :
                        c.name === 'good' ? 'مستعمل - جيد' : 'مستعمل - مقبول',
                  value: c.name,
                  icon: ''
                }))}
                locations={facets.locations}
                priceRange={facets.priceRange}
                onFiltersChange={handleFiltersChange}
              />
              
              {/* روابط سريعة */}
              <div className="mt-6 p-4 bg-primary-50 rounded-xl">
                <h3 className="font-medium text-primary-900 mb-3">💡 نصائح البحث</h3>
                <ul className="space-y-2 text-sm text-primary-700">
                  <li>• استخدم كلمات مفتاحية دقيقة</li>
                  <li>• جرب مرادفات مختلفة</li>
                  <li>• حدد نطاق السعر</li>
                  <li>• اختر الموقع بدقة</li>
                </ul>
              </div>
            </div>
          </aside>
          
          {/* نتائج البحث */}
          <section className="flex-1 min-w-0">
            <SearchResults
              results={results}
              total={total}
              page={page}
              totalPages={totalPages}
              isLoading={isLoading}
              onLoadMore={handleLoadMore}
              hasMore={page < totalPages}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </section>
        </div>
      </main>
      
      {/* Footer بسيط */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>مافورا © {new Date().getFullYear()} - سوق المغرب الرقمي</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <a href="/about" className="hover:text-primary-600">من نحن</a>
              <a href="/help" className="hover:text-primary-600">المساعدة</a>
              <a href="/terms" className="hover:text-primary-600">الشروط والأحكام</a>
              <a href="/privacy" className="hover:text-primary-600">الخصوصية</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==================== Loading Skeleton ====================

export function SearchLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dir-rtl" dir="rtl">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="h-14 bg-gray-200 rounded-xl animate-pulse max-w-3xl mx-auto" />
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-72">
            <div className="h-[500px] bg-gray-200 rounded-xl animate-pulse" />
          </aside>
          
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
