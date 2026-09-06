/**
 * مكونات التصفية المتقدمة
 * Advanced Search Filters
 * 
 * @features
 * - Price range slider
 * - Category selection
 * - Condition filter
 * - Location filter
 * - Sort options
 * - Mobile responsive with drawer
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ==================== Types ====================

interface SearchFiltersProps {
  categories?: Array<{ name: string; slug: string; count?: number }>;
  conditions?: Array<{ name: string; count?: number }>;
  locations?: Array<{ name: string; count?: number }>;
  priceRange?: { min: number; max: number };
  onFiltersChange?: (filters: FilterState) => void;
  className?: string;
  variant?: 'sidebar' | 'horizontal' | 'drawer';
}

export interface FilterState {
  category: string;
  condition: string;
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: string;
}

// ==================== Icons ====================

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ==================== Data ====================

const DEFAULT_CONDITIONS = [
  { name: 'جديد', value: 'new', icon: '✨' },
  { name: 'مستعمل - مثل الجديد', value: 'like_new', icon: '🌟' },
  { name: 'مستعمل - جيد', value: 'good', icon: '👍' },
  { name: 'مستعمل - مقبول', value: 'acceptable', icon: '👌' },
];

const SORT_OPTIONS = [
  { name: 'الأكثر صلة', value: 'relevance', icon: '🎯' },
  { name: 'السعر: من الأقل للأعلى', value: 'price_asc', icon: '📈' },
  { name: 'السعر: من الأعلى للأقل', value: 'price_desc', icon: '📉' },
  { name: 'الأحدث', value: 'date', icon: '🕐' },
  { name: 'الأعلى تقييماً', value: 'rating', icon: '⭐' },
];

// ==================== Component ====================

export default function SearchFilters({
  categories = [],
  conditions = DEFAULT_CONDITIONS,
  locations = [],
  priceRange,
  onFiltersChange,
  className = '',
  variant = 'sidebar',
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // حالة الفلاتر
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    location: searchParams.get('location') || '',
    minPrice: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : null,
    maxPrice: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : null,
    sortBy: searchParams.get('sort') || 'relevance',
  });
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    condition: true,
    location: false,
    sort: false,
  });
  
  // تحديث URL عند تغير الفلاتر
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // تحديث المعاملات
    if (filters.category) params.set('category', filters.category);
    else params.delete('category');
    
    if (filters.condition) params.set('condition', filters.condition);
    else params.delete('condition');
    
    if (filters.location) params.set('location', filters.location);
    else params.delete('location');
    
    if (filters.minPrice) params.set('min_price', filters.minPrice.toString());
    else params.delete('min_price');
    
    if (filters.maxPrice) params.set('max_price', filters.maxPrice.toString());
    else params.delete('max_price');
    
    if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort);
    else params.delete('sort');
    
    // إخطار الأب
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange, searchParams]);
  
  // تطبيق الفلاتر
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (searchParams.get('q')) params.set('q', searchParams.get('q')!);
    if (filters.category) params.set('category', filters.category);
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.location) params.set('location', filters.location);
    if (filters.minPrice) params.set('min_price', filters.minPrice.toString());
    if (filters.maxPrice) params.set('max_price', filters.maxPrice.toString());
    if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort);
    
    router.push(`/search?${params.toString()}`);
    setIsDrawerOpen(false);
  };
  
  // مسح جميع الفلاتر
  const clearAllFilters = () => {
    setFilters({
      category: '',
      condition: '',
      location: '',
      minPrice: null,
      maxPrice: null,
      sortBy: 'relevance',
    });
    
    const params = new URLSearchParams();
    if (searchParams.get('q')) params.set('q', searchParams.get('q')!);
    router.push(`/search?${params.toString()}`);
  };
  
  // تبديل قسم موسع
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  // حساب عدد الفلاتر النشطة
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.condition) count++;
    if (filters.location) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    return count;
  }, [filters]);
  
  // عرض الفلاتر الأفقية (للموبايل)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 overflow-x-auto pb-2 ${className}`}>
        {/* زر فتح الدرج */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FilterIcon />
          <span className="text-sm font-medium text-gray-700">فلتر</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        
        {/* فلتر الترتيب */}
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="flex-shrink-0 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
        
        {/* فلتر السعر */}
        <div className="flex-shrink-0 flex items-center gap-2 text-sm">
          <input
            type="number"
            placeholder="من"
            value={filters.minPrice || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              minPrice: e.target.value ? parseFloat(e.target.value) : null 
            })}
            className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg text-center focus:border-primary-500"
            dir="ltr"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="إلى"
            value={filters.maxPrice || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              maxPrice: e.target.value ? parseFloat(e.target.value) : null 
            })}
            className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg text-center focus:border-primary-500"
            dir="ltr"
          />
          <span className="text-gray-500 text-xs">درهم</span>
        </div>
        
        {/* مسح الفلاتر */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="مسح جميع الفلاتر"
          >
            <XIcon />
          </button>
        )}
        
        {/* درج الموبايل */}
        {isDrawerOpen && (
          <MobileDrawer
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            conditions={conditions}
            locations={locations}
            onClose={() => setIsDrawerOpen(false)}
            onApply={applyFilters}
            onClear={clearAllFilters}
          />
        )}
      </div>
    );
  }
  
  // عرض الشريط الجانبي (للديسكتوب)
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      {/* رأس الفلاتر */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FilterIcon />
          تصفية النتائج
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            مسح الكل ({activeFilterCount})
          </button>
        )}
      </div>
      
      {/* فلتر الفئة */}
      <FilterSection
        title="الفئة"
        isExpanded={expandedSections.category}
        onToggle={() => toggleSection('category')}
      >
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => setFilters({ ...filters, category: '' })}
              className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              جميع الفئات
            </span>
          </label>
          
          {categories.map((cat) => (
            <label key={cat.slug} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat.slug}
                  onChange={() => setFilters({ ...filters, category: cat.slug })}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {cat.name}
                </span>
              </div>
              {cat.count !== undefined && (
                <span className="text-xs text-gray-400">{cat.count}</span>
              )}
            </label>
          ))}
        </div>
      </FilterSection>
      
      {/* فلتر السعر */}
      <FilterSection
        title="السعر (درهم)"
        isExpanded={expandedSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-4">
          {/* مدخل السعر */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">من</label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  minPrice: e.target.value ? parseFloat(e.target.value) : null 
                })}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
                dir="ltr"
              />
            </div>
            <span className="text-gray-400 mt-5">—</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">إلى</label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  maxPrice: e.target.value ? parseFloat(e.target.value) : null 
                })}
                placeholder={priceRange?.max?.toString() || '∞'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
                dir="ltr"
              />
            </div>
          </div>
          
          {/* شريط التمرير المرئي */}
          {priceRange && (
            <PriceRangeSlider
              min={priceRange.min}
              max={priceRange.max}
              valueMin={filters.minPrice || priceRange.min}
              valueMax={filters.maxPrice || priceRange.max}
              onChange={(min, max) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
            />
          )}
        </div>
      </FilterSection>
      
      {/* فلتر الحالة */}
      <FilterSection
        title="الحالة"
        isExpanded={expandedSections.condition}
        onToggle={() => toggleSection('condition')}
      >
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="condition"
              checked={!filters.condition}
              onChange={() => setFilters({ ...filters, condition: '' })}
              className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              جميع الحالات
            </span>
          </label>
          
          {conditions.map((cond) => (
            <label key={cond.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="condition"
                checked={filters.condition === cond.value}
                onChange={() => setFilters({ ...filters, condition: cond.value })}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                <span className="ml-1">{cond.icon}</span>
                {cond.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
      
      {/* فلتر الموقع */}
      <FilterSection
        title="الموقع"
        isExpanded={expandedSections.location}
        onToggle={() => toggleSection('location')}
      >
        <div className="space-y-2">
          <input
            type="text"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            placeholder="ابحث عن مدينة..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
          />
          
          {locations.slice(0, 10).map((loc, idx) => (
            <label key={idx} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="location"
                  checked={filters.location === loc.name}
                  onChange={() => setFilters({ ...filters, location: loc.name })}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {loc.name}
                </span>
              </div>
              {loc.count !== undefined && (
                <span className="text-xs text-gray-400">{loc.count}</span>
              )}
            </label>
          ))}
        </div>
      </FilterSection>
      
      {/* فلتر الترتيب */}
      <FilterSection
        title="ترتيب حسب"
        isExpanded={expandedSections.sort}
        onToggle={() => toggleSection('sort')}
      >
        <div className="space-y-2">
          {SORT_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="sortBy"
                checked={filters.sortBy === option.value}
                onChange={() => setFilters({ ...filters, sortBy: option.value })}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                <span className="ml-1">{option.icon}</span>
                {option.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
      
      {/* زر التطبيق */}
      <button
        onClick={applyFilters}
        className="w-full mt-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        تطبيق الفلاتر
      </button>
    </div>
  );
}

// ==================== Sub-components ====================

/**
 * قسم قابل للطي في الفلاتر
 */
function FilterSection({
  title,
  children,
  isExpanded,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-right hover:text-primary-600 transition-colors group"
      >
        <span className="font-medium text-gray-900 group-hover:text-primary-600">
          {title}
        </span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      
      {isExpanded && (
        <div className="pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * شريط تمرير نطاق السعر
 */
function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  return (
    <div className="px-1">
      <div className="relative h-1 bg-gray-200 rounded-full">
        {/* النطاق المحدد */}
        <div
          className="absolute h-full bg-primary-500 rounded-full"
          style={{
            left: `${((valueMin - min) / (max - min)) * 100}%`,
            right: `${100 - ((valueMax - min) / (max - min)) * 100}%`,
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={valueMin}
        onChange={(e) => onChange(parseFloat(e.target.value), valueMax)}
        className="absolute w-full opacity-0 cursor-pointer"
        style={{ marginTop: '-8px' }}
      />
    </div>
  );
}

/**
 * درج الموبايل للفلاتر
 */
function MobileDrawer({
  filters,
  setFilters,
  categories,
  conditions,
  locations,
  onClose,
  onApply,
  onClear,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  categories: Array<{ name: string; slug: string; count?: number }>;
  conditions: Array<{ name: string; value: string; icon: string }>;
  locations: Array<{ name: string; count?: number }>;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <>
      {/* الخلفية */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* الدرج */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto">
        {/* رأس الدرج */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-semibold text-lg text-gray-900">تصفية النتائج</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XIcon />
          </button>
        </div>
        
        {/* محتوى الفلاتر */}
        <div className="p-5 space-y-6">
          {/* فئة */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">الفئة</h4>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">جميع الفئات</option>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          {/* الحالة */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">الحالة</h4>
            <select
              value={filters.condition}
              onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">جميع الحالات</option>
              {conditions.map(cond => (
                <option key={cond.value} value={cond.value}>{cond.icon} {cond.name}</option>
              ))}
            </select>
          </div>
          
          {/* السعر */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">السعر (درهم)</h4>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="من"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  minPrice: e.target.value ? parseFloat(e.target.value) : null 
                })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                dir="ltr"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                placeholder="إلى"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  maxPrice: e.target.value ? parseFloat(e.target.value) : null 
                })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                dir="ltr"
              />
            </div>
          </div>
          
          {/* الموقع */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">الموقع</h4>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              placeholder="المدينة..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
            
            {locations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {locations.slice(0, 6).map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFilters({ ...filters, location: loc.name })}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filters.location === loc.name
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-gray-100 text-gray-700 border border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* الترتيب */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">ترتيب حسب</h4>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* أزرار الإجراءات */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-5 flex gap-3">
          <button
            onClick={onClear}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            مسح الكل
          </button>
          <button
            onClick={onApply}
            className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            تطبيق ({filters.category || filters.condition || filters.location || filters.minPrice || filters.maxPrice ? 1 : 0})
          </button>
        </div>
      </div>
    </>
  );
}

export { FilterSection, PriceRangeSlider };
