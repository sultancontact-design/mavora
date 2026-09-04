/**
 * MAVORA Demo Mode - DISABLED FOR PRODUCTION
 * 
 * ⚠️ IMPORTANT: This module is DISABLED in production.
 * 
 * Demo data was used during development to test features
 * before Supabase was fully configured.
 * 
 * Current Status: PRODUCTION MODE (Demo Disabled)
 * 
 * The application now uses REAL data from Supabase:
 * - 57 users
 * - 100 listings  
 * - 47 categories
 * - 66 cities
 * - 187 listing images
 */

// 🔒 DEMO MODE IS DISABLED FOR PRODUCTION
export const DEMO_MODE = false;

// Demo Data (UNUSED IN PRODUCTION - Kept for reference only)
// These values are NOT loaded when DEMO_MODE = false

export const DEMO_USER = {
  "id": "demo-user-001",
  "email": "testuser@mavora.ma",  // ⚠️ This account is NOT real
  "display_name": "مستخدم اختباري",
  "phone": "+212600123456",       // ⚠️ This number is NOT real
  "avatar_url": null,
  "bio": "مستخدم تجريبي لاختبار النظام",
  "is_verified": true,
  "is_suspended": false,
  "role": "user",
  "created_at": "2026-09-03T11:01:45.081Z",
  "updated_at": "2026-09-03T11:01:45.081Z"
};

export const DEMO_ADMIN = {
  "id": "demo-admin-001",
  "email": "admin@mavora.ma",    // ⚠️ This account is NOT real
  "display_name": "مدير MAVORA",
  "role": "super_admin",
  "is_verified": true,
  "is_suspended": false,
  "created_at": "2026-08-27T11:01:45.081Z"
};

export const DEMO_LISTINGS = [
  // ⚠️ These are NOT real listings
  {
    "id": "demo-listing-001",
    "user_id": "demo-user-001",
    "title": "iPhone 15 Pro Max - حالة ممتازة",
    "description": "iPhone 15 Pro Max لون أزرق تيتانيوم، سعة 256GB...",
    "price": 14500,
    "currency": "MAD",
    "category_id": "cat-electronics",
    "category_name": "إلكترونيات",
    "condition": "like_new",
    "location_city": "الدار البيضاء",
    "location_region": "الدار البيضاء الكبرى",
    "images": ["https://images.unsplash.com/photo-1695048133362-5e3fbee9752b?w=400"],
    "is_featured": true,
    "is_active": true,
    "views_count": 145,
    "created_at": "2026-09-02T11:01:45.081Z",
    "updated_at": "2026-09-03T11:01:45.081Z"
  },
  // ... other demo listings (not shown for brevity)
];

export const DEMO_SESSION = {
  access_token: 'demo-access-token-',  // ⚠️ NOT a real token
  refresh_token: 'demo-refresh-token-',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: DEMO_USER,
};

// Helper functions (DISABLED - Return empty/null in production)
export function getDemoListingById(id: string): null {
  if (DEMO_MODE) {
    return DEMO_LISTINGS.find(l => l.id === id) || null;
  }
  return null; // Production: Use real database
}

export function searchDemoListings(query?: string, category?: string): never[] {
  if (DEMO_MODE) {
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
  return []; // Production: Use real database
}

export function hasPermission(userId: string, permission: string): boolean {
  // In production, permissions are handled by Supabase RLS and role checks
  // This is just a fallback for demo mode
  if (DEMO_MODE) {
    if (userId === DEMO_ADMIN.id) return true;
    const permissions: Record<string, string[]> = {
      [DEMO_USER.id]: ['listings:create', 'listings:edit_own', 'profile:edit'],
      [DEMO_ADMIN.id]: ['*'],
    };
    const userPermissions = permissions[userId] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }
  return false; // Production: Use real auth system
}

// Only log in development/demo mode
if (DEMO_MODE) {
  console.log('[DEMO MODE] ⚠️ Demo data loaded - NOT for production use');
  console.log(`[DEMO MODE] User: ${DEMO_USER.display_name} (${DEMO_USER.email})`);
  console.log(`[DEMO MODE] Admin: ${DEMO_ADMIN.display_name} (${DEMO_ADMIN.email})`);
  console.log(`[DEMO MODE] Listings: ${DEMO_LISTINGS.length} items`);
} else {
  console.log('[PRODUCTION MODE] ✅ Using real data from Supabase');
}
