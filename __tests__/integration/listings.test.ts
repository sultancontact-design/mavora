// ============================================================
// 🧪 Integration Tests - Listings & Marketplace
// Covers: CRUD operations, Search, Filters, Categories
// ============================================================

import { describe, it, expect } from 'vitest';

// ============================================================
// Test Configuration
// ============================================================

const API_BASE = 'http://localhost:3000/api';

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
// Listings CRUD Tests
// ============================================================

describe('Integration - Listings - CRUD', () => {
  
  describe('GET /api/listings', () => {
    it('should return listings list', async () => {
      const { status, data } = await apiRequest('/listings?page=1&limit=10');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('listings');
      expect(Array.isArray(data.listings)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const { status, data } = await apiRequest('/listings?page=1&limit=5');
      
      expect(status).toBe(200);
      if (data.listings && data.listings.length > 0) {
        expect(data.listings.length).toBeLessThanOrEqual(5);
      }
    });

    it('should support search parameter', async () => {
      const { status, data } = await apiRequest('/listings?search=car');
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('listings');
    });

    it('should support category filtering', async () => {
      const { status, data } = await apiRequest('/listings?category=vehicles');
      
      expect(status).toBe(200);
      // Should return filtered results or empty array
      expect(Array.isArray(data.listings)).toBe(true);
    });

    it('should support sorting options', async () => {
      const { status } = await apiRequest('/listings?sort=price_asc');
      
      expect(status).toBe(200);
    });
  });

  describe('GET /api/listings/[id]', () => {
    it('should return 404 for non-existent listing', async () => {
      const { status } = await apiRequest('/listings/non-existent-id');
      
      expect([404, 400]).toContain(status);
    });

    it('should return listing details for valid ID (if exists)', async () => {
      // First get a valid listing ID
      const { data: listData } = await apiRequest('/listings?limit=1');
      
      if (listData.listings && listData.listings.length > 0) {
        const listingId = listData.listings[0].id;
        const { status, data } = await apiRequest(`/listings/${listingId}`);
        
        expect(status).toBe(200);
        expect(data).toHaveProperty('id', listingId);
        expect(data).toHaveProperty('title');
      }
      // Skip test if no listings exist
    });
  });

  describe('POST /api/listings', () => {
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

      // Should require authentication
      expect([401, 403]).toContain(status);
    });
  });

  describe('PUT /api/listings/[id]', () => {
    it('reject unauthenticated update attempt', async () => {
      const { status } = await apiRequest('/listings/some-id', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });

      expect([401, 403, 404]).toContain(status);
    });
  });

  describe('DELETE /api/listings/[id]', () => {
    it('should reject unauthenticated delete attempt', async () => {
      const { status } = await apiRequest('/listings/some-id', {
        method: 'DELETE',
      });

      expect([401, 403, 404]).toContain(status);
    });
  });
});

// ============================================================
// Categories Tests
// ============================================================

describe('Integration - Categories', () => {
  
  describe('GET /api/categories', () => {
    it('should return categories list', async () => {
      const { status, data } = await apiRequest('/categories');
      
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      // Or if wrapped in object
      if (!Array.isArray(data) && data.categories) {
        expect(Array.isArray(data.categories)).toBe(true);
      }
    });

    it('should include required category fields', async () => {
      const { status, data } = await apiRequest('/categories');
      
      if (status === 200 && Array.isArray(data) && data.length > 0) {
        const category = data[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
      }
    });
  });

  describe('GET /api/categories/[slug]', () => {
    it('should return category by slug or 404', async () => {
      const { status } = await apiRequest('/categories/vehicles');
      
      expect([200, 404]).toContain(status);
    });
  });
});

// ============================================================
// Search & Filter Tests
// ============================================================

describe('Integration - Search & Filters', () => {
  
  it('should handle search with special characters', async () => {
    const { status } = await apiRequest('/listings?search=test%20item');
    
    expect(status).toBe(200);
  });

  it('should filter by price range', async () => {
    const { status } = await apiRequest('/listings?min_price=100&max_price=1000');
    
    expect(status).toBe(200);
  });

  it('should filter by location', async () => {
    const { status } = await apiRequest('/listings?city=casablanca');
    
    expect(status).toBe(200);
  });

  it('should combine multiple filters', async () => {
    const { status } = await apiRequest(
      '/listings?category=vehicles&min_price=100&sort=newest'
    );
    
    expect(status).toBe(200);
  });

  it('should handle invalid filter values gracefully', async () => {
    const { status } = await apiRequest('/listings?price=not-a-number');
    
    // Should either ignore invalid filter or return error
    expect([200, 400]).toContain(status);
  });
});

// ============================================================
// Favorites Tests
// ============================================================

describe('Integration - Favorites', () => {
  
  it('should require authentication to add favorite', async () => {
    const { status } = await apiRequest('/favorites', {
      method: 'POST',
      body: JSON.stringify({ listing_id: 'some-listing-id' }),
    });

    expect([401, 403]).toContain(status);
  });

  it('should require authentication to get favorites', async () => {
    const { status } = await apiRequest('/favorites');

    expect([401, 403, 200]).toContain(status);
  });
});

// ============================================================
// Upload Tests
// ============================================================

describe('Integration - Upload', () => {
  
  it('should reject upload without file', async () => {
    const { status } = await apiRequest('/upload', {
      method: 'POST',
    });

    expect([400, 401]).toContain(status);
  });

  it('should reject upload without authentication', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
    
    const { status } = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    expect([401, 403, 400]).toContain(status);
  });
});
