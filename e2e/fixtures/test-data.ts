/**
 * Test Data Factories and Fixtures
 * بيانات الاختبار والمصانع
 * 
 * Provides realistic test data for:
 * - User accounts (Arabic/English)
 * - Listings with Arabic content
 * - Messages/conversations
 * - Search queries
 * - Categories
 */

import { TestUser } from '../helpers/auth-helper';

// ============================================================
// User Test Data
// ============================================================

/**
 * Valid test user credentials for login tests
 */
export const VALID_USER: TestUser = {
  email: 'testuser@mavora.test',
  password: 'TestPassword123!',
  displayName: 'مستخدم اختبار',
};

/**
 * Invalid credentials for negative testing
 */
export const INVALID_CREDENTIALS = {
  email: 'nonexistent@mavora.test',
  password: 'WrongPassword999!',
};

/**
 * Weak passwords for validation testing
 */
export const WEAK_PASSWORDS = [
  '123',           // Too short
  'password',      // No numbers/special chars
  '12345678',      // Only numbers
  'PASSWORD',      // No lowercase
  'aaaaaaaa',      // No variety
];

/**
 * Invalid emails for validation testing
 */
export const INVALID_EMAILS = [
  'notanemail',
  '@nodomain.com',
  'missing@tld',
  'spaces in@email.com',
  '',
];

// ============================================================
// Arabic User Names (for RTL testing)
// ============================================================

export const ARABIC_NAMES = [
  'أحمد محمد',
  'فاطمة الزهراء',
  'عبد الرحمن',
  'خديجة بن علي',
  'يوسف الأمين',
  'مريم الحسن',
  'إبراهيم الفاسي',
  'زينب الغربي',
  'عمر بن الخطاب',
  'عائشة الرباطية',
];

export const ARABIC_DISPLAY_NAMES = [
  'محل إلكترونيات الدار البيضاء',
  'متجر الأثاث العصري',
  'شركة التكنولوجيا المتقدمة',
  'المكتبة العربية',
  'معرض السيارات الفاخرة',
];

// ============================================================
// Listing Test Data
// ============================================================

export interface ListingTestData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  images?: string[];
}

/**
 * Sample listings with Arabic content
 */
export const ARABIC_LISTINGS: ListingTestData[] = [
  {
    title: 'iPhone 15 Pro Max - حالة ممتازة',
    description: 'أبيع هاتف iPhone 15 Pro Max اللون أزرق تيتانيوم، سعة 256 جيجابايت. الجهاز بحالة ممتازة مع جميع الإكسسوارات الأصلية. استخدمته لمدة 3 أشهر فقط. السعر قابل للتفاوض قليلاً.',
    price: 14500,
    category: 'electronics',
    condition: 'like_new',
    location: 'الدار البيضاء',
  },
  {
    title: 'شقة للكراء في قلب الرباط',
    description: 'شقة عصرية مساحتها 85 متر مربع، تتكون من 3 غرف نوم وصالون كبير ومطبخ مجهز بالكامل. تقع في حي هادئ وقريب من جميع المرافق. متاحة بدءاً من أول الشهر القادم.',
    price: 5500,
    category: 'real-estate',
    condition: 'good',
    location: 'الرباط',
  },
  {
    title: 'سيارة مرسيدس C200 موديل 2022',
    description: 'سيارة مرسيدس بنز C200 باللون الأسود، موديل 2022، عدد الكيلومترات 25000 كم. سيارة نظيفة جداً مع صيانة دورية عند الوكالة. فحص فني ساري المفعول.',
    price: 385000,
    category: 'vehicles',
    condition: 'excellent',
    location: 'الدار البيضاء',
  },
  {
    title: 'كنبة مودرن جديدة - تسليم فوري',
    description: 'كنبة مودرن 3 مقاعد + 2 كراسي، لون رمادي فاتح. جلد طبيعي عالي الجودة. لم تستخدم بعد، اشتريتها لكن لا تناسب ديكور المنزل الجديد.',
    price: 8500,
    category: 'furniture',
    condition: 'new',
    location: 'فاس',
  },
  {
    title: 'لابتوب Dell XPS 13 - مواصفات قوية',
    description: 'لابتوب Dell XPS 13، معالج Intel Core i7 الجيل 12، ذاكرة 16GB RAM، تخزين 512GB SSD. شاشة 13.4 بوصة OLED. البطارية تدوم 10 ساعات. مع العلبة الأصلية والشاحن.',
    price: 12000,
    category: 'electronics',
    condition: 'excellent',
    location: 'مراكش',
  },
];

/**
 * Listings with various price ranges for filter testing
 */
export const PRICE_RANGE_LISTINGS = [
  { ...ARABIC_LISTINGS[0], price: 100 },      // Very cheap
  { ...ARABIC_LISTINGS[1], price: 500 },       // Cheap
  { ...ARABIC_LISTINGS[2], price: 5000 },      // Mid-range
  { ...ARABIC_LISTINGS[3], price: 50000 },     // Expensive
  { ...ARABIC_LISTINGS[4], price: 500000 },    // Very expensive
];

/**
 * Create a random listing for testing
 */
export function createRandomListing(overrides?: Partial<ListingTestData>): ListingTestData {
  const baseListing = ARABIC_LISTINGS[Math.floor(Math.random() * ARABIC_LISTINGS.length)];
  
  return {
    ...baseListing,
    title: `${baseListing.title} [TEST ${Date.now()}]`,
    ...overrides,
  };
}

// ============================================================
// Search Test Data
// ============================================================

/**
 * Arabic search queries for testing search functionality
 */
export const ARABIC_SEARCH_QUERIES = [
  'سيارة',
  'شقة',
  'آيفون',
  'لابتوب',
  'كنبة',
  'إلكترونيات',
  'ملابس',
  'جوال',
  'حاسوب',
  'أثاث',
];

/**
 * Search queries with common typos/mistakes for fuzzy search testing
 */
export const TYPO_SEARCH_QUERIES = [
  { input: 'سيارة', expected: 'سيارة' },
  { input: 'موبايل', expected: 'موبيل' },
  { input: 'لابتوب', expected: 'لاب توب' },
  { input: 'تلفون', expected: 'هاتف' },
  { input: 'كمبيوتر', expected: 'حاسوب' },
];

/**
 * Arabic text normalization test cases
 */
export const NORMALIZATION_TEST_CASES = [
  { input: 'أحمد', expected: 'احمد' },      // Hamza on alif
  { input: 'إبراهيم', expected: 'ابراهيم' }, // Hamza under alif
  { input: 'آلة', expected: 'الة' },         // Madda
  { input: 'مدرسة', expected: 'مدرسه' },     // Ta marbuta
  { input: 'مصطفى', expected: 'مصطفي' },     // Alif maqsura
];

/**
 * Long search query for stress testing
 */
export const LONG_SEARCH_QUERY = 'سيارة مستعملة بحالة جيدة سعر مناسب في الدار البيضاء';

// ============================================================
// Message/Conversation Test Data
// ============================================================

export interface MessageTestData {
  content: string;
  senderId?: string;
}

/**
 * Sample messages in Arabic
 */
export const ARABIC_MESSAGES: MessageTestData[] = [
  { content: 'مرحباً، أنا مهتم بهذا الإعلان' },
  { content: 'هل المنتج لا يزال متاحاً؟' },
  { content: 'ما هو آخر سعر؟' },
  { content: 'هل يمكن المشاهدة اليوم؟' },
  { content: 'أنا من الدار البيضاء، أين يمكننا اللقاء؟' },
  { content: 'شكراً على المعلومات' },
  { content: 'سأتصل بك قريباً' },
  { content: 'هل السعر قابل للتفاوض؟' },
  { content: 'هل هناك ضمان على المنتج؟' },
  { content: 'أريد شراء هذا المنتج' },
];

/**
 * Get a random message from the test data
 */
export function getRandomMessage(): string {
  return ARABIC_MESSAGES[Math.floor(Math.random() * ARABIC_MESSAGES.length)].content;
}

/**
 * Create a conversation thread for testing
 */
export function createTestConversationThread(
  userId1: string,
  userId2: string,
  messageCount: number = 5
): MessageTestData[] {
  const messages: MessageTestData[] = [];
  
  for (let i = 0; i < messageCount; i++) {
    messages.push({
      content: ARABIC_MESSAGES[i % ARABIC_MESSAGES.length].content,
      senderId: i % 2 === 0 ? userId1 : userId2,
    });
  }
  
  return messages;
}

// ============================================================
// Category Test Data
// ============================================================

export interface CategoryTestData {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon?: string;
}

/**
 * Main categories for the marketplace
 */
export const CATEGORIES: CategoryTestData[] = [
  { id: 'elec', name: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics', icon: 'smartphone' },
  { id: 'veh', name: 'Vehicles', nameAr: 'سيارات', slug: 'vehicles', icon: 'car' },
  { id: 'realestate', name: 'Real Estate', nameAr: 'عقارات', slug: 'real-estate', icon: 'home' },
  { id: 'furn', name: 'Furniture', nameAr: 'أثاث', slug: 'furniture', icon: 'sofa' },
  { id: 'cloth', name: 'Clothing', nameAr: 'ملابس', slug: 'clothing', icon: 'shirt' },
  { id: 'books', name: 'Books', nameAr: 'كتب', slug: 'books', icon: 'book' },
  { id: 'sports', name: 'Sports', nameAr: 'رياضة', slug: 'sports', icon: 'dumbbell' },
  { id: 'jobs', name: 'Jobs', nameAr: 'وظائف', slug: 'jobs', icon: 'briefcase' },
  { id: 'services', name: 'Services', nameAr: 'خدمات', slug: 'services', icon: 'wrench' },
  { id: 'other', name: 'Other', nameAr: 'أخرى', slug: 'other', icon: 'package' },
];

/**
 * Get a random category
 */
export function getRandomCategory(): CategoryTestData {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

// ============================================================
// Location/City Test Data
// ============================================================

export const MOROCCAN_CITIES = [
  { name: 'الدار البيضاء', nameEn: 'Casablanca' },
  { name: 'الرباط', nameEn: 'Rabat' },
  { name: 'مراكش', nameEn: 'Marrakech' },
  { name: 'فاس', nameEn: 'Fes' },
  { name: 'طنجة', nameEn: 'Tangier' },
  { name: 'أغادير', nameEn: 'Agadir' },
  { name: 'مكناس', nameEn: 'Meknes' },
  { name: 'وجدة', nameEn: 'Oujda' },
  { name: 'ال kenitra', nameEn: 'Kenitra' },
  { name: 'تطوان', nameEn: 'Tetouan' },
];

/**
 * Get a random Moroccan city
 */
export function getRandomCity(): typeof MOROCCAN_CITIES[0] {
  return MOROCCAN_CITIES[Math.floor(Math.random() => MOROCCAN_CITIES.length)];
}

// ============================================================
// Payment/Test Transaction Data
// ============================================================

export interface PaymentTestData {
  amount: number;
  currency: string;
  method: 'paypal' | 'stripe' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

/**
 * Sample payment data for testing
 */
export const PAYMENT_SAMPLES: PaymentTestData[] = [
  { amount: 100, currency: 'MAD', method: 'paypal', status: 'completed' },
  { amount: 500, currency: 'MAD', method: 'paypal', status: 'pending' },
  { amount: 1000, currency: 'MAD', method: 'stripe', status: 'completed' },
  { amount: 50, currency: 'MAD', method: 'cash', status: 'completed' },
];

/**
 * Coupon codes for testing
 */
export const TEST_COUPONS = [
  { code: 'WELCOME10', discount: 10, type: 'percentage', valid: true },
  { code: 'SAVE50', discount: 50, type: 'fixed', valid: true },
  { code: 'EXPIRED20', discount: 20, type: 'percentage', valid: false },
  { code: 'INVALID', discount: 0, type: 'percentage', valid: false },
];

// ============================================================
// Image/File Test Data
// ============================================================

/**
 * Placeholder image URLs for testing uploads
 */
export const TEST_IMAGES = [
  'https://via.placeholder.com/800x600/e2e8f0/64748b?text=Test+Image+1',
  'https://via.placeholder.com/800x600/f1f5f9/475569?text=Test+Image+2',
  'https://via.placeholder.com/800x600/e2e8f0/64748b?text=Test+Image+3',
];

/**
 * Create a test image file buffer
 */
export function createTestImageFile(
  filename: string = 'test-image.jpg',
  size: number = 1024 * 100 // 100KB default
): Buffer {
  return Buffer.alloc(size, 'x');
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Generate a unique identifier for test isolation
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random item from array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Random number in range
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================
// Export all test data
// ============================================================

export const testData = {
  users: {
    VALID_USER,
    INVALID_CREDENTIALS,
    WEAK_PASSWORDS,
    INVALID_EMAILS,
    ARABIC_NAMES,
    ARABIC_DISPLAY_NAMES,
  },
  listings: {
    ARABIC_LISTINGS,
    PRICE_RANGE_LISTINGS,
    createRandomListing,
  },
  search: {
    ARABIC_SEARCH_QUERIES,
    TYPO_SEARCH_QUERIES,
    NORMALIZATION_TEST_CASES,
    LONG_SEARCH_QUERY,
  },
  messages: {
    ARABIC_MESSAGES,
    getRandomMessage,
    createTestConversationThread,
  },
  categories: {
    CATEGORIES,
    getRandomCategory,
  },
  locations: {
    MOROCCAN_CITIES,
    getRandomCity,
  },
  payments: {
    PAYMENT_SAMPLES,
    TEST_COUPONS,
  },
  images: {
    TEST_IMAGES,
    createTestImageFile,
  },
  utils: {
    generateTestId,
    delay,
    randomItem,
    randomNumber,
  },
};

export default testData;
