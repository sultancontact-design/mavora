/**
 * مكون عرض نتائج البحث
 * Search Results Component
 * 
 * @features
 * - Grid/List view toggle
 * - Result cards with highlights
 * - Infinite scroll support
 * - Empty state
 * - Loading skeleton
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ==================== Types ====================

interface Listing {
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
  score?: number;
  highlightedTitle?: string;
  highlightedDescription?: string;
  created_at?: string;
}

interface SearchResultsProps {
  results: Listing[];
  total: number;
  page: number;
  totalPages: number;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

// ==================== Icons ====================

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
       fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const VerifiedBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6.267 3.455a1 1 0 011.466 0A8.003 8.003 0 0118 9a8.003 8.003 0 01-10.267 5.545 1 1 0 00-1.466 0A8.003 8.003 0 012 9a8.003 8.003 0 014.267-5.545z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M10 13a3 3 0 100-6 3 3 0 000 6zm0-2a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
    </svg>
    موثق
  </span>
);

// ==================== Helper Functions ====================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 30) return `منذ ${diffDays} يوم`;
  
  return date.toLocaleDateString('ar-MA');
}

function getPrimaryImage(images: Array<{ url: string; is_primary?: boolean }>): string {
  const primary = images.find(img => img.is_primary);
  return primary?.url || images[0]?.url || '/images/placeholder.jpg';
}

// ==================== Component ====================

export default function SearchResults({
  results,
  total,
  page,
  totalPages,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  viewMode = 'grid',
  onViewModeChange,
}: SearchResultsProps) {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [onLoadMore, hasMore, page]);
  
  // حالة فارغة
  if (!isLoading && results.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <div>
      {/* شريط الأدوات */}
      <div className="flex items-center justify-between mb-6">
        {/* عدد النتائج */}
        <p className="text-sm text-gray-600">
          عرض{' '}
          <span className="font-semibold text-gray-900">{results.length}</span>{' '}
          من{' '}
          <span className="font-semibold text-gray-900">{total}</span>{' '}
          نتيجة
          {totalPages > 1 && (
            <span className="mr-2">
              (صفحة {page} من {totalPages})
            </span>
          )}
        </p>
        
        {/* تبديل العرض */}
        {onViewModeChange && (
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="عرض شبكي"
            >
              <GridIcon />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="عرض قائمة"
            >
              <ListIcon />
            </button>
          </div>
        )}
      </div>
      
      {/* النتائج */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
          : 'space-y-4'
      }>
        {results.map((listing) =>
          viewMode === 'grid' ? (
            <GridCard key={listing.id} listing={listing} />
          ) : (
            <ListItem key={listing.id} listing={listing} />
          )
        )}
      </div>
      
      {/* تحميل المزيد */}
      {(isLoading || hasMore) && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
              <span className="text-gray-500">جاري التحميل...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              تحميل المزيد
            </button>
          )}
        </div>
      )}
      
      {/* نهاية النتائج */}
      {!hasMore && !isLoading && page > 1 && (
        <div className="py-8 text-center text-gray-500 text-sm">
          وصلت إلى نهاية النتائج
        </div>
      )}
    </div>
  );
}

// ==================== Card Components ====================

/**
 * بطاقة الشبكة
 */
function GridCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  
  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:border-primary-200">
        {/* الصورة */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <Image
            src={getPrimaryImage(listing.images)}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          
          {/* شارة الحالة */}
          {listing.condition !== 'acceptable' && (
            <span className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium rounded-full">
              {listing.condition === 'new' && '🆕 جديد'}
              {listing.condition === 'like_new' && '🌟 مثل الجديد'}
              {listing.condition === 'good' && '✓ جيد'}
            </span>
          )}
          
          {/* زر المفضلة */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: إضافة للمفضلة
            }}
            className="absolute top-3 left-3 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
        
        {/* المحتوى */}
        <div className="p-4">
          {/* السعر */}
          <div className="mb-2">
            <span className="text-xl font-bold text-primary-600 dir-rtl">
              {formatPrice(listing.price)}
            </span>
          </div>
          
          {/* العنوان مع التمييز */}
          <h3 
            className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors"
            dangerouslySetInnerHTML={{ __html: listing.highlightedTitle || listing.title }}
          />
          
          {/* الموقع والتاريخ */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <LocationIcon />
              {listing.location}
            </span>
            <span>{formatRelativeTime(listing.created_at || '')}</span>
          </div>
          
          {/* البائع */}
          {listing.seller && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden">
                  {listing.seller.avatar ? (
                    <Image
                      src={listing.seller.avatar}
                      alt={listing.seller.name}
                      width={28}
                      height={28}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      {listing.seller.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600 truncate max-w-[100px]">
                  {listing.seller.name}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {listing.seller.verified && <VerifiedBadge />}
                {listing.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <StarIcon filled />
                    {listing.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

/**
   * عنصر القائمة
   */
function ListItem({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 p-4">
        <div className="flex gap-4">
          {/* الصورة */}
          <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={getPrimaryImage(listing.images)}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="128px"
            />
          </div>
          
          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            {/* السعر والعنوان */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <span className="text-lg font-bold text-primary-600 dir-rtl">
                  {formatPrice(listing.price)}
                </span>
                <h3 
                  className="font-medium text-gray-900 line-clamp-2 mt-1 group-hover:text-primary-600 transition-colors"
                  dangerouslySetInnerHTML={{ __html: listing.highlightedTitle || listing.title }}
                />
              </div>
              
              {/* شارات */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {listing.condition === 'new' && (
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                    🆕 جديد
                  </span>
                )}
                {listing.seller?.verified && <VerifiedBadge />}
              </div>
            </div>
            
            {/* الوصف المميز */}
            <p 
              className="text-sm text-gray-600 line-clamp-2 mb-3"
              dangerouslySetInnerHTML={{ __html: listing.highlightedDescription || listing.description?.substring(0, 150) }}
            />
            
            {/* معلومات إضافية */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <LocationIcon />
                {listing.location}
              </span>
              <span>{formatRelativeTime(listing.created_at || '')}</span>
              <span className="capitalize">{listing.condition}</span>
              
              {listing.rating > 0 && (
                <span className="flex items-center gap-1">
                  <StarIcon filled />
                  {listing.rating.toFixed(1)}
                </span>
              )}
            </div>
            
            {/* البائع */}
            {listing.seller && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                  {listing.seller.avatar ? (
                    <Image
                      src={listing.seller.avatar}
                      alt={listing.seller.name}
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      {listing.seller.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600">{listing.seller.name}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

/**
 * حالة فارغة
 */
function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      {/* أيقونة */}
      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      {/* العنوان والوصف */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        لا توجد نتائج
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        لم نتمكن من العثور على نتائج تطابق بحثك. حاول تغيير الكلمات المفتاحية أو الفلاتر.
      </p>
      
      {/* اقتراحات */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">اقتراحات:</p>
        <ul className="text-sm text-gray-500 space-y-2">
          <li>• تحقق من إملاء الكلمات</li>
          <li>• جرب كلمات مفتاحية أكثر عمومية</li>
          <li>• قلل عدد الفلاتر</li>
          <li>• ابحث عن فئات مشابهة</li>
        </ul>
      </div>
    </div>
  );
}

export { GridCard, ListItem, EmptyState };
