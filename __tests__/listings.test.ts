/**
 * @description اختبارات الإعلانات والفئات
 * Listings and Categories tests
 */

import { describe, it, expect } from 'vitest';

// -------------------------------------------
// Types
// -------------------------------------------

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_id: string | null;
  user_id: string;
  condition: 'new' | 'used' | 'refurbished';
  negotiable: boolean;
  location: string;
  region: string;
  status: 'active' | 'draft' | 'sold' | 'expired' | 'paused';
  views_count: number;
  favorites_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parent_id: string | null;
  children?: Category[];
}

// -------------------------------------------
// Functions to Test
// -------------------------------------------

function validateListing(listing: Partial<Listing>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!listing.title || listing.title.trim().length < 5) {
    errors.push('العنوان مطلوب ويجب أن يكون 5 أحرف على الأقل');
  }
  
  if (listing.title && listing.title.length > 200) {
    errors.push('العنوان يجب ألا يتجاوز 200 حرف');
  }
  
  if (!listing.description || listing.description.trim().length < 20) {
    errors.push('الوصف مطلوب ويجب أن يكون 20 حرفاً على الأقل');
  }
  
  if (listing.price !== undefined && (listing.price < 0 || listing.price > 1000000)) {
    errors.push('السعر يجب أن يكون بين 0 و 1,000,000');
  }
  
  if (!listing.category_id) {
    errors.push('الفئة مطلوبة');
  }
  
  if (!['new', 'used', 'refurbished'].includes(listing.condition || '')) {
    errors.push('حالة المنتج غير صحيحة');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function formatListingTitle(title: string): string {
  return title
    .trim()
    .replace(/[^\w\s\u0600-\u06FF\-]/g, '')
    .replace(/\s+/g, ' ');
}

function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    new: 'جديد',
    used: 'مستعمل',
    refurbished: 'مجدّد',
  };
  return labels[condition] || condition;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'نشط',
    draft: 'مسودة',
    sold: 'مباع',
    expired: 'منتهي',
    paused: 'موقف مؤقتاً',
  };
  return labels[status] || status;
}

function calculateListingScore(listing: Listing): number {
  let score = 0;
  
  // Title quality (up to 25 points)
  if (listing.title.length >= 10 && listing.title.length <= 100) score += 15;
  else if (listing.title.length > 100) score += 10;
  else score += 5;
  
  // Description quality (up to 25 points)
  if (listing.description.length >= 100) score += 20;
  else if (listing.description.length >= 50) score += 15;
  else score += 10;
  
  // Images (simulated - up to 25 points)
  if (listing.is_featured) score += 25;
  else score += 15;
  
  // Price reasonableness (up to 15 points)
  if (listing.price > 0 && listing.price <= 10000) score += 15;
  else if (listing.price <= 50000) score += 10;
  else score += 5;
  
  // Engagement (up to 10 points)
  score += Math.min(10, Math.floor(listing.views_count / 50));
  
  return Math.min(100, score);
}

function filterListings(
  listings: Listing[],
  filters: {
    category_id?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    location?: string;
    status?: string;
  }
): Listing[] {
  return listings.filter(listing => {
    if (filters.category_id && listing.category_id !== filters.category_id) return false;
    if (filters.minPrice !== undefined && listing.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && listing.price > filters.maxPrice) return false;
    if (filters.condition && listing.condition !== filters.condition) return false;
    if (filters.location && !listing.location.includes(filters.location)) return false;
    if (filters.status && listing.status !== filters.status) return false;
    return true;
  });
}

function sortListings(listings: Listing[], sortBy: string): Listing[] {
  const sorted = [...listings];
  
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'popular':
      return sorted.sort((a, b) => b.favorites_count - a.favorites_count);
    case 'recent':
    default:
      return sorted.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];
  
  // Initialize map with children arrays
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });
  
  // Build tree
  categoryMap.forEach(cat => {
    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      categoryMap.get(cat.parent_id)!.children.push(cat);
    } else {
      roots.push(cat);
    }
  });
  
  return roots;
}

function getCategoryPath(category: Category, allCategories: Category[]): Category[] {
  const path: Category[] = [category];
  let current = category;
  
  while (current.parent_id) {
    const parent = allCategories.find(c => c.id === current.parent_id);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  
  return path;
}

// -------------------------------------------
// Test Suites
// -------------------------------------------

describe('🛍️ Listing Validation', () => {
  it('should validate a correct listing', () => {
    const listing = {
      title: 'iPhone 15 Pro Max بحالة ممتازة',
      description: 'جهاز iPhone 15 Pro Max اللون أزرق تيتانيوم، سعة 256 جيجابايت، يشمل جميع الإكسسوارات والعلبة الأصلية.',
      price: 14500,
      category_id: 'cat_123',
      condition: 'used' as const,
    };
    
    const result = validateListing(listing);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject listing with short title', () => {
    const result = validateListing({ title: 'اخ' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('العنوان'))).toBe(true);
  });

  it('should reject listing without description', () => {
    const result = validateListing({ 
      title: 'عنوان كافي لهذا الاختبار'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('الوصف'))).toBe(true);
  });

  it('should reject listing with invalid price', () => {
    const result = validateListing({
      title: 'عنوان صالح للاختبار',
      description: 'وصف كافٍ لهذا الاختبار الذي يجاوز العشرين حرفاً',
      price: -100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('السعر'))).toBe(true);
  });

  it('should reject listing without category', () => {
    const result = validateListing({
      title: 'عنوان صالح للاختبار',
      description: 'وصف كافٍ لهذا الاختبار الذي يجاوز العشرين حرفاً',
      price: 1000,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('الفئة'))).toBe(true);
  });

  it('should collect multiple errors', () => {
    const result = validateListing({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(2);
  });
});

describe('✏️ Listing Title Formatting', () => {
  it('should trim and normalize spaces', () => {
    expect(formatListingTitle('  Hello   World  ')).toBe('Hello World');
  });

  it('should preserve Arabic text', () => {
    expect(formatListingTitle('  هاتف   ذكي  ')).toBe('هاتف ذكي');
  });

  it('should remove special characters except hyphen', () => {
    expect(formatListingTitle('iPhone! @#$ Pro')).toBe('iPhone Pro');
  });
});

describe('🏷️ Condition & Status Labels', () => {
  it('should return Arabic label for conditions', () => {
    expect(getConditionLabel('new')).toBe('جديد');
    expect(getConditionLabel('used')).toBe('مستعمل');
    expect(getConditionLabel('refurbished')).toBe('مجدّد');
  });

  it('should return Arabic label for statuses', () => {
    expect(getStatusLabel('active')).toBe('نشط');
    expect(getStatusLabel('draft')).toBe('مسودة');
    expect(getStatusLabel('sold')).toBe('مباع');
    expect(getStatusLabel('expired')).toBe('منتهي');
  });

  it('should return original value for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('unknown');
  });
});

describe('⭐ Listing Score Calculation', () => {
  it('should calculate score for perfect listing', () => {
    const listing: Listing = {
      id: '1',
      title: 'iPhone 15 Pro Max بحالة ممتازة مع جميع الإكسسوارات',
      description: 'جهاز بحالة ممتازة، تم الشراء من الوكالة الرسمية قبل 3 أشهر، الضمان باقي، يشمل العلبة والشاحن والسماعات.',
      price: 14000,
      currency: 'MAD',
      category_id: 'cat_1',
      user_id: 'user_1',
      condition: 'used',
      negotiable: true,
      location: 'الدار البيضاء',
      region: 'Casablanca-Settat',
      status: 'active',
      views_count: 500,
      favorites_count: 50,
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const score = calculateListingScore(listing);
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should give lower score for poor listing', () => {
    const listing: Listing = {
      id: '2',
      title: 'جيد',
      description: 'منتج للبيع',
      price: 999999,
      currency: 'MAD',
      category_id: 'cat_1',
      user_id: 'user_1',
      condition: 'used',
      negotiable: false,
      location: 'الرباط',
      region: 'Rabat-Salé-Kénitra',
      status: 'active',
      views_count: 0,
      favorites_count: 0,
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const score = calculateListingScore(listing);
    expect(score).toBeLessThan(50);
  });
});

describe('🔍 Listing Filtering', () => {
  const sampleListings: Listing[] = [
    {
      id: '1',
      title: 'iPhone 15',
      description: 'هاتف جديد',
      price: 15000,
      currency: 'MAD',
      category_id: 'electronics',
      user_id: 'user_1',
      condition: 'new',
      negotiable: false,
      location: 'الدار البيضاء',
      region: 'Casablanca-Settat',
      status: 'active',
      views_count: 100,
      favorites_count: 10,
      is_featured: true,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'لابتوب مستعمل',
      description: 'لابتوب بحالة جيدة',
      price: 5000,
      currency: 'MAD',
      category_id: 'electronics',
      user_id: 'user_2',
      condition: 'used',
      negotiable: true,
      location: 'الرباط',
      region: 'Rabat-Salé-Kénitra',
      status: 'active',
      views_count: 50,
      favorites_count: 5,
      is_featured: false,
      created_at: '2025-01-14T10:00:00Z',
      updated_at: '2025-01-14T10:00:00Z',
    },
    {
      id: '3',
      title: 'شقة للكراء',
      description: 'شقة واسعة',
      price: 3000,
      currency: 'MAD',
      category_id: 'real-estate',
      user_id: 'user_3',
      condition: 'new',
      negotiable: false,
      location: 'مراكش',
      region: 'Marrakech-Safi',
      status: 'draft',
      views_count: 0,
      favorites_count: 0,
      is_featured: false,
      created_at: '2025-01-13T10:00:00Z',
      updated_at: '2025-01-13T10:00:00Z',
    },
  ];

  it('should filter by category', () => {
    const result = filterListings(sampleListings, { category_id: 'electronics' });
    expect(result).toHaveLength(2);
    expect(result.every(l => l.category_id === 'electronics')).toBe(true);
  });

  it('should filter by price range', () => {
    const result = filterListings(sampleListings, { minPrice: 4000, maxPrice: 10000 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by condition', () => {
    const result = filterListings(sampleListings, { condition: 'new' });
    expect(result).toHaveLength(2);
  });

  it('should filter by location', () => {
    const result = filterListings(sampleListings, { location: 'الدار البيضاء' });
    expect(result).toHaveLength(1);
  });

  it('should filter by status', () => {
    const result = filterListings(sampleListings, { status: 'active' });
    expect(result).toHaveLength(2);
  });

  it('should combine multiple filters', () => {
    const result = filterListings(sampleListings, { 
      category_id: 'electronics',
      status: 'active',
      condition: 'new'
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});

describe('📊 Listing Sorting', () => {
  const sampleListings: Listing[] = [
    {
      id: '1',
      title: 'أغلى منتج',
      description: 'وصف',
      price: 50000,
      currency: 'MAD',
      category_id: 'cat_1',
      user_id: 'user_1',
      condition: 'new',
      negotiable: false,
      location: 'المدينة',
      region: 'Region',
      status: 'active',
      views_count: 100,
      favorites_count: 50,
      is_featured: false,
      created_at: '2025-01-13T10:00:00Z',
      updated_at: '2025-01-13T10:00:00Z',
    },
    {
      id: '2',
      title: 'أرخص منتج',
      description: 'وصف',
      price: 100,
      currency: 'MAD',
      category_id: 'cat_1',
      user_id: 'user_1',
      condition: 'used',
      negotiable: true,
      location: 'المدينة',
      region: 'Region',
      status: 'active',
      views_count: 200,
      favorites_count: 100,
      is_featured: false,
      created_at: '2025-01-14T10:00:00Z',
      updated_at: '2025-01-14T10:00:00Z',
    },
    {
      id: '3',
      title: 'منتج متوسط',
      description: 'وصف',
      price: 5000,
      currency: 'MAD',
      category_id: 'cat_1',
      user_id: 'user_1',
      condition: 'new',
      negotiable: false,
      location: 'المدينة',
      region: 'Region',
      status: 'active',
      views_count: 50,
      favorites_count: 10,
      is_featured: false,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    },
  ];

  it('should sort by price ascending', () => {
    const result = sortListings(sampleListings, 'price_asc');
    expect(result[0].price).toBeLessThan(result[1].price);
    expect(result[1].price).toBeLessThan(result[2].price);
  });

  it('should sort by price descending', () => {
    const result = sortListings(sampleListings, 'price_desc');
    expect(result[0].price).toBeGreaterThan(result[1].price);
  });

  it('should sort by popularity (favorites)', () => {
    const result = sortListings(sampleListings, 'popular');
    expect(result[0].favorites_count).toBeGreaterThanOrEqual(result[1].favorites_count);
  });

  it('should sort by recent date by default', () => {
    const result = sortListings(sampleListings, 'recent');
    expect(result[0].created_at).toBe('2025-01-15T10:00:00Z');
  });
});

describe('📁 Category Tree Building', () => {
  const sampleCategories: Category[] = [
    { id: '1', name: 'إلكترونيات', slug: 'electronics', parent_id: null },
    { id: '2', name: 'هواتف', slug: 'phones', parent_id: '1' },
    { id: '3', name: 'حواسيب', slug: 'laptops', parent_id: '1' },
    { id: '4', name: 'عقارات', slug: 'real-estate', parent_id: null },
    { id: '5', name: 'شقق', slug: 'apartments', parent_id: '4' },
    { id: '6', name: 'آيفون', slug: 'iphone', parent_id: '2' },
  ];

  it('should build tree structure from flat list', () => {
    const tree = buildCategoryTree(sampleCategories);
    expect(tree).toHaveLength(2); // 2 root categories
    expect(tree[0].children).toHaveLength(2); // Electronics has 2 children
    expect(tree[1].children).toHaveLength(1); // Real estate has 1 child
  });

  it('should handle nested categories', () => {
    const tree = buildCategoryTree(sampleCategories);
    const electronics = tree.find(c => c.slug === 'electronics')!;
    const phones = electronics.children.find(c => c.slug === 'phones')!;
    expect(phones.children).toHaveLength(1); // iPhone under phones
  });

  it('should handle empty list', () => {
    const tree = buildCategoryTree([]);
    expect(tree).toHaveLength(0);
  });
});

describe('🛤️ Category Path', () => {
  const sampleCategories: Category[] = [
    { id: '1', name: 'إلكترونيات', slug: 'electronics', parent_id: null },
    { id: '2', name: 'هواتف', slug: 'phones', parent_id: '1' },
    { id: '6', name: 'آيفون', slug: 'iphone', parent_id: '2' },
  ];

  it('should get full path to category', () => {
    const iphone = sampleCategories.find(c => c.slug === 'iphone')!;
    const path = getCategoryPath(iphone, sampleCategories);
    expect(path).toHaveLength(3);
    expect(path[0].slug).toBe('electronics');
    expect(path[1].slug).toBe('phones');
    expect(path[2].slug).toBe('iphone');
  });

  it('should return single item for root category', () => {
    const electronics = sampleCategories.find(c => c.slug === 'electronics')!;
    const path = getCategoryPath(electronics, sampleCategories);
    expect(path).toHaveLength(1);
  });
});
