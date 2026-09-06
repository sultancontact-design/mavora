/**
 * API Request Helper Utilities for E2E Tests
 * مساعدات طلبات API للاختبارات
 * 
 * Provides reusable API functions for:
 * - Making authenticated requests
 * - CRUD operations on listings
 * - Messaging operations
 * - Payment operations
 * - Search operations
 */

import { APIRequestContext, Page } from '@playwright/test';

// ============================================================
// Types
// ============================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface ListingFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  search?: string;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date' | 'rating';
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  currency?: string;
  category_id: string;
  condition?: string;
  location?: string;
  images?: string[];
  custom_fields?: Record<string, any>;
}

// ============================================================
// Base API Client
// ============================================================

/**
 * Make a GET request with error handling
 */
export async function apiGet<T = any>(
  request: APIRequestContext,
  endpoint: string,
  options?: {
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
  }
): Promise<ApiResponse<T>> {
  try {
    let url = endpoint;
    
    // Add query parameters
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.set(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }
    
    const response = await request.get(url, {
      headers: options?.headers,
    });
    
    const data = await response.json().catch(() => null);
    
    return {
      success: response.ok(),
      data,
      status: response.status(),
      error: !response.ok() ? (data?.error || `HTTP ${response.status()}`) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Make a POST request with error handling
 */
export async function apiPost<T = any>(
  request: APIRequestContext,
  endpoint: string,
  data?: any,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<ApiResponse<T>> {
  try {
    const response = await request.post(endpoint, {
      data,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const responseData = await response.json().catch(() => null);
    
    return {
      success: response.ok(),
      data: responseData,
      status: response.status(),
      error: !response.ok() ? (responseData?.error || `HTTP ${response.status()}`) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Make a PUT request with error handling
 */
export async function apiPut<T = any>(
  request: APIRequestContext,
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  try {
    const response = await request.put(endpoint, {
      data,
      headers: { 'Content-Type': 'application/json' },
    });
    
    const responseData = await response.json().catch(() => null);
    
    return {
      success: response.ok(),
      data: responseData,
      status: response.status(),
      error: !response.ok() ? (responseData?.error || `HTTP ${response.status()}`) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Make a DELETE request with error handling
 */
export async function apiDelete<T = any>(
  request: APIRequestContext,
  endpoint: string
): Promise<ApiResponse<T>> {
  try {
    const response = await request.delete(endpoint);
    
    const data = await response.json().catch(() => null);
    
    return {
      success: response.ok(),
      data,
      status: response.status(),
      error: !response.ok() ? (data?.error || `HTTP ${response.status()}`) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================================
// Listings API
// ============================================================

/**
 * Fetch listings with optional filters
 */
export async function fetchListings(
  request: APIRequestContext,
  filters?: ListingFilters & PaginationParams
): Promise<ApiResponse> {
  return apiGet(request, '/api/listings', {
    params: filters as Record<string, string | number | boolean>,
  });
}

/**
 * Fetch a single listing by ID
 */
export async function fetchListing(
  request: APIRequestContext,
  listingId: string
): Promise<ApiResponse> {
  return apiGet(request, `/api/listings/${listingId}`);
}

/**
 * Create a new listing (requires auth)
 */
export async function createListing(
  request: APIRequestContext,
  listingData: CreateListingData
): Promise<ApiResponse> {
  return apiPost(request, '/api/listings', listingData);
}

/**
 * Update an existing listing (requires auth)
 */
export async function updateListing(
  request: APIRequestContext,
  listingId: string,
  updates: Partial<CreateListingData>
): Promise<ApiResponse> {
  return apiPut(request, `/api/listings/${listingId}`, updates);
}

/**
 * Delete a listing (requires auth)
 */
export async function deleteListing(
  request: APIRequestContext,
  listingId: string
): Promise<ApiResponse> {
  return apiDelete(request, `/api/listings/${listingId}`);
}

/**
 * Toggle favorite status for a listing
 */
export async function toggleFavorite(
  request: APIRequestContext,
  listingId: string
): Promise<ApiResponse> {
  return apiPost(request, `/api/listings/${listingId}/favorite`);
}

// ============================================================
// Conversations/Messaging API
// ============================================================

/**
 * Fetch user's conversations
 */
export async function fetchConversations(
  request: APIRequestContext
): Promise<ApiResponse> {
  return apiGet(request, '/api/conversations');
}

/**
 * Fetch messages in a conversation
 */
export async function fetchMessages(
  request: APIRequestContext,
  conversationId: string
): Promise<ApiResponse> {
  return apiGet(request, `/api/conversations/${conversationId}/messages`);
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  request: APIRequestContext,
  conversationId: string,
  content: string
): Promise<ApiResponse> {
  return apiPost(request, `/api/conversations/${conversationId}/messages`, {
    content,
  });
}

/**
 * Start a new conversation
 */
export async function startConversation(
  request: APIRequestContext,
  listingId: string,
  initialMessage?: string
): Promise<ApiResponse> {
  return apiPost(request, '/api/conversations', {
    listing_id: listingId,
    message: initialMessage || 'مرحبا، أنا مهتم بهذا الإعلان',
  });
}

/**
 * Mark conversation as read
 */
export async function markConversationRead(
  request: APIRequestContext,
  conversationId: string
): Promise<ApiResponse> {
  return apiPut(request, `/api/conversations/${conversationId}/read`);
}

// ============================================================
// Wallet/Payments API
// ============================================================

/**
 * Fetch wallet balance and info
 */
export async function fetchWallet(
  request: APIRequestContext
): Promise<ApiResponse> {
  return apiGet(request, '/api/wallet');
}

/**
 * Fetch transaction history
 */
export async function fetchTransactions(
  request: APIRequestContext,
  params?: PaginationParams
): Promise<ApiResponse> {
  return apiGet(request, '/api/wallet/transactions', {
    params: params as Record<string, string | number | boolean>,
  });
}

/**
 * Initiate a payment (PayPal sandbox)
 */
export async function initiatePayment(
  request: APIRequestContext,
  amount: number,
  listingId?: string
): Promise<ApiResponse> {
  return apiPost(request, '/api/payments/checkout', {
    amount,
    currency: 'MAD',
    provider: 'paypal',
    listing_id: listingId,
  });
}

/**
 * Apply coupon code
 */
export async function applyCoupon(
  request: APIRequestContext,
  code: string
): Promise<ApiResponse> {
  return apiPost(request, '/api/promotions/coupons/validate', { code });
}

// ============================================================
// Search API
// ============================================================

/**
 * Perform search with Arabic text support
 */
export async function searchListings(
  request: APIRequestContext,
  query: string,
  filters?: ListingFilters & PaginationParams
): Promise<ApiResponse> {
  return apiGet(request, '/api/search', {
    params: {
      q: query,
      ...filters,
    } as Record<string, string | number | boolean>,
  });
}

/**
 * Get search suggestions/autocomplete
 */
export async function getSearchSuggestions(
  request: APIRequestContext,
  query: string
): Promise<ApiResponse> {
  return apiGet(request, '/api/search/suggestions', {
    params: { q: query },
  });
}

// ============================================================
// Categories API
// ============================================================

/**
 * Fetch all categories
 */
export async function fetchCategories(
  request: APIRequestContext
): Promise<ApiResponse> {
  return apiGet(request, '/api/categories');
}

/**
 * Fetch category by slug
 */
export async function fetchCategoryBySlug(
  request: APIRequestContext,
  slug: string
): Promise<ApiResponse> {
  return apiGet(request, `/api/categories/${slug}`);
}

// ============================================================
// User Profile API
// ============================================================

/**
 * Fetch current user profile
 */
export async function fetchProfile(
  request: APIRequestContext
): Promise<ApiResponse> {
  return apiGet(request, '/api/auth/profile');
}

/**
 * Update user profile
 */
export async function updateProfile(
  request: APIRequestContext,
  updates: {
    display_name?: string;
    phone?: string;
    bio?: string;
  }
): Promise<ApiResponse> {
  return apiPut(request, '/api/auth/profile', updates);
}

// ============================================================
// Favorites API
// ============================================================

/**
 * Fetch user's favorites
 */
export async function fetchFavorites(
  request: APIRequestContext,
  params?: PaginationParams
): Promise<ApiResponse> {
  return apiGet(request, '/api/favorites', {
    params: params as Record<string, string | number | boolean>,
  });
}

// ============================================================
// Notifications API
// ============================================================

/**
 * Fetch notifications
 */
export async function fetchNotifications(
  request: APIRequestContext
): Promise<ApiResponse> {
  return apiGet(request, '/api/notifications');
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  request: APIRequestContext,
  notificationId: string
): Promise<ApiResponse> {
  return apiPut(request, `/api/notifications/${notificationId}`);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(
  request: APIRequestContext
): Promise<ApiResponse> {
  return apiPut(request, '/api/notifications/read-all');
}

// ============================================================
// Health Check / Status
// ============================================================

/**
 * Check API health/status
 */
export async function healthCheck(
  request: APIRequestContext
): Promise<ApiResponse> {
  return apiGet(request, '/api/health');
}

// ============================================================
// Page-level API Helpers (using browser context)
// ============================================================

/**
 * Execute API call from page context (uses browser cookies/auth)
 */
async function pageApiCall(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<any> {
  return page.evaluate(
    async ({ method, endpoint, data }) => {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      };
      
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(endpoint, options);
      return response.json();
    },
    { method, endpoint, data }
  );
}

/**
 * Get auth state from page
 */
export async function getAuthState(page: Page): Promise<{ user: any | null; isAuthenticated: boolean }> {
  return page.evaluate(async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await response.json();
      return {
        user: data.user || null,
        isAuthenticated: !!data.user,
      };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  });
}

// ============================================================
// Export default object
// ============================================================

export const apiHelpers = {
  // Base methods
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  
  // Listings
  fetchListings,
  fetchListing,
  createListing,
  updateListing,
  deleteListing,
  toggleFavorite,
  
  // Messaging
  fetchConversations,
  fetchMessages,
  sendMessage,
  startConversation,
  markConversationRead,
  
  // Wallet/Payments
  fetchWallet,
  fetchTransactions,
  initiatePayment,
  applyCoupon,
  
  // Search
  searchListings,
  getSearchSuggestions,
  
  // Categories
  fetchCategories,
  fetchCategoryBySlug,
  
  // User
  fetchProfile,
  updateProfile,
  fetchFavorites,
  
  // Notifications
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  
  // Health
  healthCheck,
  
  // Page helpers
  getAuthState,
};

export default apiHelpers;
