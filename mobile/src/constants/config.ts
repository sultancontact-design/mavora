/**
 * Application Constants and Configuration for Mavora Mobile
 * Moroccan Arabic Marketplace App Configuration
 * 
 * @module constants/config
 */

// ============================================================
// App Information
// ============================================================

export const APP_CONFIG = {
  name: 'مافورا',
  nameEn: 'Mavora',
  version: '1.0.0',
  description: 'سوق المغرب الرقمي - Morocco Digital Marketplace',
  locale: 'ar-MA' as const,
  currency: 'MAD' as const,
  currencySymbol: 'د.م.' as const,
  countryCode: '+212' as const,
  defaultCity: 'الدار البيضاء' as const,
};

// ============================================================
// API & Supabase Configuration
// ============================================================

export const API_CONFIG = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // API endpoints (if using custom backend)
  baseUrl: process.env.API_BASE_URL || 'https://api.mavora.ma',
  
  // Timeout settings
  requestTimeout: 30000,
  uploadTimeout: 120000,
};

// ============================================================
// Pagination Settings
// ============================================================

export const PAGINATION = {
  listingsPerPage: 20,
  messagesPerPage: 50,
  notificationsPerPage: 20,
  reviewsPerPage: 10,
  
  // Infinite scroll thresholds
  listingLoadThreshold: 0.7,
  messageLoadThreshold: 0.8,
};

// ============================================================
// Listing Configuration
// ============================================================

export const LISTING_CONFIG = {
  // Price limits
  minPrice: 1,
  maxPrice: 10000000, // 10 million MAD
  
  // Image limits
  maxImages: 10,
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Text limits
  titleMinLength: 5,
  titleMaxLength: 100,
  descriptionMinLength: 20,
  descriptionMaxLength: 5000,
  
  // Featured listing duration (days)
  featuredDuration: 7,
  
  // Default listing duration (days)
  defaultDuration: 30,
};

// ============================================================
// Category Icons Mapping (Ionicons)
// ============================================================

export const CATEGORY_ICONS: Record<string, string> = {
  electronics: 'phone-portrait-outline',
  vehicles: 'car-outline',
  property: 'home-outline',
  fashion: 'shirt-outline',
  home_garden: 'bed-outline',
  jobs: 'briefcase-outline',
  services: 'construct-outline',
  animals: 'paw-outline',
  sports: 'basketball-outline',
  books: 'book-outline',
  baby: 'happy-outline',
  food: 'restaurant-outline',
  other: 'grid-outline',
};

// ============================================================
// Listing Conditions (Arabic)
// ============================================================

export const LISTING_CONDITIONS = [
  { value: 'new', label: 'جديد', labelEn: 'New' },
  { value: 'like_new', label: 'مثل الجديد', labelEn: 'Like New' },
  { value: 'good', label: 'حالة جيدة', labelEn: 'Good' },
  { value: 'fair', label: 'مقبول', labelEn: 'Fair' },
  { value: 'poor', label: 'يحتاج إصلاح', labelEn: 'Needs Repair' },
] as const;

// ============================================================
// Moroccan Cities
// ============================================================

export const MOROCCAN_CITIES = [
  { id: 'casablanca', name: 'الدار البيضاء', nameEn: 'Casablanca' },
  { id: 'rabat', name: 'الرباط', nameEn: 'Rabat' },
  { id: 'marrakech', name: 'مراكش', nameEn: 'Marrakech' },
  { id: 'fes', name: 'فاس', nameEn: 'Fes' },
  { id: 'tangier', name: 'طنجة', nameEn: 'Tangier' },
  { id: 'agadir', name: 'أكادير', nameEn: 'Agadir' },
  { id: 'meknes', name: 'مكناس', nameEn: 'Meknes' },
  { id: 'oujda', name: 'وجدة', nameEn: 'Oujda' },
  { id: 'kenitra', name: 'القنطرة', nameEn: 'Kenitra' },
  { id: 'tetouan', name: 'تطوان', nameEn: 'Tetouan' },
  { id: 'safi', name: 'آسفي', nameEn: 'Safi' },
  { id: 'el_jadida', name: 'الجديدة', nameEn: 'El Jadida' },
  { id: 'nador', name: 'Nador', nameEn: 'Nador' },
  { id: 'beni_mellal', name: 'بني ملال', nameEn: 'Beni Mellal' },
] as const;

// ============================================================
// Sort Options
// ============================================================

export const SORT_OPTIONS = [
  { value: 'date', label: 'الأحدث', labelEn: 'Newest' },
  { value: 'price_asc', label: 'السعر: من الأقل للأعلى', labelEn: 'Price: Low to High' },
  { value: 'price_desc', label: 'السعر: من الأعلى للأقل', labelEn: 'Price: High to Low' },
  { value: 'popularity', label: 'الأكثر شعبية', labelEn: 'Most Popular' },
] as const;

// ============================================================
// Theme Colors
// ============================================================

export const COLORS = {
  // Primary brand colors
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
  
  // Semantic colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral colors
  background: '#f9fafb',
  surface: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  divider: '#f3f4f6',
  
  // Dark theme colors
  darkBackground: '#111827',
  darkSurface: '#1f2937',
  darkText: '#f9fafb',
  darkTextSecondary: '#9ca3af',
  darkBorder: '#374151',
};

// ============================================================
// Font Family Configuration
// ============================================================

export const FONTS = {
  // Arabic fonts (Cairo is recommended)
  regular: 'Cairo-Regular',
  medium: 'Cairo-Medium',
  semiBold: 'Cairo-SemiBold',
  bold: 'Cairo-Bold',
  
  // Fallback fonts
  fallback: ['Cairo', 'Tajawal', 'sans-serif'],
} as const;

// ============================================================
// Animation Durations (ms)
// ============================================================

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  pageTransition: 350,
  modalTransition: 250,
};

// ============================================================
// Storage Keys
// ============================================================

export const STORAGE_KEYS = {
  authToken: '@mavora_auth_token',
  refreshToken: '@mavora_refresh_token',
  user: '@mavora_user',
  theme: '@mavora_theme',
  language: '@mavora_language',
  onboardingComplete: '@mavora_onboarding_complete',
  searchHistory: '@mavora_search_history',
  favorites: '@mavora_favorites_cache',
} as const;

// ============================================================
// Validation Patterns
// ============================================================

export const VALIDATION = {
  // Moroccan phone number pattern (+212 6/7 XX XXX XXX)
  phoneRegex: /^(\+212|0)[5-7]\d{8}$/,
  
  // Email pattern
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Password requirements
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: false,
  
  // Username pattern (Arabic/Latin letters, numbers, underscores)
  usernameRegex: /^[\w\u0600-\06FF]{3,30}$/,
};

// ============================================================
// Feature Flags
// ============================================================

export const FEATURES = {
  enableChat: true,
  enableWallet: true,
  enableMapSearch: true,
  enablePushNotifications: true,
  enableImageRecognition: false,
  enableVoiceSearch: false,
  enableARPreview: false,
} as const;
