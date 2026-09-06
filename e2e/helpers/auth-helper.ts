/**
 * Authentication Helper Utilities for E2E Tests
 * مساعدات المصادقة للاختبارات
 * 
 * Provides reusable authentication functions for:
 * - User registration/signup
 * - Login/logout operations
 * - Session management
 * - Password reset flows
 * - 2FA verification (if applicable)
 */

import { Page, APIRequestContext } from '@playwright/test';

// ============================================================
// Types
// ============================================================

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
  id?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: any;
  error?: string;
  sessionToken?: string;
}

// ============================================================
// Test User Factory
// ============================================================

/**
 * Generate a unique test user with timestamp to avoid conflicts
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return {
    email: `test_${timestamp}_${random}@mavora.test`,
    password: 'TestPass123!',
    displayName: `Test User ${timestamp}`,
    ...overrides,
  };
}

/**
 * Create a test user with Arabic name for RTL testing
 */
export function createArabicTestUser(overrides?: Partial<TestUser>): TestUser {
  const timestamp = Date.now();
  return {
    ...createTestUser(overrides),
    displayName: `مستخدم اختبار ${timestamp}`,
  };
}

// ============================================================
// Page-based Authentication Actions
// ============================================================

/**
 * Navigate to login page and fill in credentials
 */
async function navigateToLogin(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Verify we're on login page
  await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
}

/**
 * Fill login form with credentials
 */
export async function fillLoginForm(
  page: Page,
  credentials: AuthCredentials
): Promise<void> {
  // Find email input
  const emailInput = page.locator('#email, input[name="email"], input[type="email"]').first();
  await emailInput.fill(credentials.email);
  
  // Find password input
  const passwordInput = page.locator('#password, input[name="password"], input[type="password"]').first();
  await passwordInput.fill(credentials.password);
}

/**
 * Submit login form
 */
export async function submitLoginForm(page: Page): Promise<void> {
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  
  // Wait for navigation or response
  await page.waitForTimeout(1000);
}

/**
 * Perform complete login flow
 */
export async function login(
  page: Page,
  credentials: AuthCredentials
): Promise<AuthResponse> {
  await navigateToLogin(page);
  await fillLoginForm(page, credentials);
  await submitLoginForm(page);
  
  // Check for errors
  const errorElement = page.locator('[class*="error"], [role="alert"], .text-red-600').first();
  const hasError = await errorElement.count() > 0;
  
  if (hasError) {
    const errorText = await errorElement.textContent();
    return { success: false, error: errorText || 'Unknown error' };
  }
  
  // Check if redirected (success)
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    return { success: true };
  }
  
  return { success: false, error: 'Login did not redirect' };
}

/**
 * Perform logout action
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click logout button/link
  const logoutSelectors = [
    'a[href*="logout"]',
    'button:has-text("خروج")',
    'button:has-text("Logout")',
    'button:has-text("تسجيل الخروج")',
    '[data-testid="logout-button"]',
  ];
  
  for (const selector of logoutSelectors) {
    const element = page.locator(selector).first();
    if (await element.count() > 0) {
      await element.click();
      await page.waitForTimeout(500);
      return;
    }
  }
  
  // Fallback: clear cookies and storage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

// ============================================================
// Signup/Registration Functions
// ============================================================

/**
 * Navigate to signup page
 */
async function navigateToSignup(page: Page): Promise<void> {
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');
}

/**
 * Fill signup form
 */
export async function fillSignupForm(
  page: Page,
  user: TestUser
): Promise<void> {
  // Fill display name
  const nameInput = page.locator('#displayName, input[name="display_name"], input[name="displayName"]').first();
  if (await nameInput.count() > 0) {
    await nameInput.fill(user.displayName);
  }
  
  // Fill email
  const emailInput = page.locator('#email, input[name="email"], input[type="email"]').first();
  await emailInput.fill(user.email);
  
  // Fill password
  const passwordInput = page.locator('#password, input[name="password"], input[type="password"]').first();
  await passwordInput.fill(user.password);
  
  // Fill confirm password
  const confirmPasswordInput = page.locator(
    '#confirmPassword, input[name="confirmPassword"], input[name="password_confirmation"]'
  ).first();
  if (await confirmPasswordInput.count() > 0) {
    await confirmPasswordInput.fill(user.password);
  }
  
  // Accept terms if checkbox exists
  const termsCheckbox = page.locator('input[type="checkbox"][id*="terms"], input[type="checkbox"][id*="agree"]').first();
  if (await termsCheckbox.count() > 0) {
    const isChecked = await termsCheckbox.isChecked();
    if (!isChecked) {
      await termsCheckbox.check();
    }
  }
}

/**
 * Perform complete registration flow
 */
export async function signup(
  page: Page,
  user: TestUser
): Promise<AuthResponse> {
  await navigateToSignup(page);
  await fillSignupForm(page, user);
  
  // Submit form
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  
  // Wait for response
  await page.waitForTimeout(1500);
  
  // Check for errors
  const errorElement = page.locator('[class*="error"], [role="alert"], .text-red-600').first();
  const hasError = await errorElement.count() > 0 && await errorElement.isVisible();
  
  if (hasError) {
    const errorText = await errorElement.textContent();
    return { success: false, error: errorText || 'Registration failed' };
  }
  
  // Success if redirected or showing success message
  const currentUrl = page.url();
  if (!currentUrl.includes('/signup')) {
    return { success: true };
  }
  
  return { success: false, error: 'Registration did not complete' };
}

// ============================================================
// Password Reset Functions
// ============================================================

/**
 * Initiate password reset flow
 */
export async function initiatePasswordReset(
  page: Page,
  email: string
): Promise<{ success: boolean; message?: string }> {
  await page.goto('/auth/forgot-password');
  await page.waitForLoadState('networkidle');
  
  // Fill email
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  await emailInput.fill(email);
  
  // Submit
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  
  await page.waitForTimeout(1000);
  
  // Check for success message (always shown for security)
  const successMessage = page.locator('[class*="success"], [role="status"]:has-text("email" i), [class*="sent"]');
  const hasSuccess = await successMessage.count() > 0;
  
  return { 
    success: hasSuccess,
    message: hasSuccess ? await successMessage.first().textContent() || undefined : undefined 
  };
}

// ============================================================
// API-based Authentication (for faster tests)
// ============================================================

/**
 * Login via API directly
 */
export async function apiLogin(
  request: APIRequestContext,
  credentials: AuthCredentials
): Promise<AuthResponse> {
  try {
    const response = await request.post('/api/auth/login', {
      data: {
        email: credentials.email,
        password: credentials.password,
      },
    });
    
    const data = await response.json();
    
    if (response.ok()) {
      return {
        success: true,
        user: data.user,
        sessionToken: data.sessionToken,
      };
    }
    
    return {
      success: false,
      error: data.error || 'Login failed',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Register via API directly
 */
export async function apiSignup(
  request: APIRequestContext,
  user: TestUser
): Promise<AuthResponse> {
  try {
    const response = await request.post('/api/auth/signup', {
      data: {
        email: user.email,
        password: user.password,
        confirmPassword: user.password,
        display_name: user.displayName,
      },
    });
    
    const data = await response.json();
    
    if (response.ok()) {
      return {
        success: true,
        user: data.user,
      };
    }
    
    return {
      success: false,
      error: data.error || 'Registration failed',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get current authenticated user from session
 */
export async function getCurrentUser(
  request: APIRequestContext
): Promise<any | null> {
  try {
    const response = await request.get('/api/auth/session');
    if (response.ok()) {
      const data = await response.json();
      return data.user || null;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// Session State Helpers
// ============================================================

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for auth indicators in the page
  const authIndicators = [
    'a[href*="profile"]',
    'a[href*="wallet"]',
    'button:has-text("خروج")',
    '[data-testid="user-menu"]',
    '[data-testid="user-avatar"]',
  ];
  
  for (const selector of authIndicators) {
    const element = page.locator(selector).first();
    if (await element.count() > 0 && await element.isVisible()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Wait for authentication state to change
 */
export async function waitForAuthState(
  page: Page,
  expectedState: 'authenticated' | 'unauthenticated',
  timeout: number = 10000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const authed = await isAuthenticated(page);
    if ((expectedState === 'authenticated' && authed) ||
        (expectedState === 'unauthenticated' && !authed)) {
      return;
    }
    await page.waitForTimeout(500);
  }
  
  throw new Error(`Timed out waiting for ${expectedState} state`);
}

// ============================================================
// 2FA Helper Functions (if applicable)
// ============================================================

/**
 * Handle 2FA code input if prompted
 */
export async function handle2FAIfNeeded(
  page: Page,
  code: string = '123456' // Default test code
): Promise<boolean> {
  // Look for 2FA input
  const otpInput = page.locator('input[inputmode="numeric"], input[name="code"], input[name="otp"], [class*="otp"] input').first();
  
  if (await otpInput.count() === 0) {
    return false; // No 2FA prompt
  }
  
  await otpInput.fill(code);
  
  // Submit 2FA
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  
  await page.waitForTimeout(1000);
  return true;
}

// ============================================================
// Export default object for convenience
// ============================================================

export const authHelpers = {
  createTestUser,
  createArabicTestUser,
  login,
  logout,
  signup,
  fillLoginForm,
  fillSignupForm,
  initiatePasswordReset,
  apiLogin,
  apiSignup,
  getCurrentUser,
  isAuthenticated,
  waitForAuthState,
  handle2FAIfNeeded,
};

export default authHelpers;
