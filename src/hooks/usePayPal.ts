/**
 * React Hook: usePayPal
 * Hook for PayPal payment integration
 * 
 * @module hooks/usePayPal
 */

'use client';

import { useState, useCallback } from 'react';

interface PayPalOrder {
  orderId: string;
  approvalUrl: string;
  checkoutUrl: string;
}

interface UsePayPalOptions {
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface UsePayPalReturn {
  createOrder: (params: {
    amount: number;
    currency?: string;
    description?: string;
    orderId: string;
    items?: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) => Promise<PayPalOrder | null>;
  isProcessing: boolean;
  error: string | null;
  resetError: () => void;
}

export function usePayPal(options: UsePayPalOptions = {}): UsePayPalReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (params: {
    amount: number;
    currency?: string;
    description?: string;
    orderId: string;
    items?: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<PayPalOrder | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          currency: params.currency || 'MAD',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }

      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [options.onError]);

  const resetError = useCallback(() => setError(null), []);

  return {
    createOrder,
    isProcessing,
    error,
    resetError,
  };
}

export default usePayPal;
