/**
 * شريط البحث مع الاقتراحات التلقائية
 * Search Bar with Autocomplete
 * 
 * @features
 * - Arabic text input with RTL support
 * - Debounced search suggestions
 * - Search history display
 * - Keyboard navigation
 * - Mobile responsive design
 */

'use client';

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback,
  useMemo 
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getSearchHistory, 
  saveSearchToHistory,
  SearchHistoryItem,
  SearchSuggestion,
} from '@/lib/search-engine';

// ==================== Types ====================

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  showHistory?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
  variant?: 'default' | 'compact' | 'hero';
}

interface SuggestionItem {
  text: string;
  type: 'history' | 'suggestion' | 'category';
  icon?: string;
}

// ==================== Icons ====================

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

// ==================== Component ====================

export default function SearchBar({
  placeholder = 'ابحث عن المنتجات، الخدمات...',
  autoFocus = false,
  showHistory = true,
  className = '',
  onSearch,
  variant = 'default',
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  // تحميل سجل البحث
  useEffect(() => {
    if (showHistory) {
      setHistory(getSearchHistory());
    }
  }, [showHistory]);
  
  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // جلب الاقتراحات مع debounce
  const fetchSuggestions = useCallback(async (searchText: string) => {
    if (searchText.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/search?suggestions=true&q=${encodeURIComponent(searchText)}`
      );
      const data = await response.json();
      
      const suggestionItems: SuggestionItem[] = (data.suggestions || []).map((s: any) => ({
        text: s.text,
        type: s.type === 'category' ? 'category' : 'suggestion',
        icon: s.type === 'category' ? 'folder' : 'sparkles',
      }));
      
      setSuggestions(suggestionItems);
    } catch (error) {
      console.error('خطأ في جلب الاقتراحات:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // معالجة تغيير النص
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
    
    // إلغاء الطلب السابق
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // طلب جديد بعد 300ms
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };
  
  // مسح حقل البحث
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };
  
  // تنفيذ البحث
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    // حفظ في السجل
    saveSearchToHistory({ query: searchQuery });
    setHistory(getSearchHistory());
    
    // إغلاق القائمة
    setIsOpen(false);
    setSuggestions([]);
    
    // تنفيذ البحث
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  // معالجة إرسال النموذج
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery();
  };

  const handleQuery = () => {
    handleQuery();
  };
  
  // اختيار اقتراح من لوحة المفاتيح
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allItems = [...getVisibleItems()];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allItems.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          handleSelectItem(allItems[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };
  
  // اختيار عنصر
  const handleSelectItem = (item: SuggestionItem | SearchHistoryItem) => {
    setQuery(item.text || (item as any).query);
    handleSearch(item.text || (item as any).query);
  };
  
  // الحصول على العناصر المرئية
  const getVisibleItems = (): SuggestionItem[] => {
    if (query.length < 2 && history.length > 0) {
      return history.slice(0, 5).map(h => ({
        text: h.query,
        type: 'history' as const,
        icon: 'clock',
      }));
    }
    return suggestions.slice(0, 8);
  };
  
  // العناصر المرئية
  const visibleItems = useMemo(() => getVisibleItems(), [query, suggestions, history]);
  
  // أنماط المتغيرات
  const containerStyles = {
    default: 'relative w-full max-w-2xl',
    compact: 'relative w-full max-w-md',
    hero: 'relative w-full max-w-3xl',
  };
  
  const inputStyles = {
    default: 'w-full pr-12 pl-4 py-3 text-base rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200',
    compact: 'w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition-all',
    hero: 'w-full pr-14 pl-6 py-4 lg:py-5 text-lg lg:text-xl rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:border-white/40 focus:ring-2 focus:ring-white/30 transition-all',
  };
  
  return (
    <div ref={containerRef} className={`${containerStyles[variant]} ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* أيقونة البحث */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
          ) : (
            <SearchIcon />
          )}
        </div>
        
        {/* حقل الإدخال */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`${inputStyles[variant]} dir-rtl`}
          dir="rtl"
          autoComplete="off"
          spellCheck={false}
        />
        
        {/* زر المسح */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <CloseIcon />
          </button>
        )}
      </form>
      
      {/* قائمة الاقتراحات والسجل */}
      {isOpen && visibleItems.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 dir-rtl">
          {/* سجل البحث */}
          {query.length < 2 && history.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-2">
                  <ClockIcon />
                  بحث مؤخراً
                </span>
              </div>
            </div>
          )}
          
          {/* قائمة العناصر */}
          <ul className="max-h-80 overflow-y-auto">
            {visibleItems.map((item, index) => (
              <li key={`${item.type}-${item.text}-${index}`}>
                <button
                  onClick={() => handleSelectItem(item)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-right transition-colors ${
                    index === selectedIndex 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {/* الأيقونة */}
                  <span className={`flex-shrink-0 ${
                    index === selectedIndex ? 'text-primary-600' : 'text-gray-400'
                  }`}>
                    {item.icon === 'clock' && <ClockIcon />}
                    {item.icon === 'sparkles' && <SparklesIcon />}
                    {item.icon === 'folder' && <FolderIcon />}
                  </span>
                  
                  {/* النص */}
                  <span className="flex-1 truncate">{item.text}</span>
                  
                  {/* نوع العنصر */}
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {item.type === 'history' && 'سجل'}
                    {item.type === 'suggestion' && 'اقتراح'}
                    {item.type === 'category' && 'فئة'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          
          {/* رابط لصفحة البحث الكاملة */}
          {query.length >= 2 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => handleSearch()}
                className="w-full py-2 text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                عرض جميع نتائج &quot;{query}&quot;
                <span className="mr-1">←</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Sub-components ====================

/**
 * شريط بحث مصغر للهيدر
 */
export function CompactSearchBar(props: Partial<SearchBarProps>) {
  return <SearchBar {...props} variant="compact" />;
}

/**
 * شريح بحث كبير للصفحة الرئيسية
 */
export function HeroSearchBar(props: Partial<SearchBarProps>) {
  return <SearchBar {...props} variant="hero" placeholder="ماذا تريد أن تشتري اليوم؟" />;
}
