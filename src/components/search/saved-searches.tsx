/**
 * مكون البحوث المحفوظة
 * Saved Searches Component
 * 
 * @features
 * - Save current search with custom name
 * - List saved searches
 * - Quick run saved search
 * - Delete saved searches
 * - Enable/disable notifications for saved searches
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  updateSearchLastRun,
  SavedSearch,
} from '@/lib/search-engine';

// ==================== Types ====================

interface SavedSearchesProps {
  onRunSearch?: (query: Record<string, string>) => void;
  className?: string;
}

// ==================== Icons ====================

const BookmarkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const BellIcon = ({ enabled }: { enabled: boolean }) => (
  <svg className={`w-4 h-4 ${enabled ? 'text-primary-600' : 'text-gray-400'}`} 
       fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// ==================== Component ====================

export default function SavedSearches({ onRunSearch, className = '' }: SavedSearchesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  
  // تحميل البحوث المحفوظة
  useEffect(() => {
    setSavedSearches(getSavedSearches());
  }, []);
  
  // حفظ البحث الحالي
  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    
    // بناء كائن البحث من المعاملات الحالية
    const query: Record<string, any> = {};
    
    const q = searchParams.get('q');
    if (q) query.text = q;
    
    const category = searchParams.get('category');
    if (category) query.category = category;
    
    const condition = searchParams.get('condition');
    if (condition) query.condition = condition;
    
    const location = searchParams.get('location');
    if (location) query.location = location;
    
    const minPrice = searchParams.get('min_price');
    if (minPrice) query.minPrice = parseFloat(minPrice);
    
    const maxPrice = searchParams.get('max_price');
    if (maxPrice) query.maxPrice = parseFloat(maxPrice);
    
    const sort = searchParams.get('sort');
    if (sort) query.sortBy = sort;
    
    // حفظ البحث
    saveSearch({
      name: searchName.trim(),
      query: query as any,
      notificationEnabled,
    });
    
    // تحديث القائمة
    setSavedSearches(getSavedSearches());
    
    // إغلاق الحوار وإعادة التعيين
    setShowSaveDialog(false);
    setSearchName('');
    setIsSaving(false);
  };
  
  // تشغيل بحث محفوظ
  const handleRunSearch = (search: SavedSearch) => {
    // تحديث وقت آخر تشغيل
    updateSearchLastRun(search.id);
    setSavedSearches(getSavedSearches());
    
    // بناء URL من البحث المحفوظ
    const params = new URLSearchParams();
    
    if (search.query.text) params.set('q', search.query.text);
    if (search.query.category) params.set('category', search.query.category);
    if (search.query.condition) params.set('condition', search.query.condition);
    if (search.query.location) params.set('location', search.query.location);
    if (search.query.minPrice) params.set('min_price', search.query.minPrice.toString());
    if (search.query.maxPrice) params.set('max_price', search.query.maxPrice.toString());
    if (search.query.sortBy && search.query.sortBy !== 'relevance') {
      params.set('sort', search.query.sortBy);
    }
    
    // التنقل أو الإخطار
    if (onRunSearch) {
      onRunSearch(Object.fromEntries(params.entries()));
    } else {
      router.push(`/search?${params.toString()}`);
    }
  };
  
  // حذف بحث محفوظ
  const handleDeleteSearch = (id: string) => {
    deleteSavedSearch(id);
    setSavedSearches(getSavedSearches());
  };
  
  // تبديل الإشعارات
  const toggleNotifications = (id: string) => {
    const searches = getSavedSearches();
    const search = searches.find(s => s.id === id);
    if (search) {
      search.notificationEnabled = !search.notificationEnabled;
      localStorage.setItem('mavora_saved_searches', JSON.stringify(searches));
      setSavedSearches([...searches]);
    }
  };
  
  // تنسيق تاريخ آخر تشغيل
  function formatLastRun(timestamp?: number): string {
    if (!return 'لم يُشغل بعد';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-MA');
  }
  
  // وصف البحث
  function getSearchDescription(search: SavedSearch): string {
    const parts: string[] = [];
    
    if (search.query.text) parts.push(`"${search.query.text}"`);
    if (search.query.category) parts.push(`الفئة: ${search.query.category}`);
    if (search.query.location) parts.push(`الموقع: ${search.query.location}`);
    if (search.query.minPrice || search.query.maxPrice) {
      const price = `${search.query.minPrice || '0'} - ${search.query.maxPrice || '∞'} درهم`;
      parts.push(price);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'بحث عام';
  }
  
  return (
    <div className={className}>
      {/* رأس */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookmarkIcon />
          البحوث المحفوظة
          {savedSearches.length > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-sm rounded-full">
              {savedSearches.length}
            </span>
          )}
        </h2>
        
        {/* زر حفظ البحث الحالي */}
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <PlusIcon />
          حفظ هذا البحث
        </button>
      </div>
      
      {/* قائمة البحوث المحفوظة */}
      {savedSearches.length === 0 ? (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <BookmarkIcon />
          <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد بحوث محفوظة</h3>
          <p className="mt-2 text-sm text-gray-500">
            احفظ بحثك الحالي للعودة إليه لاحقاً
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                {/* معلومات البحث */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {search.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {getSearchDescription(search)}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>أُنشئ: {new Date(search.createdAt).toLocaleDateString('ar-MA')}</span>
                    <span>آخر تشغيل: {formatLastRun(search.lastRunAt)}</span>
                  </div>
                </div>
                
                {/* أزرار الإجراءات */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* زر التشغيل */}
                  <button
                    onClick={() => handleRunSearch(search)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="تشغيل البحث"
                  >
                    <PlayIcon />
                  </button>
                  
                  {/* زر الإشعارات */}
                  <button
                    onClick={() => toggleNotifications(search.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      search.notificationEnabled 
                        ? 'text-primary-600 hover:bg-primary-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={search.notificationEnabled ? 'تعطيل الإشعارات' : 'تفعيل الإشعارات'}
                  >
                    <BellIcon enabled={search.notificationEnabled} />
                  </button>
                  
                  {/* زر الحذف */}
                  <button
                    onClick={() => handleDeleteSearch(search.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف البحث"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* حوار حفظ البحث */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            {/* عنوان الحوار */}
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              حفظ البحث الحالي
            </h3>
            
            {/* اسم البحث */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم البحث
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="مثال: آيفون مستعمل تحت 5000 درهم"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
              />
            </div>
            
            <!-- خيار الإشعارات -->
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationEnabled}
                  onChange={(e) => setNotificationEnabled(e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">إشعارني عند نتائج جديدة</span>
                  <p className="text-sm text-gray-500">
                    ستصلك إشعارات عند نشر إعلانات تطابق هذا البحث
                  </p>
                </div>
              </label>
            </div>
            
            <!-- أزرار الحوار -->
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSearchName('');
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!searchName.trim()}
                className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Hook ====================

/**
 * هوك لاستخدام البحوث المحفوظة
 */
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  
  const refresh = () => {
    setSavedSearches(getSavedSearches());
  };
  
  useEffect(() => {
    refresh();
  }, []);
  
  return {
    savedSearches,
    saveNewSearch: (name: string, query: any, notify = true) => {
      saveSearch({ name, query, notificationEnabled: notify });
      refresh();
    },
    removeSearch: (id: string) => {
      deleteSavedSearch(id);
      refresh();
    },
    refresh,
  };
}

export default SavedSearches;
