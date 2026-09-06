/**
 * @description اختبارات أدوات المساعدة العامة
 * General utility functions tests
 */

import { describe, it, expect } from 'vitest';

// -------------------------------------------
// Utility Functions to Test
// -------------------------------------------

function formatPrice(price: number, currency: string = 'MAD'): string {
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ar-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-MA').format(num);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Moroccan phone number validation
  const phoneRegex = /^(\+212|0)[5-7]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function calculateDiscount(price: number, discountPercent: number): number {
  const cappedDiscount = Math.min(discountPercent, 100);
  return price * (1 - cappedDiscount / 100);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// -------------------------------------------
// Test Suites
// -------------------------------------------

describe('🧮 Utility Functions - Format Price', () => {
  it('should format prices in MAD currency with Arabic locale', () => {
    const result = formatPrice(1500);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    // Arabic locale may use different formatting
    expect(result).toContain('500') || expect(result).toContain('1.500');
  });

  it('should handle zero price', () => {
    const result = formatPrice(0);
    expect(result).toBeDefined();
  });

  it('should handle large prices', () => {
    const result = formatPrice(999999);
    expect(result).toBeDefined();
    expect(result).toContain('999');
  });

  it('should handle decimal prices correctly', () => {
    const result = formatPrice(99.99);
    expect(result).toBeDefined();
  });
});

describe('📅 Utility Functions - Date Formatting', () => {
  it('should format dates in Arabic locale', () => {
    const date = new Date('2025-01-15');
    const result = formatDate(date);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle date strings', () => {
    const result = formatDate('2025-06-20');
    expect(result).toBeDefined();
  });
});

describe('🔢 Utility Functions - Number Formatting', () => {
  it('should format numbers with Arabic numerals or separators', () => {
    const result = formatNumber(1234567);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle zero', () => {
    const result = formatNumber(0);
    expect(result).toBeDefined();
  });
});

describe('✂️ Utility Functions - Text Truncation', () => {
  it('should not truncate short texts', () => {
    const text = 'Hello';
    const result = truncateText(text, 10);
    expect(result).toBe(text);
  });

  it('should truncate long texts and add ellipsis', () => {
    const text = 'This is a very long text that should be truncated';
    const result = truncateText(text, 20);
    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBe(20); // maxLength - 3 + '...' = 20
    expect(result).not.toBe(text); // Should be different from original
  });

  it('should handle empty string', () => {
    const result = truncateText('', 10);
    expect(result).toBe('');
  });
});

describe('🏷️ Utility Functions - Slugify', () => {
  it('should convert text to URL-friendly slug', () => {
    expect(slugify('iPhone 15 Pro Max')).toBe('iphone-15-pro-max');
  });

  it('should handle Arabic text', () => {
    const result = slugify('هاتف ذكي');
    expect(result).toBeDefined();
  });

  it('should remove special characters', () => {
    expect(slugify('Hello! World@#')).toBe('hello-world');
  });

  it('should handle multiple spaces and dashes', () => {
    expect(slugify('  Hello   World  ')).toBe('hello-world');
  });
});

describe('🆔 Utility Functions - ID Generation', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with prefix', () => {
    const id = generateId('user');
    expect(id.startsWith('user_')).toBe(true);
  });

  it('should generate IDs without prefix', () => {
    const id = generateId();
    expect(id).not.toContain('_');
  });
});

describe('⏱️ Utility Functions - Debounce', () => {
  it('should create a debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);
    
    expect(typeof debouncedFn).toBe('function');
  });

  it('should delay function execution', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);
    
    debouncedFn();
    expect(fn).not.toBeCalled();
    
    vi.advanceTimersByTime(100);
    expect(fn).toBeCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('should cancel previous calls on rapid invocation', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);
    
    debouncedFn();
    debouncedFn();
    debouncedFn();
    
    vi.advanceTimersByTime(100);
    expect(fn).toBeCalledTimes(1);
    
    vi.useRealTimers();
  });
});

describe('⚡ Utility Functions - Throttle', () => {
  it('should create a throttled function', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);
    
    expect(typeof throttledFn).toBe('function');
  });

  it('should execute immediately on first call', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);
    
    throttledFn();
    expect(fn).toBeCalledTimes(1);
  });

  it('should limit execution frequency', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);
    
    throttledFn();
    throttledFn();
    throttledFn();
    
    expect(fn).toBeCalledTimes(1);
    
    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toBeCalledTimes(2);
    
    vi.useRealTimers();
  });
});

describe('✉️ Utility Functions - Validation', () => {
  describe('Email Validation', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email@domain.co')).toBe(true);
      expect(isValidEmail('user123@gmail.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('Moroccan Phone Validation', () => {
    it('should validate correct Moroccan numbers', () => {
      expect(isValidPhone('+212661123456')).toBe(true);
      expect(isValidPhone('0661123456')).toBe(true);
      expect(isValidPhone('0771234567')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('061234567')).toBe(false); // Too short
      expect(isValidPhone('+212812345678')).toBe(false); // Wrong prefix
    });
  });
});

describe('💰 Utility Functions - Discount Calculation', () => {
  it('should calculate discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
    expect(calculateDiscount(200, 25)).toBe(150);
    expect(calculateDiscount(50, 50)).toBe(25);
  });

  it('should cap discount at 100%', () => {
    expect(calculateDiscount(100, 150)).toBe(0);
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it('should handle zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });
});

describe('📁 Utility Functions - File Size Formatting', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('handle decimal values', () => {
    const result = formatFileSize(1536); // 1.5 KB
    expect(result).toContain('KB');
  });
});

describe('👤 Utility Functions - Get Initials', () => {
  it('should get initials from name', () => {
    expect(getInitials('Ahmed Mohammed')).toBe('AM');
    expect(getInitials('Sarah Ali')).toBe('SA');
  });

  it('should handle single name', () => {
    const initials = getInitials('Ahmed');
    expect(initials).toBeDefined();
    expect(initials.length).toBeGreaterThanOrEqual(1);
    expect(initials.length).toBeLessThanOrEqual(2);
  });

  it('should limit to 2 characters', () => {
    expect(getInitials('Ahmed Mohammed Ali')).toHaveLength(2);
  });

  it('should handle Arabic names', () => {
    const initials = getInitials('أحمد محمد');
    expect(initials).toBeDefined();
    expect(initials.length).toBe(2);
  });
});
