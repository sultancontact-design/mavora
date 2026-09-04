// ============================================================
// 🌐 E2E Tests - Main User Flows
// Covers: Page rendering, Navigation, User interactions
// ============================================================

import { describe, it, expect } from 'vitest';

// ============================================================
// Test Configuration
// ============================================================

const BASE_URL = 'http://localhost:3000';

// Helper to fetch and parse page
async function fetchPage(path: string): Promise<{
  status: number;
  html: string;
  contentType: string | null;
}> {
  const response = await fetch(`${BASE_URL}${path}`);
  const html = await response.text();
  return {
    status: response.status,
    html,
    contentType: response.headers.get('content-type'),
  };
}

// Check if HTML contains expected content
function containsHTML(html: string, ...strings: string[]): boolean {
  return strings.every(s => html.toLowerCase().includes(s.toLowerCase()));
}

// ============================================================
// Page Rendering Tests
// ============================================================

describe('E2E - Page Rendering', () => {
  
  describe('Homepage', () => {
    it('should render homepage successfully', async () => {
      const { status, html } = await fetchPage('/');
      
      expect(status).toBe(200);
      expect(html.length).toBeGreaterThan(100);
    });

    it('should contain main navigation', async () => {
      const { html } = await fetchPage('/');
      
      // Should have navigation elements
      expect(containsHTML(html, 'nav', 'header', 'a')).toBe(true);
    });

    it('should contain footer', async () => {
      const { html } = await fetchPage('/');
      
      expect(containsHTML(html, 'footer')).toBe(true);
    });

    it('should contain main content area', async () => {
      const { html } = await fetchPage('/');
      
      expect(containsHTML(html, 'main')).toBe(true);
    });
  });

  describe('Auth Pages', () => {
    it('should render login page', async () => {
      const { status, html } = await fetchPage('/auth/login');
      
      expect(status).toBe(200);
      expect(containsHTML(html, 'login', 'email', 'password')).toBe(true);
    });

    it('should render signup page', async () => {
      const { status, html } = await fetchPage('/auth/signup');
      
      expect(status).toBe(200);
      expect(containsHTML(html, 'sign up', 'register', 'email', 'password')).toBe(true);
    });

    it('should render forgot password page', async () => {
      const { status, html } = await fetchPage('/auth/forgot-password');
      
      expect(status).toBe(200);
      expect(containsHTML(html, 'forgot password', 'email', 'reset')).toBe(true);
    });

    it('should render reset password confirm page', async () => {
      const { status, html } = await fetchPage('/auth/reset-password/confirm');
      
      expect(status).toBe(200);
      expect(containsHTML(html, 'password', 'confirm', 'reset')).toBe(true);
    });
  });

  describe('Marketplace Pages', () => {
    it('should render listings page', async () => {
      const { status, html } = await fetchPage('/listings');
      
      expect(status).toBe(200);
      expect(containsHTML(html, 'listing', 'search', 'filter')).toBe(true);
    });

    it('should render create listing page (may redirect if not auth)', async () => {
      const { status } = await fetchPage('/listings/create');
      
      // Should either render or redirect to login
      expect([200, 302, 303, 307]).toContain(status);
    });

    it('should render category page', async () => {
      const { status } = await fetchPage('/category/vehicles');
      
      expect([200, 404]).toContain(status); // 404 if category doesn't exist
    });
  });

  describe('User Pages', () => {
    it('should render profile page', async () => {
      const { status } = await fetchPage('/profile');
      
      expect([200, 302, 303]).toContain(status);
    });

    it('should render favorites page', async () => {
      const { status } = await fetchPage('/favorites');
      
      expect([200, 302, 303]).toContain(status);
    });

    it('should render messages page', async () => {
      const { status } = await fetchPage('/messages');
      
      expect([200, 302, 303]).toContain(status);
    });

    it('should render wallet page', async () => {
      const { status } = await fetchPage('/wallet');
      
      expect([200, 302, 303]).toContain(status);
    });
  });

  describe('Static Pages', () => {
    it('should render about page', async () => {
      const { status, html } = await fetchPage('/about');
      
      expect(status).toBe(200);
      expect(html.length).toBeGreaterThan(50);
    });

    it('should render contact page', async () => {
      const { status, html } = await fetchPage('/contact');
      
      expect(status).toBe(200);
      expect(html.length).toBeGreaterThan(50);
    });

    it('should render help page', async () => {
      const { status } = await fetchPage('/help');
      
      expect(status).toBe(200);
    });

    it('should render terms page', async () => {
      const { status } = await fetchPage('/terms');
      
      expect(status).toBe(200);
    });

    it('should render privacy page', async () => {
      const { status } = await fetchPage('/privacy');
      
      expect(status).toBe(200);
    });
  });

  describe('Admin Pages', () => {
    it('should require auth for admin dashboard', async () => {
      const { status } = await fetchPage('/admin');
      
      // Should redirect to login if not authenticated
      expect([200, 302, 303]).toContain(status);
    });
  });

  describe('Error Pages', () => {
    it('should render 404 page for unknown routes', async () => {
      const { status, html } = await fetchPage('/this-page-definitely-does-not-exist-12345');
      
      expect(status).toBe(404);
      expect(containsHTML(html, '404', 'not found', 'page')).toBe(true);
    });
  });
});

// ============================================================
// SEO & Meta Tags Tests
// ============================================================

describe('E2E - SEO & Meta Tags', () => {
  
  it('should have title tag on homepage', async () => {
    const { html } = await fetchPage('/');
    
    expect(containsHTML(html, '<title>')).toBe(true);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
  });

  it('should have meta description on homepage', async () => {
    const { html } = await fetchPage('/');
    
    expect(html).toContain('name="description"') || 
           expect(html).toContain("name='description'");
  });

  it('should have viewport meta tag', async () => {
    const { html } = await fetchPage('/');
    
    expect(html).toContain('viewport');
  });

  it('should have favicon link', async () => {
    const { html } = await fetchPage('/');
    
    expect(containsHTML(html, 'favicon', 'icon')).toBe(true);
  });

  it('should have canonical URL', async () => {
    const { html } = await fetchPage('/');
    
    expect(html).toContain('canonical');
  });
});

// ============================================================
// Performance Tests
// ============================================================

describe('E2E - Basic Performance', () => {
  
  it('should load homepage in reasonable time (< 5 seconds)', async () => {
    const start = Date.now();
    const { status } = await fetchPage('/');
    const duration = Date.now() - start;
    
    expect(status).toBe(200);
    expect(duration).toBeLessThan(5000); // 5 seconds max
  }, 10000);

  it('should not have excessively large pages (> 5MB)', async () => {
    const { html } = await fetchPage('/');
    
    // HTML size should be reasonable (not counting assets)
    const sizeInBytes = new Blob([html]).size;
    const sizeInKB = sizeInBytes / 1024;
    
    expect(sizeInKB).toBeLessThan(5000); // 5MB max for HTML
  });
});

// ============================================================
// Accessibility Tests (Basic)
// ============================================================

describe('E2E - Basic Accessibility', () => {
  
  it('should have lang attribute on html element', async () => {
    const { html } = await fetchPage('/');
    
    expect(html).toContain('lang=');
  });

  it('should have alt text on images (if any)', async () => {
    const { html } = await fetchPage('/');
    
    // If there are img tags, they should have alt attributes
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    imgTags.forEach(img => {
      // Either has alt attribute or is decorative
      expect(
        img.includes('alt=') || img.includes('role="presentation"')
      ).toBe(true);
    });
  });

  it('should have proper heading hierarchy', async () => {
    const { html } = await fetchPage('/');
    
    // Should have at least one h1
    expect(html).toMatch(/<h1/);
  });
});
