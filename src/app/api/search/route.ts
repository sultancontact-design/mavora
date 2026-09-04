/**
 * API البحث المتقدم
 * Advanced Search API Endpoint
 * 
 * @endpoint GET /api/search
 * @query q - نص البحث
 * @query category - فلتر الفئة
 * @query min_price - الحد الأدنى للسعر
 * @query max_price - الحد الأقصى للسعر
 * @query condition - حالة المنتج
 * @query location - الموقع
 * @query sort - ترتيب النتائج
 * @query page - رقم الصفحة
 * @query limit - عدد النتائج
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  normalizeArabicText,
  extractKeywords,
  calculateSearchScore,
  highlightSearchTerms,
  getSuggestions,
} from '@/lib/search-engine';

// ==================== Types ====================

interface SearchParams {
  q?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  condition?: string;
  location?: string;
  sort?: string;
  page?: string;
  limit?: string;
  suggestions?: string;
}

// ==================== Main Handler ====================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const params: SearchParams = Object.fromEntries(searchParams.entries());
    
    // طلب الاقتراحات فقط
    if (params.suggestions === 'true') {
      return await handleSuggestions(params.q || '');
    }
    
    // تنفيذ البحث الرئيسي
    return await handleSearch(params, startTime);
    
  } catch (error) {
    console.error('خطأ في البحث:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء البحث' },
      { status: 500 }
    );
  }
}

// ==================== Search Handler ====================

async function handleSearch(params: SearchParams, startTime: number) {
  // استخراج معاملات البحث
  const query = params.q || '';
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(params.limit || '20', 10)));
  const offset = (page - 1) * limit;
  
  // بناء الاستعلام الأساسي
  let dbQuery = supabase
    .from('listings')
    .select(`
      *,
      seller:seller_id(id, name, avatar, verified),
      category_data:categories(name, slug),
      images:listing_images(url, is_primary)
    `, { count: 'exact' })
    .eq('status', 'active');
  
  // تطبيق فلاتر البحث
  dbQuery = applyFilters(dbQuery, params);
  
  // جلب البيانات
  const { data: listings, count, error } = await dbQuery
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('خطأ في قاعدة البيانات:', error);
    throw error;
  }
  
  // حساب النتائج وتنقيطها
  const searchQuery = {
    text: query,
    category: params.category,
    minPrice: params.min_price ? parseFloat(params.min_price) : undefined,
    maxPrice: params.max_price ? parseFloat(params.max_price) : undefined,
    condition: params.condition,
    location: params.location,
    sortBy: (params.sort as any) || 'relevance',
  };
  
  // تنقيط وتمييز النتائج
  const results = (listings || []).map(listing => ({
    ...listing,
    score: calculateSearchScore(listing, searchQuery),
    highlightedTitle: query 
      ? highlightSearchTerms(listing.title || '', query)
      : listing.title,
    highlightedDescription: query 
      ? highlightSearchTerms((listing.description || '').substring(0, 200), query)
      : (listing.description || '').substring(0, 200),
  }));
  
  // ترتيب النتائج
  sortResults(results, params.sort as string);
  
  // جلب الفاسيت (Facets) للتصفية
  const facets = await getFacets(supabase, params);
  
  // اقتراحات التصحيح
  const allTerms = await getAllSearchableTerms(supabase);
  const suggestions = query ? getSuggestions(query, allTerms) : [];
  
  const queryTime = Date.now() - startTime;
  
  return NextResponse.json({
    results,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    facets,
    suggestions,
    queryTime,
    correctedQuery: suggestions.length > 0 ? suggestions[0] : undefined,
  });
}

// ==================== Filter Application ====================

function applyFilters(
  query: any,
  params: SearchParams
): any {
  // نص البحث - بحث نصي كامل
  if (params.q) {
    const normalizedQuery = normalizeArabicText(params.q);
    const keywords = extractKeywords(params.q);
    
    if (keywords.length > 0) {
      // استخدام البحث النصي مع دعم العربية
      query = query.or(
        keywords.map(kw => 
          `title.ilike.%${kw}%,description.ilike.%${kw}%`
        ).join(',')
      );
    }
  }
  
  // فلتر الفئة
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  
  // نطاق السعر
  if (params.min_price) {
    query = query.gte('price', parseFloat(params.min_price));
  }
  if (params.max_price) {
    query = query.lte('price', parseFloat(params.max_price));
  }
  
  // حالة المنتج
  if (params.condition && params.condition !== 'all') {
    query = query.eq('condition', params.condition);
  }
  
  // الموقع
  if (params.location) {
    const normalizedLocation = normalizeArabicText(params.location);
    query = query.ilike('location', `%${normalizedLocation}%`);
  }
  
  return query;
}

// ==================== Sorting ====================

function sortResults(results: any[], sortBy: string): void {
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price_desc':
      results.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'date':
      results.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case 'rating':
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'relevance':
    default:
      results.sort((a, b) => (b.score || 0) - (a.score || 0));
      break;
  }
}

// ==================== Facets ====================

async function getFacets(supabase: any, params: SearchParams) {
  // بناء الاستعلام الأساسي للفاسيت
  let baseQuery = supabase
    .from('listings')
    .select('category, condition, location, price')
    .eq('status', 'active');
  
  // تطبيق نفس الفلاتر (ما عدا نص البحث للحفاظ على الأداء)
  if (params.category && params.category !== 'all') {
    baseQuery = baseQuery.eq('category', params.category);
  }
  if (params.min_price) {
    baseQuery = baseQuery.gte('price', parseFloat(params.min_price));
  }
  if (params.max_price) {
    baseQuery = baseQuery.lte('price', parseFloat(params.max_price));
  }
  if (params.condition && params.condition !== 'all') {
    baseQuery = baseQuery.eq('condition', params.condition);
  }
  if (params.location) {
    baseQuery = baseQuery.ilike('location', `%${params.location}%`);
  }
  
  const { data } = await baseQuery;
  
  // حساب الفاسيت
  const categories: Record<string, number> = {};
  const conditions: Record<string, number> = {};
  const locations: Record<string, number> = {};
  let minPrice = Infinity;
  let maxPrice = 0;
  
  (data || []).forEach(item => {
    // الفئات
    if (item.category) {
      categories[item.category] = (categories[item.category] || 0) + 1;
    }
    
    // الحالات
    if (item.condition) {
      conditions[item.condition] = (conditions[item.condition] || 0) + 1;
    }
    
    // المواقع
    if (item.location) {
      locations[item.location] = (locations[item.location] || 0) + 1;
    }
    
    // نطاق السعر
    if (item.price) {
      minPrice = Math.min(minPrice, item.price);
      maxPrice = Math.max(maxPrice, item.price);
    }
  });
  
  return {
    categories: Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    conditions: Object.entries(conditions)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    locations: Object.entries(locations)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20), // أول 20 مدينة فقط
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice,
    },
  };
}

// ==================== Suggestions ====================

async function handleSuggestions(query: string) {
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }
  
  const normalizedQuery = normalizeArabicText(query);
  const keywords = extractKeywords(query);
  
  // جلب الاقتراحات من مصادر متعددة
  const [categoriesResult, listingsResult] = await Promise.all([
    // اقتراحات الفئات
    supabase
      .from('categories')
      .select('name, slug')
      .or(keywords.map(kw => `name.ilike.%${kw}%`).join(','))
      .limit(5),
    
    // اقتراحات من عناوين الإعلانات
    supabase
      .from('listings')
      .select('title')
      .eq('status', 'active')
      .or(keywords.map(kw => `title.ilike.%${kw}%`).join(','))
      .limit(8),
  ]);
  
  const suggestions: Array<{ text: string; type: string; count?: number }> = [];
  
  // إضافة اقتراحات الفئات
  (categoriesResult.data || []).forEach((cat: any) => {
    suggestions.push({
      text: cat.name,
      type: 'category',
    });
  });
  
  // إضافة اقتراحات الإعلانات
  (listingsResult.data || []).forEach((listing: any) => {
    suggestions.push({
      text: listing.title,
      type: 'listing',
    });
  });
  
  return NextResponse.json({ suggestions });
}

// ==================== Helper ====================

async function getAllSearchableTerms(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from('listings')
    .select('title')
    .eq('status', 'active')
    .limit(1000);
  
  const terms: string[] = [];
  (data || []).forEach((item: any) => {
    if (item.title) {
      terms.push(...extractKeywords(item.title));
    }
  });
  
  return [...new Set(terms)];
}

// ==================== POST for complex searches ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    switch (action) {
      case 'save_search':
        return await handleSaveSearch(params);
      
      case 'get_saved':
        return await handleGetSavedSearches(params);
      
      case 'delete_saved':
        return await handleDeleteSavedSearch(params);
      
      default:
        return NextResponse.json(
          { error: 'إجراء غير معروف' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('خطأ في طلب البحث:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في المعالجة' },
      { status: 500 }
    );
  }
}

async function handleSaveSearch(params: any) {
  // يتم حفظ البحوث محلياً من العميل
  // هذا النقطة يمكن استخدامها للمزامنة مع الخادم
  return NextResponse.json({ success: true, message: 'تم حفظ البحث' });
}

async function handleGetSavedSearches(params: any) {
  return NextResponse.json({ saved_searches: [] });
}

async function handleDeleteSavedSearch(params: any) {
  return NextResponse.json({ success: true, message: 'تم حذف البحث المحفوظ' });
}
