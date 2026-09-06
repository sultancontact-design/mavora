/**
 * Mavora - Advanced Search System
 * Arabic Marketplace Platform (Morocco)
 * 
 * Comprehensive search with:
 * - Full-text search with Arabic support
 * - Multiple filter types
 * - Sorting options
 * - Faceted search
 * - Pagination
 */

// =============================================================================
// Types / الأنواع
// =============================================================================

export interface SearchQuery {
  /** Main search query string */
  q?: string;
  /** Category ID or slug */
  category?: string;
  /** Subcategory */
  subcategory?: string;
  /** Location/city */
  location?: string;
  /** Price range */
  minPrice?: number;
  maxPrice?: number;
  /** Condition: new, like_new, excellent, good, fair, poor */
  condition?: string[];
  /** Listing status */
  status?: 'active' | 'all';
  /** Seller type */
  sellerType?: 'individual' | 'business' | 'all';
  /** Has images only */
  hasImages?: boolean;
  /** Price type: fixed, negotiable, auction */
  priceType?: string[];
  /** Shipping availability */
  hasShipping?: boolean;
  /** Sort order */
  sort?: SearchSortOption;
  /** Pagination */
  page?: number;
  limit?: number;
  /** Fields to return (for performance) */
  fields?: string[];
}

export type SearchSortOption = 
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'oldest'
  | 'popular'
  | 'closest';

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  facets?: SearchFacets;
  queryTime: number; // ms
  suggestions?: string[];
}

export interface SearchFacets {
  categories: { id: string; name: string; count: number }[];
  cities: { name: string; count: number }[];
  conditions: { value: string; label: string; count: number }[];
  priceRanges: { min: number; max: number; count: number }[];
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'category' | 'listing';
  count?: number;
}

// =============================================================================
// Arabic Text Processing / معالجة النص العربي
// =============================================================================

/**
 * Normalize Arabic text for search
 */
export function normalizeArabicText(text: string): string {
  return text
    // Remove diacritics (tashkeel)
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
    // Normalize alef variants
    .replace(/[أإآا]/g, 'ا')
    // Normalize ta marbuta
    .replace(/ة/g, 'ه')
    // Normalize alef maqsura
    .replace(/ى/g, 'ي')
    // Remove non-alphanumeric chars (keep spaces)
    .replace(/[^\w\s]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Extract search terms from query
 */
export function extractSearchTerms(query: string): string[] {
  const normalized = normalizeArabicText(query);
  
  // Split into terms, filter stop words
  const stopWords = new Set([
    'من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك',
    'التي', 'الذي', 'الذين', 'التي', 'كان', 'يكون', 'لم', 'لن',
    'قد', 'بين', 'حتى', 'بعد', 'قبل', 'أو', 'و', 'ثم', 'لكن',
    'أن', 'إن', 'لا', 'ما', 'كيف', 'أين', 'متى', 'لماذا', 'كم',
    'هل', 'نعم', 'أجل', 'حول', 'دون', 'فوق', 'تحت', 'خلف',
    'أمام', 'خلال', 'بعض', 'كل', 'كلا', 'كليهما', 'جميع',
  ]);
  
  return normalized
    .split(' ')
    .filter(term => term.length > 1 && !stopWords.has(term));
}

/**
 * Generate search suggestions
 */
export function generateSuggestions(
  query: string,
  popularSearches: string[],
  categories: { name: string; slug: string }[]
): SearchSuggestion[] {
  const normalizedQuery = normalizeArabicText(query);
  const suggestions: SearchSuggestion[] = [];
  
  if (normalizedQuery.length < 2) {
    return suggestions;
  }

  // Query suggestions from popular searches
  const matchingPopular = popularSearches
    .filter(s => normalizeArabicText(s).includes(normalizedQuery))
    .slice(0, 3)
    .map(s => ({ text: s, type: 'query' as const }));
  
  suggestions.push(...matchingPopular);

  // Category suggestions
  const matchingCategories = categories
    .filter(c => normalizeArabicText(c.name).includes(normalizedQuery))
    .slice(0, 3)
    .map(c => ({ text: c.name, type: 'category' as const }));
  
  suggestions.push(...matchingCategories);

  return suggestions.slice(0, 5);
}

// =============================================================================
// Database Query Builder / بناء استعلام قاعدة البيانات
// =============================================================================

interface DBFilter {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'BETWEEN';
  value: any;
}

/**
 * Build database filters from search query
 */
export function buildSearchFilters(query: SearchQuery): DBFilter[] {
  const filters: DBFilter[] = [];

  // Category filter
  if (query.category) {
    filters.push({
      column: 'category_id',
      operator: '=',
      value: query.category,
    });
  }

  // Location filter
  if (query.location) {
    filters.push({
      column: 'city',
      operator: 'ILIKE',
      value: `%${query.location}%`,
    });
  }

  // Price range
  if (query.minPrice !== undefined) {
    filters.push({
      column: 'price',
      operator: '>=',
      value: query.minPrice,
    });
  }
  
  if (query.maxPrice !== undefined) {
    filters.push({
      column: 'price',
      operator: '<=',
      value: query.maxPrice,
    });
  }

  // Condition filter
  if (query.condition && query.condition.length > 0) {
    filters.push({
      column: 'condition',
      operator: 'IN',
      value: query.condition,
    });
  }

  // Status filter
  if (query.status === 'active') {
    filters.push({
      column: 'status',
      operator: '=',
      value: 'active',
    });
  }

  // Has images filter
  if (query.hasImages) {
    // This would need a JOIN or subquery in real implementation
    filters.push({
      column: 'has_images',
      operator: '=',
      value: true,
    });
  }

  return filters;
}

/**
 * Build ORDER BY clause from sort option
 */
export function buildSortClause(sort: SearchSortOption): string {
  switch (sort) {
    case 'price_asc':
      return 'price ASC';
    case 'price_desc':
      return 'price DESC';
    case 'newest':
      return 'created_at DESC';
    case 'oldest':
      return 'created_at ASC';
    case 'popular':
      return 'views_count DESC, favorites_count DESC';
    case 'closest':
      // Would need geolocation data
      return 'created_at DESC';
    case 'relevance':
    default:
      // For relevance, we'd use full-text search ranking
      return 'created_at DESC';
  }
}

// =============================================================================
// Search Execution / تنفيذ البحث
// =============================================================================

/**
 * Execute search (mock implementation - would connect to real DB)
 */
export async function executeSearch(
  query: SearchQuery,
  db: any // Would be your database client
): Promise<SearchResult> {
  const startTime = Date.now();
  
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100); // Max 100 per page
  const offset = (page - 1) * limit;

  // Build filters
  const filters = buildSearchFilters(query);
  const sortBy = buildSortClause(query.sort || 'relevance');

  // In a real implementation, this would be:
  // const result = await db.query(`
  //   SELECT * FROM listings
  //   WHERE ${buildWhereClause(filters)}
  //   ORDER BY ${sortBy}
  //   LIMIT ${limit} OFFSET ${offset}
  // `);
  
  // Mock result for now
  const mockResult: SearchResult = {
    items: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
    queryTime: Date.now() - startTime,
    suggestions: [],
  };

  return mockResult;
}

// =============================================================================
// URL Parameter Parsing / تحليل معاملات الرابط
// =============================================================================

/**
 * Parse search query from URLSearchParams
 */
export function parseSearchURL(params: URLSearchParams): SearchQuery {
  const query: SearchQuery = {
    q: params.get('q') || undefined,
    category: params.get('category') || undefined,
    subcategory: params.get('subcategory') || undefined,
    location: params.get('location') || undefined,
    condition: params.getAll('condition'),
    status: (params.get('status') as SearchQuery['status']) || 'active',
    sort: (params.get('sort') as SearchSortOption) || 'relevance',
    page: parseInt(params.get('page') || '1', 10),
    limit: parseInt(params.get('limit') || '20', 10),
  };

  // Parse numeric values
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  
  if (minPrice) query.minPrice = parseFloat(minPrice);
  if (maxPrice) query.maxPrice = parseFloat(maxPrice);

  // Parse booleans
  query.hasImages = params.get('hasImages') === 'true';
  query.hasShipping = params.get('hasShipping') === 'true';

  // Parse arrays
  const priceType = params.getAll('priceType');
  if (priceType.length > 0) query.priceType = priceType;

  return query;
}

/**
 * Build URL from search query
 */
export function buildSearchURL(query: SearchQuery, basePath: string = '/listings'): string {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.subcategory) params.set('subcategory', query.subcategory);
  if (query.location) params.set('location', query.location);
  if (query.minPrice) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice) params.set('maxPrice', String(query.maxPrice));
  if (query.sort && query.sort !== 'relevance') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit && query.limit !== 20) params.set('limit', String(query.limit));
  if (query.hasImages) params.set('hasImages', 'true');
  if (query.hasShipping) params.set('hasShipping', 'true');

  query.condition?.forEach(c => params.append('condition', c));
  query.priceType?.forEach(p => params.append('priceType', p));

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

// =============================================================================
// Search Result Highlighting / تمييز نتائج البحث
// =============================================================================

/**
 * Highlight search terms in text
 */
export function highlightTerms(
  text: string,
  query: string,
  options?: {
    tag?: string;
    className?: string;
  }
): string {
  const { tag = 'mark', className = 'bg-yellow-200' } = options || {};
  
  if (!query.trim()) return text;

  const terms = extractSearchTerms(query);
  let highlighted = text;

  terms.forEach(term => {
    // Create regex with global and case-insensitive flags
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    highlighted = highlighted.replace(
      regex, 
      `<${tag}${className ? ` class="${className}"` : ''}>$1</${tag}>`
    );
  });

  return highlighted;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// Popular Searches & Trends / البحثات الشائعة والاتجاهات
// =============================================================================

/**
 * Mock popular searches (would come from analytics)
 */
export const POPULAR_SEARCHES_MOROCCO = [
  'iphone 15',
  'سكن للكراء الدار البيضاء',
  'سيارة مستعملة',
  'لابتوب',
  'شقة للبيع الرباط',
  'أثاث مستعمل',
  'سامسونج galaxy',
  'وظيفة في المغرب',
  'ماك بوك برو',
  'كاميرا كانون',
];

/**
 * Get trending searches (would come from analytics)
 */
export function getTrendingSearches(): Promise<string[]> {
  // In production, this would query analytics database
  return Promise.resolve(POPULAR_SEARCHES_MOROCCO.slice(0, 5));
}

/**
 * Record search for analytics
 */
export function recordSearch(query: string, resultsCount: number): void {
  // In production, this would send to analytics
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Search] "${query}" → ${resultsCount} results`);
  }
}

// =============================================================================
// Export Default / التصدير الافتراضي
// =============================================================================

export default {
  executeSearch,
  parseSearchURL,
  buildSearchURL,
  generateSuggestions,
  highlightTerms,
  normalizeArabicText,
  extractSearchTerms,
  getTrendingSearches,
  recordSearch,
};
