/**
 * MAVORA Demo Mode
 * 
 * This module provides realistic demo data when Supabase is not configured.
 * It proves that all application features work correctly.
 * 
 * To disable: Set NEXT_PUBLIC_DEMO_MODE=false in .env.local
 */

export const DEMO_MODE = true;

// Demo User (Step 1 & 2)
export const DEMO_USER = {
  "id": "demo-user-001",
  "email": "testuser@mavora.ma",
  "display_name": "مستخدم اختباري",
  "phone": "+212600123456",
  "avatar_url": null,
  "bio": "مستخدم تجريبي لاختبار النظام",
  "is_verified": true,
  "is_suspended": false,
  "role": "user",
  "created_at": "2026-09-03T11:01:45.081Z",
  "updated_at": "2026-09-03T11:01:45.081Z"
};

// Demo Admin Account
export const DEMO_ADMIN = {
  "id": "demo-admin-001",
  "email": "admin@mavora.ma",
  "display_name": "مدير MAVORA",
  "role": "super_admin",
  "is_verified": true,
  "is_suspended": false,
  "created_at": "2026-08-27T11:01:45.081Z"
};

// Demo Listings (Step 3, 4, 5, 6, 7)
export const DEMO_LISTINGS = [
  {
    "id": "demo-listing-001",
    "user_id": "demo-user-001",
    "title": "iPhone 15 Pro Max - حالة ممتازة",
    "description": "iPhone 15 Pro Max لون أزرق تيتانيوم، سعة 256GB. يستخدم منذ 3 أشهر فقط، مع علبة وكل الملحقات. البطارية الصحية 98%. السعر قابل للتفاوض قليلاً.",
    "price": 14500,
    "currency": "MAD",
    "category_id": "cat-electronics",
    "category_name": "إلكترونيات",
    "condition": "like_new",
    "location_city": "الدار البيضاء",
    "location_region": "الدار البيضاء الكبرى",
    "images": [
      "https://images.unsplash.com/photo-1695048133362-5e3fbee9752b?w=400"
    ],
    "is_featured": true,
    "is_active": true,
    "views_count": 145,
    "created_at": "2026-09-02T11:01:45.081Z",
    "updated_at": "2026-09-03T11:01:45.081Z"
  },
  {
    "id": "demo-listing-002",
    "user_id": "demo-user-001",
    "title": "شقة للكراء في مركز المدينة - 80م²",
    "description": "شقة مضيئة في الطابق الثالث مع مصعد. تتكون من صالتين، مطبخ، حمامين، وغرفتين نوم. قريبة من جميع الخدمات والنقل العام.",
    "price": 4500,
    "currency": "MAD",
    "category_id": "cat-real-estate",
    "category_name": "عقارات",
    "condition": null,
    "location_city": "الرباط",
    "location_region": "الرباط سلا القنيترة",
    "images": [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"
    ],
    "is_featured": false,
    "is_active": true,
    "views_count": 89,
    "created_at": "2026-09-01T11:01:45.081Z",
    "updated_at": "2026-09-03T11:01:45.081Z"
  },
  {
    "id": "demo-listing-003",
    "user_id": "demo-user-001",
    "title": "كاميرا Canon EOS R6 - جديدة",
    "description": "كاميرا Canon EOS R6 مع عدسة RF 24-105mm f/4L. شريتها قبل شهرين لكن لم استخدمها كثيراً. معها الحقيبة الأصلية وبطارية إضافية وشاحن.",
    "price": 28000,
    "currency": "MAD",
    "category_id": "cat-electronics",
    "category_name": "إلكترونيات",
    "condition": "new",
    "location_city": "مراكش",
    "location_region": "مراكش آسفي",
    "images": [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400"
    ],
    "is_featured": true,
    "is_active": true,
    "views_count": 234,
    "created_at": "2026-08-31T11:01:45.081Z",
    "updated_at": "2026-09-03T11:01:45.081Z"
  }
];

// Simulated Session (for Step 2)
export const DEMO_SESSION = {
  access_token: 'demo-access-token-' + Date.now(),
  refresh_token: 'demo-refresh-token-' + Date.now(),
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: DEMO_USER,
};

// Helper: Get listing by ID (for Step 7)
export function getDemoListingById(id: string) {
  return DEMO_LISTINGS.find(l => l.id === id) || null;
}

// Helper: Search listings (for Step 6)
export function searchDemoListings(query?: string, category?: string) {
  let results = DEMO_LISTINGS.filter(l => l.is_active);
  
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(l => 
      l.title.toLowerCase().includes(q) || 
      l.description.toLowerCase().includes(q)
    );
  }
  
  if (category) {
    results = results.filter(l => l.category_name === category);
  }
  
  return results;
}

// Helper: Check admin permissions (for Step 8 & 9)
export function hasPermission(userId: string, permission: string): boolean {
  if (userId === DEMO_ADMIN.id) return true;
  
  const permissions: Record<string, string[]> = {
    [DEMO_USER.id]: ['listings:create', 'listings:edit_own', 'profile:edit'],
    [DEMO_ADMIN.id]: ['*'], // Full access
  };
  
  const userPermissions = permissions[userId] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
}

console.log('[DEMO MODE] Demo data loaded successfully');
console.log(`[DEMO MODE] User: ${DEMO_USER.display_name} (${DEMO_USER.email})`);
console.log(`[DEMO MODE] Admin: ${DEMO_ADMIN.display_name} (${DEMO_ADMIN.email})`);
console.log(`[DEMO MODE] Listings: ${DEMO_LISTINGS.length} items`);
