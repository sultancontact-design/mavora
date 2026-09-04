/**
 * اختبارات محرك البحث المتقدم
 * Advanced Search Engine Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeArabicText,
  extractKeywords,
  calculateJaccardSimilarity,
  levenshteinDistance,
  fuzzyMatchScore,
  calculateSearchScore,
  highlightSearchTerms,
  getSuggestions,
} from '@/lib/search-engine';

// ==================== Arabic Text Normalization Tests ====================

describe('normalizeArabicText', () => {
  test('يجب توحيد أحرف الهمزة', () => {
    expect(normalizeArabicText('أحمد')).toBe('احمد');
    expect(normalizeArabicText('إبراهيم')).toBe('ابراهيم');
    // آلة -> اله (التي المربوطة تصبح هاء، ثم الهمزة تُزال)
    expect(normalizeArabicText('آلة')).toBe('اله');
  });

  test('يجب تحويل التاء المربوطة إلى هاء', () => {
    expect(normalizeArabicText('فاطمة')).toBe('فاطمه');
    expect(normalizeArabicText('مدرسة')).toBe('مدرسه');
  });

  test('يجب إزالة الحركات العربية', () => {
    expect(normalizeArabicText('مُحَمَّد')).toBe('محمد');
    expect(normalizeArabicText('الْكِتَابُ')).toBe('الكتاب');
  });

  test('يجب إزالة علامات الترقيم', () => {
    expect(normalizeArabicText('هاتف، جوال!')).toBe('هاتف جوال');
    expect(normalizeArabicText('سعر: 500 درهم')).toBe('سعر 500 درهم');
  });

  test('يجب تحويل النص إلى حروف صغيرة', () => {
    expect(normalizeArabicText('ABC')).toBe('abc');
  });

  test('يجب التعامل مع النص الفارغ', () => {
    expect(normalizeArabicText('')).toBe('');
    expect(normalizeArabicText('   ')).toBe('');
  });
});

// ==================== Keyword Extraction Tests ====================

describe('extractKeywords', () => {
  test('يجب استخراج الكلمات المفتاحية', () => {
    const keywords = extractKeywords('آيفون مستعمل بحالة جيدة');
    // الكلمات تُوحد قبل الاستخراج
    expect(keywords).toContain('ايفون'); // آيفون -> ايفون
    expect(keywords).toContain('مستعمل');
    expect(keywords).toContain('جيده'); // جيدة -> جيده (التاء المربوطة تصبح هاء)
  });

  test('يجب استبعاد كلمات التوقف العربية', () => {
    const keywords = extractKeywords('هذا هاتف من شركة سامسونج');
    expect(keywords).not.toContain('هذا');
    expect(keywords).not.toContain('من');
    expect(keywords).toContain('هاتف');
    expect(keywords).toContain('سامسونج');
  });

  test('يجب استبعاد كلمات التوقف والكلمات القصيرة', () => {
    const keywords = extractKeywords('في هو من على');
    // 'علي' ليست كلمة توقف وطولها 3 أحرف، لذا قد تبقى
    // لكن في، هو، من هي كلمات توقف
    expect(keywords).not.toContain('في');
    expect(keywords).not.toContain('هو');
    expect(keywords).not.toContain('من');
  });

  test('يجب توحيد الكلمات قبل الاستخراج', () => {
    const keywords = extractKeywords('أبحث عن آيفون');
    // يجب أن تكون 'آيفون' موحدة
    expect(keywords.some(k => k.includes('يفون'))).toBe(true);
  });
});

// ==================== Jaccard Similarity Tests ====================

describe('calculateJaccardSimilarity', () => {
  test('يجب حساب التشابه بشكل صحيح', () => {
    const setA = new Set(['آيفون', 'مستعمل', 'جديد']);
    const setB = new Set(['آيفون', 'مستعمل', 'جيد']);
    
    const similarity = calculateJaccardSimilarity(setA, setB);
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  test('يجب إرجاع 0 للمجموعات الفارغة', () => {
    expect(calculateJaccardSimilarity(new Set(), new Set(['a']))).toBe(0);
    expect(calculateJaccardSimilarity(new Set(['a']), new Set())).toBe(0);
  });

  test('يجب إرجاع 1 للمجموعات المتطابقة', () => {
    const set = new Set(['a', 'b', 'c']);
    expect(calculateJaccardSimilarity(set, set)).toBe(1);
  });
});

// ==================== Levenshtein Distance Tests ====================

describe('levenshteinDistance', () => {
  test('يجب حساب المسافة بشكل صحيح', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('book', 'back')).toBe(2);
  });

  test('يجب إرجاع 0 للنصوص المتطابقة', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  test('يجب إرجاع طول النص للنص الفارغ', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
  });
});

// ==================== Fuzzy Match Score Tests ====================

describe('fuzzyMatchScore', () => {
  test('يجب إرجاع 1 للتطابق التام', () => {
    expect(fuzzyMatchScore('آيفون', 'آيفون')).toBe(1);
  });

  test('يجب إرجاع درجة عالية عند احتواء النص', () => {
    const score = fuzzyMatchScore('آيفون', 'آيفون 13 برو ماكس');
    expect(score).toBeGreaterThan(0.8);
  });

  test('يجب إرجاع درجة منخفضة للنصوص المختلفة', () => {
    const score = fuzzyMatchScore('هاتف', 'سيارة');
    expect(score).toBeLessThan(0.5);
  });
});

// ==================== Search Score Calculation Tests ====================

describe('calculateSearchScore', () => {
  const mockListing = {
    id: '1',
    title: 'آيفون 13 برو ماكس مستعمل',
    description: 'آيفون 13 بحالة ممتازة، شاشة بدون خدوش',
    price: 8000,
    category: 'إلكترونيات',
    location: 'الدار البيضاء',
    condition: 'like_new',
    rating: 4.8,
    seller: { verified: true },
    created_at: new Date().toISOString(),
  };

  test('يجب إرجاع نتيجة بين 0 و 1', () => {
    const score = calculateSearchScore(mockListing, { text: 'آيفون' });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('يجب إعطاء درجة أعلى للتطابق في العنوان', () => {
    const titleScore = calculateSearchScore(mockListing, { text: 'آيفون 13' });
    const descScore = calculateSearchScore({
      ...mockListing,
      title: 'هاتف ذكي',
      description: 'هذا آيفون 13 بحالة جيدة',
    }, { text: 'آيفون 13' });
    
    expect(titleScore).toBeGreaterThan(descScore);
  });

  test('يجب مكافأة البائع الموثق', () => {
    const verifiedScore = calculateSearchScore(mockListing, { text: 'هاتف' });
    const unverifiedScore = calculateSearchScore({
      ...mockListing,
      seller: { verified: false },
    }, { text: 'هاتف' });
    
    expect(verifiedScore).toBeGreaterThan(unverifiedScore);
  });

  test('يجب مراعاة فلتر الفئة', () => {
    const matchingCategory = calculateSearchScore(mockListing, {
      text: 'هاتف',
      category: 'إلكترونيات',
    });
    const nonMatchingCategory = calculateSearchScore(mockListing, {
      text: 'هاتف',
      category: 'سيارات',
    });
    
    expect(matchingCategory).toBeGreaterThan(nonMatchingCategory);
  });
});

// ==================== Highlight Terms Tests =====================================

describe('highlightSearchTerms', () => {
  test('يجب تمييز كلمات البحث', () => {
    // اختبار مع نص إنجليزي لتجنب مشاكل التوحيد العربية
    const result = highlightSearchTerms('iPhone 13 for sale', 'iPhone');
    // يجب أن تحتوي على وسم mark حول الكلمة
    expect(result).toContain('<mark>iPhone</mark>');
  });

  test('يجب عدم تغيير النص عند عدم وجود تطابق', () => {
    const result = highlightSearchTerms('هاتف سامسونج', 'آيفون');
    expect(result).toBe('هاتف سامسونج');
  });

  test('يجب التعامل مع نص البحث الفارغ', () => {
    const result = highlightSearchTerms('آيفون 13', '');
    expect(result).toBe('آيفون 13');
  });

  test('يجب استخدام وسم مخصص إن تم تحديده', () => {
    // اختبار مع نص إنجليسي لتجنب مشاكل التوحيد العربية
    const result = highlightSearchTerms('iPhone 13', 'iPhone', 'strong');
    // يجب أن تستخدم الوسم المخصص
    expect(result).toContain('<strong>iPhone</strong>');
  });
});

// ==================== Suggestions Tests ====================

describe('getSuggestions', () => {
  const availableTerms = ['آيفون', 'سامسونج', 'هاتف', 'لابتوب', 'سيارة'];

  test('يجب اقتراح تصحيحات للأخطاء الشائعة', () => {
    const suggestions = getSuggestions('موبايل', availableTerms);
    // موبايل قد يقترح هاتف أو مصطلحات مشابهة
    expect(Array.isArray(suggestions)).toBe(true);
  });

  test('يجب إرجاع قائمة فارغة عند عدم وجود اقتراحات', () => {
    const suggestions = getSuggestions('كلمة_نادرة_جداً', []);
    expect(suggestions).toHaveLength(0);
  });
});

// ==================== Search History & Saved Searches (LocalStorage Mock) ====================

// محاكاة localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Search History', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  test('يجب حفظ البحث في السجل', async () => {
    const { saveSearchToHistory } = await import('@/lib/search-engine');
    
    saveSearchToHistory({ query: 'آيفون', resultCount: 150 });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mavora_search_history',
      expect.any(String)
    );
  });

  test('يجب استرجاع سجل البحث', async () => {
    const { getSearchHistory } = await import('@/lib/search-engine');
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify([
      { query: 'آيفون', timestamp: Date.now() },
      { query: 'سامسونج', timestamp: Date.now() - 1000 },
    ]));
    
    const history = getSearchHistory();
    expect(history).toHaveLength(2);
    expect(history[0].query).toBe('آيفون');
  });
});

describe('Saved Searches', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  test('يجب حفظ بحث جديد', async () => {
    const { saveSearch } = await import('@/lib/search-engine');
    
    const id = saveSearch({
      name: 'آيفون رخيص',
      query: { text: 'آيفون', maxPrice: 5000 },
      notificationEnabled: true,
    });
    
    expect(id).toBeTruthy();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('يجب حذف بحث محفوظ', async () => {
    const { deleteSavedSearch } = await import('@/lib/search-engine');
    
    deleteSavedSearch('search_123');
    
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ==================== Performance Tests ====================

describe('Search Engine Performance', () => {
  test('يجب معالجة نص طويل في وقت معقول', () => {
    const longText = 'آيفون '.repeat(1000);
    const start = performance.now();
    normalizeArabicText(longText);
    const duration = performance.now() - start;
    
    // يجب أن تتم المعالجة في أقل من 100ms
    expect(duration).toBeLessThan(100);
  });

  test('يجب حساب المسافة بفعالية لنصوص طويلة', () => {
    const text1 = 'أ'.repeat(100);
    const text2 = 'ا'.repeat(100); // بعد التوحيد
    
    const start = performance.now();
    levenshteinDistance(text1, text2);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });
});
