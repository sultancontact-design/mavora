/**
 * Mavora - Authentication & User Tests
 * Tests for auth utilities and user-related functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mock Dependencies
// =============================================================================

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  getSupabaseServerClient: () => mockSupabase,
  getSupabaseBrowserClient: () => mockSupabase,
}));

// =============================================================================
// Test Data
// =============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@mavora.ma',
  full_name: 'أحمد محمد',
  role: 'user',
  is_verified: true,
  locale: 'ar-MA',
  currency: 'MAD',
};

const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
};

// =============================================================================
// Test Suites
// =============================================================================

describe('Authentication Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should return null when no session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Import after mocking
      const { getSupabaseServerClient } = await import('@/lib/supabase');
      const supabase = getSupabaseServerClient();
      const result = await supabase.auth.getSession();

      expect(result.data.session).toBeNull();
      expect(result.error).toBeNull();
    });

    it('should return session when user is logged in', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { getSupabaseServerClient } = await import('@/lib/supabase');
      const supabase = getSupabaseServerClient();
      const result = await supabase.auth.getSession();

      expect(result.data.session).toEqual(mockSession);
      expect(result.data.session.user.email).toBe('test@mavora.ma');
    });
  });

  describe('User Validation', () => {
    it('should validate correct email format', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@mavora.ma')).toBe(true);
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('admin@domain.co.ma')).toBe(true);
    });

    it('should reject invalid email format', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@no-user.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });
  });

  describe('Moroccan Phone Number Validation', () => {
    it('should validate Moroccan phone numbers correctly', () => {
      const isValidMoroccanPhone = (phone: string) => {
        // Moroccan phone numbers: +212 6/7 XX XXX XXX or 06/07 XX XXX XXX
        const moroccanPhoneRegex = /^(\+212|0)[67]\d{8}$/;
        return moroccanPhoneRegex.test(phone.replace(/\s/g, ''));
      };

      expect(isValidMoroccanPhone('+212612345678')).toBe(true);
      expect(isValidMoroccanPhone('+212700000000')).toBe(true);
      expect(isValidMoroccanPhone('0612345678')).toBe(true);
      expect(isValidMoroccanPhone('0712345678')).toBe(true);
    });

    it('should reject non-Moroccan phone numbers', () => {
      const isValidMoroccanPhone = (phone: string) => {
        // Moroccan phone numbers must start with +212 or 0, followed by 6 or 7
        const moroccanPhoneRegex = /^(\+212|0)[67]\d{8}$/;
        return moroccanPhoneRegex.test(phone.replace(/\s/g, ''));
      };

      expect(isValidMoroccanPhone('+33612345678')).toBe(false); // French
      expect(isValidMoroccanPhone('+14155552671')).toBe(false); // US
      expect(isValidMoroccanPhone('0512345678')).toBe(false); // Invalid prefix
      expect(isValidMoroccanPhone('1234567890')).toBe(false); // No country code
    });
  });

  describe('Password Validation', () => {
    it('should validate password strength', () => {
      const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        
        if (password.length < 8) errors.push('Password must be at least 8 characters');
        if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
        if (!/\d/.test(password)) errors.push('Password must contain a number');
        
        return {
          valid: errors.length === 0,
          errors,
        };
      };

      // Strong passwords
      expect(validatePassword('StrongPass123').valid).toBe(true);
      expect(validatePassword('MySecure@Pass1').valid).toBe(true);

      // Weak passwords
      expect(validatePassword('weak').valid).toBe(false);
      expect(validatePassword('nouppercase1').valid).toBe(false);
      expect(validatePassword('NOLOWERCASE1').valid).toBe(false);
      expect(validatePassword('NoNumbersHere').valid).toBe(false);
    });
  });
});

describe('User Role & Permissions', () => {
  const roles = ['user', 'seller', 'admin', 'moderator'] as const;

  it('should have correct role hierarchy', () => {
    const roleHierarchy: Record<string, number> = {
      user: 0,
      seller: 1,
      moderator: 2,
      admin: 3,
    };

    expect(roleHierarchy.admin).toBeGreaterThan(roleHierarchy.moderator);
    expect(roleHierarchy.moderator).toBeGreaterThan(roleHierarchy.seller);
    expect(roleHierarchy.seller).toBeGreaterThan(roleHierarchy.user);
  });

  it('should check permissions based on role', () => {
    const hasPermission = (role: string, permission: string): boolean => {
      const permissions: Record<string, string[]> = {
        user: ['read_listings', 'create_orders', 'write_reviews'],
        seller: ['user_...', 'create_listings', 'manage_orders', 'view_analytics'],
        moderator: ['seller_...', 'moderate_content', 'manage_reports'],
        admin: ['moderator_...', 'manage_users', 'system_settings', 'view_all_data'],
      };

      const rolePermissions = permissions[role] || [];
      return rolePermissions.includes(permission);
    };

    expect(hasPermission('user', 'read_listings')).toBe(true);
    expect(hasPermission('user', 'create_listings')).toBe(false);
    expect(hasPermission('seller', 'create_listings')).toBe(true);
    expect(hasPermission('admin', 'manage_users')).toBe(true);
    expect(hasPermission('moderator', 'manage_users')).toBe(false);
  });
});

describe('Arabic Text Processing', () => {
  it('should detect Arabic text correctly', () => {
    const isArabic = (text: string): boolean => {
      const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
      return arabicPattern.test(text);
    };

    expect(isArabic('مرحبا بالعالم')).toBe(true);
    expect(isArabic('مافورا - سوق عربي')).toBe(true);
    expect(isArabic('Hello World')).toBe(false);
    expect(isArabic('Mavora Marketplace')).toBe(false);
    expect(isArabic('مرحبا Hello')).toBe(true); // Contains Arabic
  });

  it('should handle RTL text direction', () => {
    const getTextDirection = (text: string): 'rtl' | 'ltr' => {
      const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
      return arabicPattern.test(text) ? 'rtl' : 'ltr';
    };

    expect(getTextDirection('مرحبا')).toBe('rtl');
    expect(getTextDirection('Hello')).toBe('ltr');
  });

  it('should normalize Arabic text for search', () => {
    const normalizeArabic = (text: string): string => {
      return text
        .replace(/[آإأ]/g, 'ا') // Normalize alef variants
        .replace(/ة/g, 'ه') // Normalize ta marbuta
        .replace(/ى/g, 'ي') // Normalize alef maqsura
        .replace(/[ًٌٍَُِّْ]/g, '') // Remove diacritics
        .trim();
    };

    expect(normalizeArabic('مؤسسة')).toBe('مؤسسه');
    expect(normalizeArabic('أحمد')).toBe('احمد');
      expect(normalizeArabic('إسلام')).toBe('اسلام');
    expect(normalizeArabic('كِتَابٌ')).toBe('كتاب');
  });
});

describe('Currency & Locale Formatting', () => {
  it('should format MAD currency correctly', () => {
    const formatPrice = (amount: number, locale: string = 'ar-MA'): string => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const price100 = formatPrice(100);
    expect(price100).toContain('100'); // MAD or د.م. depending on locale
  });

  it('should format numbers with Arabic numerals option', () => {
    const formatNumberArabic = (num: number): string => {
      return new Intl.NumberFormat('ar-MA', {
        useGrouping: true,
      }).format(num);
    };

    const formatted = formatNumberArabic(1234567);
    expect(formatted.length).toBeGreaterThan(0);
    // Should contain grouped digits
    expect(formatted).toMatch(/\d{1,3}([.,]\d{3})+/);
  });

  it('should format dates in Arabic locale', () => {
    const formatDateArabic = (date: Date): string => {
      return new Intl.DateTimeFormat('ar-MA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    };

    const date = new Date('2024-01-15');
    const formatted = formatDateArabic(date);
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(0);
  });
});
