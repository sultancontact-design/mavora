/**
 * Mock Data for Development/Preview Mode
 * Rich, realistic Moroccan marketplace data
 * Used when database is unavailable
 */

// ============================================================
// Types
// ============================================================

export interface MockListing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  category: { id: string; name: string; slug: string };
  images: string[];
  seller: {
    id: string;
    name: string;
    avatar: string | null;
    rating: number;
    isVerified: boolean;
  };
  status: 'active' | 'pending' | 'sold' | 'expired';
  featured: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair';
}

export interface MockCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  description: string;
  listingCount: number;
  color: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'seller' | 'user';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastLogin: string;
  listingsCount: number;
  rating: number;
  avatar?: string;
}

// ============================================================
// Categories - Moroccan Marketplace
// ============================================================

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: 'electronics', name: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics', icon: '📱', description: 'هواتف، حواسيب، إلكترونيات', listingCount: 156, color: 'from-blue-500 to-cyan-500' },
  { id: 'vehicles', name: 'Vehicles', nameAr: 'سيارات', slug: 'vehicles', icon: '🚗', description: 'سيارات، دراجات، شاحنات', listingCount: 89, color: 'from-red-500 to-orange-500' },
  { id: 'realestate', name: 'Real Estate', nameAr: 'عقارات', slug: 'realestate', icon: '🏠', description: 'شقق، فيلات، أراضي، محلات', listingCount: 67, color: 'from-green-500 to-emerald-500' },
  { id: 'furniture', name: 'Furniture', nameAr: 'أثاث', slug: 'furniture', icon: '🛋️', description: 'أثاث منزلي ومكتبي', listingCount: 45, color: 'from-amber-500 to-yellow-500' },
  { id: 'fashion', name: 'Fashion', nameAr: 'أزياء', slug: 'fashion', icon: '👗', description: 'ملابس، أحذية، إكسسوارات', listingCount: 134, color: 'from-pink-500 to-rose-500' },
  { id: 'sports', name: 'Sports', nameAr: 'رياضة', slug: 'sports', icon: '⚽', description: 'معدات رياضية، دراجات', listingCount: 78, color: 'from-green-600 to-teal-500' },
  { id: 'appliances', name: 'Appliances', nameAr: 'أجهزة منزلية', slug: 'appliances', icon: '🏠', description: 'أجهزة كهربائية منزلية', listingCount: 56, color: 'from-purple-500 to-violet-500' },
  { id: 'jobs', name: 'Jobs', nameAr: 'وظائف', slug: 'jobs', icon: '💼', description: 'وظائف في جميع المجالات', listingCount: 92, color: 'from-indigo-500 to-blue-500' },
  { id: 'services', name: 'Services', nameAr: 'خدمات', slug: 'services', icon: '🔧', description: 'خدمات مهنية ومنزلية', listingCount: 103, color: 'from-orange-500 to-amber-500' },
  { id: 'books', name: 'Books', nameAr: 'كتب', slug: 'books', icon: '📚', description: 'كتب دراسية وترفيهية', listingCount: 44, color: 'from-teal-500 to-cyan-500' },
  { id: 'pets', name: 'Pets', nameAr: 'حيوانات أليفة', slug: 'pets', icon: '🐾', description: 'حيوانات أليفة ومستلزماتها', listingCount: 34, color: 'from-lime-500 to-green-500' },
  { id: 'kids', name: 'Kids & Babies', nameAr: 'أطفال ورضع', slug: 'kids', icon: '👶', description: 'ملابس وألعاب أطفال', listingCount: 67, color: 'from-pink-400 to-red-400' },
];

// ============================================================
// Listings - Realistic Moroccan Ads
// ============================================================

export const MOCK_LISTINGS: MockListing[] = [
  {
    id: 'listing-001',
    title: 'iPhone 15 Pro Max 256GB - جديد في الصندوق',
    description: 'آيفون 15 برو ماكس 256GB لون تيتانيوم طبيعي - ضمان سنة كاملة من Apple. الجهاز جديد لم يستخدم قط، مع كل الملحقات الأصلية. شراء من المغرب مع فاتورة.',
    price: 15000,
    currency: 'MAD',
    location: 'الدار البيضاء',
    category: MOCK_CATEGORIES[0],
    images: [
      'https://placehold.co/600x400/1a1a2e/fff?text=iPhone+15+Pro+Max',
      'https://placehold.co/600x400/16213e/fff?text=iPhone+Box',
      'https://placehold.co/600x400/0f3460/fff?text=iPhone+Side'
    ],
    seller: { id: 'seller-001', name: 'أحمد محمد', avatar: null, rating: 4.8, isVerified: true },
    status: 'active',
    featured: true,
    views: 1245,
    createdAt: '2024-01-18T10:30:00Z',
    updatedAt: '2024-01-20T14:20:00Z',
    condition: 'new'
  },
  {
    id: 'listing-002',
    title: 'شقة فاخرة 120م² للإيجار في قلب الدار البيضاء',
    description: 'شقة فاخرة في الطابق السادس مع مصعد، إطلالة بحرية رائعة. 3 غرف نوم، 2 حمام، صالون واسع، مطبخ مجهز بالكامل. قريبة من جميع الخدمات والمتاجر والنقل.',
    price: 5000,
    currency: 'MAD',
    location: 'الدار البيضاء',
    category: MOCK_CATEGORIES[2],
    images: [
      'https://placehold.co/600x400/16213e/fff?text=Apartment+Living+Room',
      'https://placehold.co/600x400/1a1a2e/fff?text=Kitchen+View',
      'https://placehold.co/600x400/0f3460/fff?text=Sea+View+Balcony'
    ],
    seller: { id: 'seller-002', name: 'فاطمة الزهراء', avatar: null, rating: 4.9, isVerified: true },
    status: 'active',
    featured: true,
    views: 890,
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-19T16:45:00Z'
  },
  {
    id: 'listing-003',
    title: 'تويوتا كامري هايبريد 2023 - 20,000 كم فقط',
    description: 'تويوتا كامري هايبريد 2023 لون أبيض - حالة ممتازة. 20,000 كم فقط! ضمان الوكالة ساري. موتر نظيف، كاميرا خلفية، شاشة touch، مقاعد جلد.',
    price: 280000,
    currency: 'MAD',
    location: 'الرباط',
    category: MOCK_CATEGORIES[1],
    images: [
      'https://placehold.co/600x400/e94560/fff?text=Toyota+Camry+Front',
      'https://placehold.co/600x400/1a1a2e/fff?text=Camry+Interior',
      'https://placehold.co/600x400/16213e/fff?text=Camry+Engine'
    ],
    seller: { id: 'seller-003', name: 'محمد الأمين', avatar: null, rating: 4.7, isVerified: true },
    status: 'active',
    featured: true,
    views: 2340,
    createdAt: '2024-01-19T11:00:00Z',
    updatedAt: '2024-01-20T09:30:00Z',
    condition: 'like_new'
  },
  {
    id: 'listing-004',
    title: 'كنبة إيطالية مودرن 3 مقاعد - جلد طبيعي',
    description: 'كنبة إيطالية أصلية من ماركة عالمية. جلد طبيعي فاخر، هيكل خشب صلب. اشتريتها قبل شهرين فقط وبيعت لأنني مسافر. السعر أقل من النصف!',
    price: 3500,
    currency: 'MAD',
    location: 'مراكش',
    category: MOCK_CATEGORIES[3],
    images: [
      'https://placehold.co/600x400/533483/fff?text=Italian+Sofa',
      'https://placehold.co/600x400/3d3d3d/fff?text=Sofa+Detail'
    ],
    seller: { id: 'seller-004', name: 'سعيد المنصوري', avatar: null, rating: 4.5, isVerified: false },
    status: 'active',
    featured: true,
    views: 567,
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-18T11:10:00Z',
    condition: 'like_new'
  },
  {
    id: 'listing-005',
    title: 'لابتوب Dell XPS 15 OLED Touch - i7 32GB 1TB',
    description: 'Dell XPS 9530 أحدث إصدار. شاشة OLED 3.5K touch. معالج Intel Core i7 الجيل 13. ذاكرة 32GB DDR5. تخزين 1TB SSD. كارت شاشة RTX 4060. ضمان Dell حتى 2027.',
    price: 12000,
    currency: 'MAD',
    location: 'فاس',
    category: MOCK_CATEGORIES[0],
    images: [
      'https://placehold.co/600x400/1a1a2e/fff?text=Dell+XPS+15+Open',
      'https://placehold.co/600x400/16213e/fff?text=XPS+Specs+Screen'
    ],
    seller: { id: 'seller-001', name: 'أحمد محمد', avatar: null, rating: 4.8, isVerified: true },
    status: 'active',
    featured: true,
    views: 1678,
    createdAt: '2024-01-15T08:45:00Z',
    updatedAt: '2024-01-19T15:30:00Z',
    condition: 'new'
  },
  {
    'id': 'listing-006',
    'title': 'دراجة هوائية جبلية Trek Marlin 7 2024 - جديدة',
    'description': 'Trek Marlin 7 2024 إطار M (للطول 165-175سم). لم تستخدم أبداً! اشتريتها ولم أجد الوقت للركوب. إطار ألومنيوم، تعشيق أمامي RockShox، 12 سرعة.',
    'price': 2500,
    'currency': 'MAD',
    'location': 'أكادير',
    'category': MOCK_CATEGORIES[5],
    'images': [
      'https://placehold.co/600x400/e94560/fff?text=Trek+Mountain+Bike',
      'https://placehold.co/600x400/1a1a2e/fff?text=Bike+Detail'
    ],
    'seller': { 'id': 'seller-005', 'name': 'كريم العمراني', 'avatar': null, 'rating': 4.6, 'isVerified': true },
    'status': 'active',
    'featured': true,
    'views': 789,
    'createdAt': '2024-01-13T16:30:00Z',
    'updatedAt': '2024-01-19T10:15:00Z',
    'condition': 'new'
  },
  {
    'id': 'listing-007',
    'title': 'مكنسة روبوت سامسونج Jet Bot AI+ ذكية',
    'description': 'سامسونج Jet Bot AI+ أذكى مكنسة روبوت في العالم. تتعلم تخطيط منزلك تلقائياً. تتحكم بها عبر التطبيق. تعمل على السجاد والبلاط. شراءتها قبل 3 أشهر.',
    'price': 1800,
    'currency': 'MAD',
    'location': 'طنجة',
    'category': MOCK_CATEGORIES[6],
    'images': [
      'https://placehold.co/600x400/0f3460/fff?text=Samsung+Jet+Bot',
      'https://placehold.co/600x400/1a1a2e/fff?text=Robot+Vacuum+App'
    ],
    'seller': { 'id': 'seller-006', 'name': 'نادية البكري', 'avatar': null, 'rating': 4.4, 'isVerified': false },
    'status': 'active',
    'featured': true,
    'views': 445,
    'createdAt': '2024-01-11T13:20:00Z',
    'updatedAt': '2024-01-18T14:50:00Z',
    'condition': 'like_new'
  },
  {
    'id': 'listing-008',
    'title': 'آيباد برو 12.9 بوصة M2 chip 256GB WiFi + Cellular',
    'description': 'آيباد برو 2022 مع Apple Pencil 2. شاشة Liquid Retina XDR. معالج M2 قوي. لونه فضي ممتاز. معه جراب أصلي وشاحن. مناسب للرسم والتصميم.',
    'price': 9000,
    'currency': 'MAD',
    'location': 'الدار البيضاء',
    'category': MOCK_CATEGORIES[0],
    'images': [
      'https://placehold.co/600x400/1a1a2e/fff?text=iPad+Pro+12.9',
      'https://placehold.co/600x400/16213e/fff?text=iPad+with+Pencil'
    ],
    'seller': { 'id': 'seller-007', 'name': 'ليلى الراشدي', 'avatar': null, 'rating': 4.9, 'isVerified': true },
    'status': 'active',
    'featured': true,
    'views': 1234,
    'createdAt': '2024-01-10T10:00:00Z',
    'updatedAt': '2024-01-19T16:20:00Z',
    'condition': 'good'
  }
];

// ============================================================
// Users
// ============================================================

export const MOCK_USERS: MockUser[] = [
  { id: 'user-001', name: 'أحمد محمد', email: 'ahmed@example.com', role: 'seller', status: 'active', joinDate: '2024-01-15', lastLogin: '2024-01-20', listingsCount: 12, rating: 4.8 },
  { id: 'user-002', name: 'فاطمة الزهراء', email: 'fatima@example.com', role: 'seller', status: 'active', joinDate: '2024-01-10', lastLogin: '2024-01-19', listingsCount: 8, rating: 4.9 },
  { id: 'user-003', name: 'عبد الرحمن', email: 'abdel@example.com', role: 'user', status: 'active', joinDate: '2024-01-18', lastLogin: '2024-01-20', listingsCount: 0, rating: 0 },
  { id: 'user-004', name: 'خديجة بنشي', email: 'khadija@example.com', role: 'admin', status: 'active', joinDate: '2024-01-05', lastLogin: '2024-01-20', listingsCount: 3, rating: 5.0 },
  { id: 'user-005', name: 'يوسف أمين', email: 'youssef@example.com', role: 'seller', status: 'suspended', joinDate: '2024-01-08', lastLogin: '2024-01-15', listingsCount: 5, rating: 3.2 },
  { id: 'user-006', name: 'سارة علي', email: 'sara@example.com', role: 'user', status: 'pending', joinDate: '2024-01-20', lastLogin: '-', listingsCount: 0, rating: 0 },
];

// ============================================================
// Stats
// ============================================================

export const MOCK_STATS = {
  totalUsers: 1247,
  activeListings: 456,
  totalRevenue: 125000,
  pendingOrders: 23,
  monthlyGrowth: 15.5,
  cities: 52,
  categories: 12,
};

// ============================================================
// Helper Functions
// ============================================================

export function getMockListings(limit?: number, category?: string): MockListing[] {
  let listings = [...MOCK_LISTINGS];
  
  if (category) {
    listings = listings.filter(l => l.category.slug === category);
  }
  
  if (limit) {
    listings = listings.slice(0, limit);
  }
  
  return listings;
}

export function getMockListingById(id: string): MockListing | undefined {
  return MOCK_LISTINGS.find(l => l.id === id);
}

export function getMockCategories(): MockCategory[] {
  return MOCK_CATEGORIES;
}

export function getCategoryBySlug(slug: string): MockCategory | undefined {
  return MOCK_CATEGORIES.find(c => c.slug === slug);
}
