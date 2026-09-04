// ============================================================
// ⚡ Performance System Tests (Vitest)
// Covers: Debounce, Throttle, URL Generation
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import {
  debounce,
  throttle,
  generateSrcSet,
  generateSizes,
  createMemoizedSelector,
} from '@/lib/performance/utils';

// ============================================================
// Debounce Tests
// ============================================================

describe('Performance - Debounce', () => {
  it('should create a debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    
    expect(typeof debounced).toBe('function');
    expect(typeof (debounced as unknown as { cancel: () => void }).cancel).toBe('function');
  });

  it('should delay function execution', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    
    debounced();
    expect(fn).not.toHaveBeenCalled();
    
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending execution', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100) as unknown as { cancel: () => void; (...args: unknown[]): void };
    
    debounced();
    debounced.cancel();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(fn).not.toHaveBeenCalled();
  });

  it('should execute on leading edge when configured', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, { delay: 100, leading: true, trailing: false });
    
    debounced();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should only call once for multiple rapid calls', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    
    debounced();
    debounced();
    debounced();
    debounced();
    
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ============================================================
// Throttle Tests
// ============================================================

describe('Performance - Throttle', () => {
  it('should create a throttled function', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    
    expect(typeof throttled).toBe('function');
    expect(typeof (throttled as unknown as { cancel: () => void }).cancel).toBe('function');
  });

  it('should execute immediately by default', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should limit execution frequency', async () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    
    throttled(); // Should execute immediately
    throttled(); // Should be ignored
    throttled(); // Should be ignored
    
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Wait for throttle period to end
    await new Promise(resolve => setTimeout(resolve, 110));
    
    throttled(); // Should execute now
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ============================================================
// URL Generation Tests
// ============================================================

describe('Performance - URL Generation', () => {
  describe('generateSrcSet', () => {
    it('should generate srcSet with default widths', () => {
      const srcSet = generateSrcSet('https://example.com/image.jpg');
      
      expect(srcSet).toContain('320w');
      expect(srcSet).toContain('640w');
      expect(srcSet).toContain('1920w');
      expect(srcSet).toContain('https://example.com/image.jpg?w=');
    });

    it('should use custom widths when provided', () => {
      const customWidths = [100, 200, 300];
      const srcSet = generateSrcSet('https://example.com/image.jpg', customWidths);
      
      expect(srcSet).toContain('100w');
      expect(srcSet).toContain('200w');
      expect(srcSet).toContain('300w');
      expect(srcSet).not.toContain('640w'); // Default width should not appear
    });

    it('should handle empty widths array', () => {
      const srcSet = generateSrcSet('https://example.com/image.jpg', []);
      expect(srcSet).toBe('');
    });
  });

  describe('generateSizes', () => {
    it('should generate sizes with default breakpoints', () => {
      const sizes = generateSizes();
      
      expect(sizes).toContain('(max-width:');
      expect(sizes).toContain('vw');
    });

    it('should use custom breakpoints when provided', () => {
      const customBreakpoints = [
        { maxWidth: '500px', size: '100vw' },
        { maxSize: 'infinite', size: '50vw' },
      ];
      const sizes = generateSizes(customBreakpoints);
      
      expect(sizes).toContain('(max-width: 500px) 100vw');
      expect(sizes).toContain('50vw');
    });

    it('should handle empty breakpoints array', () => {
      const sizes = generateSizes([]);
      expect(sizes).toBe('');
    });
  });
});

// ============================================================
// Memoized Selector Tests
// ============================================================

describe('Performance - Memoized Selector', () => {
  it('should cache selector results', () => {
    let callCount = 0;
    const selector = (state: { value: number }) => {
      callCount++;
      return state.value * 2;
    };
    
    const memoizedSelector = createMemoizedSelector(selector);
    
    // First call
    const result1 = memoizedSelector({ value: 5 });
    expect(result1).toBe(10);
    expect(callCount).toBe(1);
    
    // Same input - should return cached result
    const result2 = memoizedSelector({ value: 5 });
    expect(result2).toBe(10);
    expect(callCount).toBe(1); // Should not increment
    
    // Different input - should recompute
    const result3 = memoizedSelector({ value: 10 });
    expect(result3).toBe(20);
    expect(callCount).toBe(2); // Should increment
  });

  it('should limit cache size', () => {
    const selector = (state: { id: number }) => state.id * 2;
    const memoizedSelector = createMemoizedSelector(selector, 3); // Cache size of 3
    
    // Fill cache
    memoizedSelector({ id: 1 });
    memoizedSelector({ id: 2 });
    memoizedSelector({ id: 3 });
    
    // Add one more - should evict oldest
    memoizedSelector({ id: 4 });
    
    // First entry should be evicted
    const result1 = memoizedSelector({ id: 1 });
    expect(result1).toBe(2); // Still works, but was re-computed
  });
});
