/**
 * محرك البحث المتقدم لـ مافورا
 * Advanced Search Engine with Arabic Language Support
 * 
 * @features
 * - Full-text search with Arabic stemming
 - Fuzzy matching for typos
 - Phonetic search for Arabic (أ/إ/آ normalization)
 - Search result scoring & ranking
 - Faceted search support
 */

// ==================== Types ====================

export interface SearchQuery {
  text: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date' | 'rating';
  page?: number;
  limit?: number;
}

export interface SearchResult<T = any> {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  location: string;
  condition: string;
  images: string[];
  rating: number;
  seller: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  score: number;
  highlightedTitle?: string;
  highlightedDescription?: string;
  metadata: T;
}

export interface SearchResponse<T = any> {
  results: SearchResult<T>[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: { name: count }[];
    conditions: { name: count }[];
    locations: { name: count }[];
    priceRange: { min: number; max: number };
  };
  suggestions: string[];
  queryTime: number;
  correctedQuery?: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'category' | 'location' | 'listing';
  count?: number;
  category?: string;
}

// ==================== Arabic Text Processing ====================

/**
 * أحرف عربية متكافئة للتوحيد
 */
const ARABIC_NORMALIZATION_MAP: Record<string, string> = {
  'أ': 'ا', // همزة على الألف
  'إ': 'ا', // همزة تحت الألف
  'آ': 'ا', // همزة ممدودة
  'ة': 'ه', // تاء مربوطة
  'ى': 'ي', // ألف مقصورة
  'ؤ': 'و', // همزة على الواو
  'ئ': 'ي', // همزة على الياء
};

/**
 * الحركات العربية لإزالتها
 */
const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;

/**
 * وحدات الترقيم العربية والإنجليزية
 */
const PUNCTUATION = /[^\u0621-\u063A\u0641-\u064Aa-z0-9\s]/g;

/**
 * توحيد النص العربي
 */
export function normalizeArabicText(text: string): string {
  return text
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, '') // إزالة الحركات
    .split('')
    .map(char => ARABIC_NORMALIZATION_MAP[char] || char)
    .join('')
    .replace(PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * استخراج الكلمات المفتاحية من نص البحث
 */
export function extractKeywords(text: string): string[] {
  const normalized = normalizeArabicText(text);
  
  // كلمات التوقف العربية
  const ARABIC_STOP_WORDS = new Set([
    'من', 'في', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي',
    'و', 'أو', 'أن', 'لا', 'ما', 'قد', 'لم', 'لن', 'هو', 'هي',
    'نعم', 'لا', 'بين', 'حتى', 'ثم', 'أي', 'كل', 'بعض', 'كما',
    'بعد', 'قبل', 'إلى', 'ذلك', 'تلك', 'هناك', 'حيث', 'عند',
    'لديه', 'له', 'بها', 'بهما', 'فيهما', 'منها', 'منه'
  ]);
  
  return normalized
    .split(' ')
    .filter(word => word.length > 1 && !ARABIC_STOP_WORDS.has(word));
}

/**
 * حساب تشابه جاكارد بين مجموعتين من الكلمات
 */
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * حساب مسافة ليفنشتاين للبحث الضبابي
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * حساب نسبة التشابه بناءً على مسافة ليفنشتاين
 */
export function fuzzyMatchScore(query: string, text: string): number {
  const normalizedQuery = normalizeArabicText(query);
  const normalizedText = normalizeArabicText(text);
  
  if (normalizedQuery === normalizedText) return 1;
  if (normalizedText.includes(normalizedQuery)) return 0.9;
  if (normalizedQuery.includes(normalizedText)) return 0.8;
  
  const distance = levenshteinDistance(normalizedQuery, normalizedText);
  const maxLength = Math.max(normalizedQuery.length, normalizedText.length);
  
  return 1 - (distance / maxLength);
}

// ==================== Search Scoring ====================

interface ScoringWeights {
  textRelevance: number;
  exactMatch: number;
  categoryMatch: number;
  locationMatch: number;
  priceRelevance: number;
  ratingBonus: number;
  recencyBonus: number;
  verifiedSellerBonus: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  textRelevance: 0.35,
  exactMatch: 0.20,
  categoryMatch: 0.15,
  locationMatch: 0.10,
  priceRelevance: 0.05,
  ratingBonus: 0.05,
  recencyBonus: 0.05,
  verifiedSellerBonus: 0.05,
};

/**
 * حساب نتيجة البحث
 */
export function calculateSearchScore(
  listing: any,
  query: SearchQuery,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;
  const searchText = query.text.toLowerCase();
  const normalizedSearch = normalizeArabicText(searchText);
  const listingTitle = normalizeArabicText(listing.title || '');
  const listingDesc = normalizeArabicText(listing.description || '');
  
  // 1. صلة النص (Text Relevance)
  const queryWords = extractKeywords(searchText);
  const titleWords = extractKeywords(listing.title || '');
  const descWords = extractKeywords(listing.description || '');
  
  const titleSimilarity = calculateJaccardSimilarity(
    new Set(queryWords),
    new Set(titleWords)
  );
  const descSimilarity = calculateJaccardSimilarity(
    new Set(queryWords),
    new Set(descWords)
  );
  
  score += weights.textRelevance * (titleSimilarity * 0.7 + descSimilarity * 0.3);
  
  // 2. تطابق تام (Exact Match)
  if (listingTitle.includes(normalizedSearch) || 
      (listing.title || '').toLowerCase().includes(searchText)) {
    score += weights.exactMatch;
  }
  
  // 3. تطابق الفئة
  if (query.category && listing.category === query.category) {
    score += weights.categoryMatch;
  }
  
  // 4. تطابق الموقع
  if (query.location) {
    const normalizedLocation = normalizeArabicText(query.location);
    const listingLocation = normalizeArabicText(listing.location || '');
    if (listingLocation.includes(normalizedLocation)) {
      score += weights.locationMatch;
    }
  }
  
  // 5. ملاءمة السعر
  if (query.minPrice || query.maxPrice) {
    const price = listing.price || 0;
    if ((!query.minPrice || price >= query.minPrice) &&
        (!query.maxPrice || price <= query.maxPrice)) {
      score += weights.priceRelevance;
    }
  }
  
  // 6. مكافأة التقييم
  if (listing.rating && listing.rating >= 4) {
    score += weights.ratingBonus * (listing.rating / 5);
  }
  
  // 7. مكافأة حداثة الإعلان
  if (listing.createdAt) {
    const daysSinceCreation = (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      score += weights.recencyBonus * (1 - daysSinceCreation / 7);
    }
  }
  
  // 8. مكافأة بائع موثق
  if (listing.seller?.verified) {
    score += weights.verifiedSellerBonus;
  }
  
  return Math.min(score, 1); // الحد الأقصى 1
}

// ==================== Highlighting ====================

/**
 * تمييز كلمات البحث في النص
 */
export function highlightSearchTerms(
  text: string,
  query: string,
  tag: string = 'mark'
): string {
  if (!query.trim()) return text;
  
  const words = extractKeywords(query);
  let result = text;
  
  words.forEach(word => {
    const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
    result = result.replace(regex, `<${tag}>$1</${tag}>`);
  });
  
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== Query Suggestions ====================

/**
 * تصحيح أخطاء الإملاء العربية الشائعة
 */
const ARABIC_TYPO_CORRECTIONS: Record<string, string> = {
  'موبايل': 'موبيل',
  'لابتوب': 'لاب توب',
  'كمبيوتر': 'حاسوب',
  'تلفون': 'هاتف',
  'سيارة': 'سيارة',
  'شقة': 'شقة',
  'منزل': 'دار',
};

/**
 * اقتراحات التصحيح
 */
export function getSuggestions(query: string, availableTerms: string[]): string[] {
  const corrections: string[] = [];
  const words = extractKeywords(query);
  
  words.forEach(word => {
    // التحقق من التصحيحات المعروفة
    if (ARABIC_TYPO_CORRECTIONS[word]) {
      corrections.push(ARABIC_TYPO_CORRECTIONS[word]);
    }
    
    // البحث عن كلمات مشابهة
    const similar = availableTerms.find(term => 
      fuzzyMatchScore(word, term) > 0.8 && word !== term
    );
    
    if (similar && !corrections.includes(similar)) {
      corrections.push(similar);
    }
  });
  
  return [...new Set(corrections)].slice(0, 5);
}

// ==================== Search History ====================

const SEARCH_HISTORY_KEY = 'mavora_search_history';
const MAX_HISTORY_ITEMS = 20;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

/**
 * حفظ البحث في السجل
 */
export function saveSearchToHistory(item: Omit<SearchHistoryItem, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getSearchHistory();
    const newItem: SearchHistoryItem = {
      ...item,
      timestamp: Date.now(),
    };
    
    // إزالة البحث المكرر إن وجد
    const filteredHistory = history.filter(h => h.query !== item.query);
    
    // إضافة البحث الجديد في البداية
    filteredHistory.unshift(newItem);
    
    // الاحتفاظ بعدد محدود من العناصر
    const trimmedHistory = filteredHistory.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('فشل حفظ سجل البحث:', error);
  }
}

/**
 * جلب سجل البحث
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * مسح سجل البحث
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

/**
 * حذف عنصر من سجل البحث
 */
export function removeSearchHistoryItem(query: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getSearchHistory();
  const filtered = history.filter(h => h.query !== query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
}

// ==================== Saved Searches ====================

const SAVED_SEARCHES_KEY = 'mavora_saved_searches';

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  createdAt: number;
  lastRunAt?: number;
  notificationEnabled: boolean;
}

/**
 * حفظ بحث
 */
export function saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>): string {
  if (typeof window === 'undefined') return '';
  
  const saved = getSavedSearches();
  const newSearch: SavedSearch = {
    ...search,
    id: generateId(),
    createdAt: Date.now(),
  };
  
  saved.push(newSearch);
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(saved));
  
  return newSearch.id;
}

/**
 * جلب البحوث المحفوظة
 */
export function getSavedSearches(): SavedSearch[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * حذف بحث محفوظ
 */
export function deleteSavedSearch(id: string): void {
  if (typeof window === 'undefined') return;
  
  const saved = getSavedSearches();
  const filtered = saved.filter(s => s.id !== id);
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(filtered));
}

/**
 * تحديث وقت آخر تشغيل للبحث
 */
export function updateSearchLastRun(id: string): void {
  if (typeof window === 'undefined') return;
  
  const saved = getSavedSearches();
  const search = saved.find(s => s.id === id);
  if (search) {
    search.lastRunAt = Date.now();
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(saved));
  }
}

function generateId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== Export utilities ====================

export const searchUtils = {
  normalizeArabicText,
  extractKeywords,
  calculateJaccardSimilarity,
  levenshteinDistance,
  fuzzyMatchScore,
  calculateSearchScore,
  highlightSearchTerms,
  getSuggestions,
  saveSearchToHistory,
  getSearchHistory,
  clearSearchHistory,
  removeSearchHistoryItem,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  updateSearchLastRun,
};

export default searchUtils;
