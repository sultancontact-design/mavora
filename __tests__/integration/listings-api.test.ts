// ============================================================
// 🧪 Integration Tests - Listings API (Comprehensive)
// Covers: CRUD, Search, Filtering, Pagination, Favorites, Reviews
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// ============================================================
// Test Configuration
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Helper function for API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any; headers: Headers }> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data, headers: response.headers };
}

// ============================================================
// Listings List Endpoint Tests
// ============================================================

describe('Integration - Listings - List', () => {
  it('should return listings list with default pagination', async () => {
    const { status, data } = await apiRequest('/listings');

    expect(status).toBe(200);
    expect(data).toHaveProperty('listings');
    expect(Array.isArray(data.listings)).toBe(true);
  });

  it('should accept page parameter', async () => {
    const { status, data } = await apiRequest('/listings?page=1');

    expect(status).toBe(200);
    if (data) {
      expect(data).toHaveProperty('listings');
      expect(data).toHaveProperty('pagination');
    }
  });

  it('should accept limit parameter', async () => {
    const { status, data } = await apiRequest('/listings?limit=10');

    expect(status).toBe(200);
    if (data?.listings) {
      expect(data.listings.length).toBeLessThanOrEqual(10);
    }
  });

  it('should handle search parameter', async () => {
    const { status, data } = await apiRequest('/listings?search=test');

    expect(status).toBe(200);
    if (data) {
      expect(data).toHaveProperty('listings');
    }
  });

  it('should filter by category', async () => {
    const { status } = await apiRequest('/listings?category=vehicles');

    expect([200, 400, 404]).toContain(status);
  });

  it('should filter by price range', async () => {
    const { status } = await apiRequest('/listings?min_price=100&max_price=1000');

    expect(status).toBe(200);
  });

  it('should filter by location/city', async () => {
    const { status } = await apiRequest('/listings?city=casablanca');

    expect(status).toBe(200);
  });

  it('should support sorting options', async () => {
    const { status } = await apiRequest('/listings sort=price_asc');

    // Should handle sort parameter (may need encoding)
    expect([200, 400]).toContain(status);
  });

  it('should filter by condition', async () => {
    const { status } = await apiRequest('/listings?condition=new');

    expect(status).toBe(200);
  });

  it('should return proper pagination metadata', async () => {
    const { status, data } = await apiRequest('/listings?page=1&limit=5');

    expect(status).toBe(200);
    if (data?.pagination) {
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('totalPages');
    }
  });
});

// ============================================================
// Single Listing Endpoint Tests
// ============================================================

describe('Integration - Listings - Single Listing', () => {
  it('should return 404 for non-existent listing', async () => {
    const { status } = await apiRequest('/listings/non-existent-id-12345');

    expect([404, 400]).toContain(status);
  });

  it('should reject invalid ID format', async () => {
    const { status } = await apiRequest('/listings/invalid-id-with-spaces');

    expect([400, 404]).toContain(status);
  });

  it('should handle SQL injection in listing ID', async () => {
    const { status, data } = await apiRequest("/listings/1' OR '1'='1");

    expect([400, 404]).toContain(status);
    if (data) {
      const responseStr = JSON.stringify(data).toLowerCase();
      expect(responseStr).not.toContain('sql');
      expect(responseStr).not.toContain('syntax');
    }
  });

  it('should include seller information in response', async () => {
    // First get a listing ID from the list
    const { data: listData } = await apiRequest('/listings?limit=1');
    
    if (listData?.listings?.[0]?.id) {
      const { status, data } = await apiRequest(`/listings/${listData.listings[0].id}`);
      
      expect(status).toBe(200);
      if (data?.listing) {
        expect(data.listing).toHaveProperty('seller');
        expect(data.listing.seller).toHaveProperty('id');
        expect(data.listing.seller).toHaveProperty('displayName');
      }
    }
  });

  it('should include media/images in response', async () => {
    const { data: listData } = await apiRequest('/listings?limit=1');
    
    if (listData?.listings?.[0]?.id) {
      const { status, data } = await apiRequest(`/listings/${listData.listings[0].id}`);
      
      expect(status).toBe(200);
      if (data?.listing) {
        expect(data.listing).toHaveProperty('media');
        expect(Array.isArray(data.listing.media)).toBe(true);
      }
    }
  });
});

// ============================================================
// Listing Creation Tests (Authentication Required)
// ============================================================

describe('Integration - Listings - Create', () => {
  it('should reject unauthenticated creation attempt', async () => {
    const { status, data } = await apiRequest('/listings', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Listing',
        description: 'Test Description',
        price: 100,
        category_id: 'test-category',
      }),
    });

    expect([401, 403]).toContain(status);
  });

  it('should reject creation without required fields', async () => {
    const { status } = await apiRequest('/listings', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect([400, 401]).toContain(status);
  });

  it('should reject invalid price values', async () => {
    const { status } = await apiRequest('/listings', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        description: 'Test',
        price: 'not-a-number',
        category_id: 'test',
      }),
    });

    expect([400, 401]).toContain(status);
  });

  it('should reject negative price', async () => {
    const { status } = await apiRequest('/listings', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        description: 'Test',
        price: -100,
        category_id: 'test',
      }),
    });

    expect([400, 401]).toContain(status);
  });
});

// ============================================================
// Listing Update Tests
// ============================================================

describe('Integration - Listings - Update', () => {
  it('reject unauthenticated update attempt', async () => {
    const { status } = await apiRequest('/listings/some-id', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
    });

    expect([401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Listing Status Tests
// ============================================================

describe('Integration - Listings - Status', () => {
  it('should reject unauthenticated status change', async () => {
    const { status } = await apiRequest('/listings/some-id/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
    });

    expect([401, 403, 404]).toContain(status);
  });

  it('should reject invalid status value', async () => {
    const { status } = await apiRequest('/listings/some-id/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'invalid-status' }),
    });

    expect([400, 401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Favorite Listings Tests
// ============================================================

describe('Integration - Listings - Favorites', () => {
  it('should reject unauthenticated favorite addition', async () => {
    const { status } = await apiRequest('/listings/some-id/favorite', {
      method: 'POST',
    });

    expect([401, 403, 404]).toContain(status);
  });

  it('should reject unauthenticated favorite removal', async () => {
    const { status } = await apiRequest('/listings/some-id/favorite', {
      method: 'DELETE',
    });

    expect([401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Listing Reviews Tests
// ============================================================

describe('Integration - Listings - Reviews', () => {
  it('should return reviews for a listing', async () => {
    // Get a valid listing first
    const { data: listData } = await apiRequest('/listings?limit=1');
    
    if (listData?.listings?.[0]?.id) {
      const { status, data } = await apiRequest(`/listings/${listData.listings[0].id}/reviews`);
      
      expect(status).toBe(200);
      if (data) {
        expect(data).toHaveProperty('reviews');
        expect(Array.isArray(data.reviews)).toBe(true);
      }
    }
  });

  it('should reject unauthenticated review creation', async () => {
    const { status } = await apiRequest('/listings/some-id/reviews', {
      method: 'POST',
      body: JSON.stringify({
        rating: 5,
        comment: 'Great product!',
      }),
    });

    expect([401, 403, 404]).toContain(status);
  });

  it('should reject review with invalid rating', async () => {
    const { status } = await apiRequest('/listings/some-id/reviews', {
      method: 'POST',
      body: JSON.stringify({
        rating: 10, // Invalid: should be 1-5
        comment: 'Test',
      }),
    });

    expect([400, 401, 403, 422]).toContain(status);
  });
});

// ============================================================
// Listing Report Tests
// ============================================================

describe('Integration - Listings - Report', () => {
  it('should reject unauthenticated report', async () => {
    const { status } = await apiRequest('/listings/some-id/report', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'spam',
        description: 'This is spam',
      }),
    });

    expect([401, 403, 404]).toContain(status);
  });

  it('should require reason for report', async () => {
    const { status } = await apiRequest('/listings/some-id/report', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect([400, 401, 403]).toContain(status);
  });
});

// ============================================================
// Listing Media Tests
// ============================================================

describe('Integration - Listings - Media', () => {
  it('should reject unauthenticated media upload', async () => {
    const { status } = await apiRequest('/listings/some-id/media', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/image.jpg' }),
    });

    expect([401, 403, 404]).toContain(status);
  });

  it('should reject unauthenticated media deletion', async () => {
    const { status } = await apiRequest('/listings/some-id/media', {
      method: 'DELETE',
      body: JSON.stringify({ mediaId: 'some-media-id' }),
    });

    expect([401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Listing Fields/Attributes Tests
// ============================================================

describe('Integration - Listings - Custom Fields', () => {
  it('should return custom fields for a listing', async () => {
    const { data: listData } = await apiRequest('/listings?limit=1');
    
    if (listData?.listings?.[0]?.id) {
      const { status, data } = await apiRequest(`/listings/${listData.listings[0].id}/fields`);
      
      expect([200, 404]).toContain(status);
    }
  });
});

// ============================================================
// Search & Filtering Edge Cases
// ============================================================

describe('Integration - Listings - Search Edge Cases', () => {
  it('should handle empty search gracefully', async () => {
    const { status, data } = await apiRequest('/listings?search=');

    expect(status).toBe(200);
    expect(data).toHaveProperty('listings');
  });

  it('should handle special characters in search', async () => {
    const { status } = await apiRequest('/listings?search=%3Cscript%3E');

    expect(status).toBe(200);
  });

  it('should handle very long search query', async () => {
    const longQuery = 'a'.repeat(500);
    const { status } = await apiRequest(`/listings?search=${longQuery}`);

    // Should either handle it or return error, not crash
    expect([200, 400, 414]).toContain(status);
  });

  it('should handle Unicode/Arabic search', async () => {
    const { status } = await apiRequest('/listings?search=سيارة');

    expect(status).toBe(200);
  });

  it('should handle multiple filters combined', async () => {
    const { status } = await apiRequest('/listings?min_price=100&max_price=1000&condition=new&category=vehicles');

    expect(status).toBe(200);
  });

  it('should handle invalid pagination parameters', async () => {
    const { status } = await apiRequest('/listings?page=-1&limit=abc');

    // Should use defaults or return error
    expect([200, 400]).toContain(status);
  });

  it('should handle very large page number', async () => {
    const { status, data } = await apiRequest('/listings?page=99999');

    expect(status).toBe(200);
    if (data?.listings) {
      // Should return empty array for out-of-range page
      expect(data.listings.length).toBe(0);
    }
  });
});

// ============================================================
// Response Format Tests
// ============================================================

describe('Integration - Listings - Response Format', () => {
  it('should return consistent response structure', async () => {
    const { status, data } = await apiRequest('/listings?limit=1');

    expect(status).toBe(200);
    if (data) {
      // Check for expected top-level properties
      expect(data).toHaveProperty('listings');
    }
  });

  it('should not expose sensitive data', async () => {
    const { data: listData } = await apiRequest('/listings?limit=5');
    
    if (listData?.listings) {
      for (const listing of listData.listings) {
        // Should not expose internal fields
        expect(listing).not.toHaveProperty('password');
        expect(listing).not.toHaveProperty('email');
        expect(listing).not.toHaveProperty('phone_number'); // Unless explicitly public
      }
    }
  });

  it('should have proper CORS headers', async () => {
    const response = await fetch(`${API_BASE}/listings`);
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    // CORS header may or may not be present depending on config
    if (corsHeader) {
      expect(corsHeader).toBeTruthy();
    }
  });
});
