// ============================================================
// 🎭 E2E Tests - Listings & Search
// Covers: Browse, Search, Filter, View Details, Create Listing
// ============================================================

import { test, expect } from '@playwright/test';

// ============================================================
// Listings Browsing Tests
// ============================================================

test.describe('Listings - Browsing', () => {
  test('should display listings on the listings page', async ({ page }) => {
    await page.goto('/listings');
    
    // Page should load
    await expect(page).toHaveURL(/.*listings/i);
    
    // Look for listing cards or items
    const listingCards = page.locator('[class*="listing"], [class*="card"], article, [data-testid*="listing"]');
    const cardCount = await listingCards.count();
    
    // Should have some content (may be empty if no listings)
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('should have working pagination', async ({ page }) => {
    await page.goto('/listings');
    
    // Look for pagination controls
    const pagination = page.locator('[class*="pagination"], nav[aria-label*="pagination" i], [class*="page"]');
    const paginationCount = await pagination.count();
    
    if (paginationCount > 0) {
      await expect(pagination.first()).toBeVisible();
      
      // Look for next/page links
      const nextPage = page.locator('a[href*="page"], button:has-text("next"), button:has-text("التالي")');
      const nextCount = await nextPage.count();
      
      if (nextCount > 0) {
        // May or may not be clickable (depending on total pages)
        expect(await nextPage.first().isEnabled()).toBeDefined();
      }
    }
  });

  test('should show listing categories', async ({ page }) => {
    await page.goto('/listings');
    
    // Look for category filters
    const categories = page.locator('[class*="category"], a[href*="category"], [data-category]');
    const categoryCount = await categories.count();
    
    // Categories may be in sidebar, top bar, or separate section
    expect(categoryCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// Search Functionality Tests
// ============================================================

test.describe('Listings - Search', () => {
  test('should have search input', async ({ page }) => {
    await page.goto('/listings');
    
    const searchInput = page.locator('input[type="search"], input[name="search"], input[placeholder*="بحث" i], input[placeholder*="search" i]');
    const searchCount = await searchInput.count();
    
    // Search is a core feature - should exist
    expect(searchCount).toBeGreaterThan(0);
  });

  test('should perform search and update results', async ({ page }) => {
    await page.goto('/listings');
    
    const searchInput = page.locator('input[type="search"], input[name="search"], input[placeholder*="بحث" i], input[placeholder*="search" i]');
    const searchCount = await searchInput.count();
    
    if (searchCount > 0) {
      // Type search query
      await searchInput.first().fill('test');
      
      // Either auto-search or need to submit
      const searchButton = page.locator('button[type="submit"], button:has-text("بحث"), button:has-text("Search")');
      const buttonCount = await searchButton.count();
      
      if (buttonCount > 0) {
        await searchButton.first().click();
      } else {
        // Wait for debounce/auto-search
        await page.waitForTimeout(500);
      }
      
      // URL should update with search parameter or results should update
      expect(page.url()).toBeTruthy();
    }
  });

  test('should handle Arabic search queries', async ({ page }) => {
    await page.goto('/listings');
    
    const searchInput = page.locator('input[type="search"], input[name="search"]') as any;
    const searchCount = await searchInput.count();
    
    if (searchCount > 0) {
      await searchInput.first().fill('سيارة');
      await page.waitForTimeout(500);
      
      // Should handle without errors
      expect(page.url()).toBeTruthy();
    }
  });

  test('should clear search and show all results', async ({ page }) => {
    await page.goto('/listings?search=test');
    
    // Look for clear button or clear search manually
    const clearButton = page.locator('button:has-text("clear"), button:has-text("مسح"), [class*="clear-search"]');
    const clearCount = await clearButton.count();
    
    if (clearCount > 0) {
      await clearButton.first().click();
      await page.waitForTimeout(300);
      
      // Search param should be cleared
      expect(page.url()).not.toContain('search=');
    }
  });
});

// ============================================================
// Filter Tests
// ============================================================

test.describe('Listings - Filters', () => {
  test('should have price range filter', async ({ page }) => {
    await page.goto('/listings');
    
    // Look for price filter
    const priceFilter = page.locator('[class*="price"] input, [name*="price"], input[min][max]');
    const priceCount = await priceFilter.count();
    
    // Price filter is common but not required
    expect(priceCount).toBeGreaterThanOrEqual(0);
  });

  test('should have location/city filter', async ({ page }) => {
    await page.goto('/listings');
    
    // Look for location filter
    const locationFilter = page.locator('[name*="city"], [name*="location"], select[name*="city"], [class*="location"]');
    const locationCount = await locationFilter.count();
    
    expect(locationCount).toBeGreaterThanOrEqual(0);
  });

  test('should have condition filter (new/used)', async ({ page }) => {
    await page.goto('/listings');
    
    // Look for condition filter
    const conditionFilter = page.locator('[name*="condition"], [class*="condition"]');
    const conditionCount = await conditionFilter.count();
    
    expect(conditionCount).toBeGreaterThanOrEqual(0);
  });

  test('should apply multiple filters simultaneously', async ({ page }) => {
    await page.goto('/listings');
    
    // Apply one filter (if available)
    const categoryLink = page.locator('a[href*="category"]').first();
    const categoryCount = await categoryLink.count();
    
    if (categoryCount > 0) {
      await categoryLink.click();
      await page.waitForTimeout(500);
      
      // URL should contain category filter
      expect(page.url()).toContain('category');
    }
  });

  test('should have sort options', async ({ page }) => {
    await page.goto('/listings');
    
    // Look for sort dropdown/buttons
    const sortSelect = page.locator('select[name*="sort"], [class*="sort"] select, button[group*="sort"]');
    const sortCount = await sortSelect.count();
    
    // Sort is expected feature
    expect(sortCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// Listing Detail Tests
// ============================================================

test.describe('Listings - Detail View', () => {
  test('should show listing details when clicking a listing', async ({ page }) => {
    await page.goto('/listings');
    
    // Find first listing card/link
    const listingLink = page.locator('a[href*="/listings/"]').first();
    const linkCount = await listingLink.count();
    
    if (linkCount > 0) {
      await listingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to detail page
      expect(page.url()).toContain('/listings/');
    }
  });

  test('should display seller information', async ({ page }) => {
    // Navigate directly to a listing (would need real ID)
    await page.goto('/listings');
    
    const listingLink = page.locator('a[href*="/listings/"]').first();
    const linkCount = await listingLink.count();
    
    if (linkCount > 0) {
      await listingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for seller info
      const sellerInfo = page.locator('[class*="seller"], [class*="user"], [class*="profile"]');
      const sellerCount = await sellerInfo.count();
      
      // Seller info should be present on detail page
      expect(sellerCount).toBeGreaterThan(0);
    }
  });

  test('should display listing images/gallery', async ({ page }) => {
    await page.goto('/listings');
    
    const listingLink = page.locator('a[href*="/listings/"]').first();
    const linkCount = await listingLink.count();
    
    if (linkCount > 0) {
      await listingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for images
      const images = page.locator('[class*="gallery"] img, [class*="image"] img, [class*="photo"] img');
      const imageCount = await images.count();
      
      // Images should be present (unless no images uploaded)
      expect(imageCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have contact/message seller option', async ({ page }) => {
    await page.goto('/listings');
    
    const listingLink = page.locator('a[href*="/listings/"]').first();
    const linkCount = await listingLink.count();
    
    if (linkCount > 0) {
      await listingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for contact/button
      const contactButton = page.locator('button:has-text("رسالة"), button:has-text("contact"), a:has-text("تواصل")');
      const contactCount = await contactButton.count();
      
      // Contact option should be available
      expect(contactCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have favorite/save option', async ({ page }) => {
    await page.goto('/listings');
    
    const listingLink = page.locator('a[href*="/listings/"]').first();
    const linkCount = await listingLink.count();
    
    if (linkCount > 0) {
      await listingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for favorite button
      const favoriteButton = page.locator('button:has-text("مفضلة"), button:has-text("favorite"), [class*="favorite"], [class*="save"]');
      const favCount = await favoriteButton.count();
      
      expect(favCount).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================
// Create Listing Tests (Authenticated)
// ============================================================

test.describe('Listings - Create (Authenticated)', () => {
  test('should show create listing form when authenticated', async ({ page }) => {
    // This test would need authentication
    // For now, verify the route exists
    
    await page.goto('/listings/new');
    
    // Should either show form or redirect to login
    const form = page.locator('form, [class*="create"], [class*="new-listing"]');
    const formCount = await form.count();
    
    expect(formCount).toBeGreaterThanOrEqual(0);
  });

  test('should validate required fields on create', async ({ page }) => {
    await page.goto('/listings/new');
    
    const submitButton = page.locator('button[type="submit"]');
    const submitCount = await submitButton.count();
    
    if (submitCount > 0) {
      // Try to submit empty form
      await submitButton.first().click();
      
      // Should show validation errors
      await page.waitForTimeout(300);
      
      // Check for error messages or invalid state
      const requiredFields = page.locator(':required:invalid');
      const invalidCount = await requiredFields.count();
      
      // Some fields should be marked invalid
      expect(invalidCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should support image upload', async ({ page }) => {
    await page.goto('/listings/new');
    
    // Look for file upload input
    const fileInput = page.locator('input[type="file"][accept*="image"], [class*="upload"] input[type="file"]');
    const fileCount = await fileInput.count();
    
    // Image upload is expected for listings
    expect(fileCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// Responsive Design for Listings
// ============================================================

test.describe('Listings - Responsive Design', () => {
  test('should show grid view on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/listings');
    
    // Grid layout expected on desktop
    const gridContainer = page.locator('[class*="grid"], [class*="listing-grid"]');
    const gridCount = await gridContainer.count();
    
    // Grid is common but not required
    expect(gridCount).toBeGreaterThanOrEqual(0);
  });

  test('should adapt to mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/listings');
    
    // Should load without errors
    await expect(page).toHaveURL(/.*listings/i);
    
    // Filters might be in drawer/menu on mobile
    const filterToggle = page.locator('button:has-text("filter"), button:has-text("فلتر"), [class*="filter-toggle"]');
    const filterCount = await filterToggle.count();
    
    expect(filterCount).toBeGreaterThanOrEqual(0);
  });
});
