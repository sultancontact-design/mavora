/**
 * React Hook: useCoupons
 * Hook for coupon/discount functionality
 * 
 * @module hooks/useCoupons
 */

'use client';

import { useState, useCallback } from 'react';
import { Coupon, DiscountResult, CartContext } from '@/lib/promotions/coupons';

interface UseCouponsOptions {
  onApplySuccess?: (result: DiscountResult) => void;
  onApplyError?: (error: string) => void;
}

interface UseCouponsReturn {
  applyCoupon: (code: string, cart: CartContext) => Promise<DiscountResult>;
  validateCoupon: (code: string) => Promise<Coupon | null>;
  removeCoupon: () => void;
  appliedCoupon: Coupon | null;
  lastDiscountResult: DiscountResult | null;
  isApplying: boolean;
  error: string | null;
}

export function useCoupons(couponsOptions: UseCouponsOptions = {}): UseCouponsReturn {
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [lastDiscountResult, setLastDiscountResult] = useState<DiscountResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyCoupon = useCallback(async (
    code: string,
    cart: CartContext
  ): Promise<DiscountResult> => {
    setIsApplying(true);
    setError(null);

    try {
      const response = await fetch('/api/promotions/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cart }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply coupon');
      }

      const result: DiscountResult = data;

      if (result.success && result.coupon) {
        setAppliedCoupon(result.coupon);
        couponsOptions.onApplySuccess?.(result);
      } else {
        setError(result.message || 'Invalid coupon');
        couponsOptions.onApplyError?.(result.message || 'Invalid coupon');
      }

      setLastDiscountResult(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply coupon';
      setError(errorMessage);
      couponsOptions.onApplyError?.(errorMessage);
      
      const errorResult: DiscountResult = {
        success: false,
        discountAmount: 0,
        finalAmount: cart.subtotal,
        message: errorMessage,
        errors: ['API_ERROR'],
      };
      setLastDiscountResult(errorResult);
      return errorResult;

    } finally {
      setIsApplying(false);
    }
  }, [couponsOptions]);

  const validateCoupon = useCallback(async (code: string): Promise<Coupon | null> => {
    try {
      const response = await fetch(`/api/promotions/coupons/${encodeURIComponent(code)}`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.success ? data.coupon : null;

    } catch {
      return null;
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setLastDiscountResult(null);
    setError(null);
  }, []);

  return {
    applyCoupon,
    validateCoupon,
    removeCoupon,
    appliedCoupon,
    lastDiscountResult,
    isApplying,
    error,
  };
}

export default useCoupons;
