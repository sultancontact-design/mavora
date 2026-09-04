/**
 * React Hook: useTwoFactorAuth
 * Hook for 2FA operations
 * 
 * @module hooks/useTwoFactorAuth
 */

'use client';

import { useState, useCallback } from 'react';
import { TwoFactorType, TOTPSetup, VerificationResult } from '@/lib/auth/2fa';

interface UseTwoFactorAuthOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseTwoFactorAuthReturn {
  // TOTP Setup
  setupTOTP: () => Promise<TOTPSetup | null>;
  
  // Verification
  verifyCode: (params: {
    type: TwoFactorType;
    code: string;
    secret?: string;
    challengeId?: string;
  }) Promise<VerificationResult>;
  
  // Send codes
  sendSMSCode: (phoneNumber: string) => Promise<{ challengeId?: string; error?: string }>;
  sendEmailCode: (email?: string) => Promise<{ challengeId?: string; error?: string }>;
  
  // Status
  checkStatus: () => Promise<boolean>;
  disable2FA: (type: TwoFactorType, code: string) => Promise<boolean>;
  
  // State
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
}

export function useTwoFactorAuth(options: UseTwoFactorAuthOptions = {}): UseTwoFactorAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback((callback?: () => void) => {
    setIsLoading(false);
    setError(null);
    callback?.();
  }, []);

  const handleError = useCallback((err: unknown, callback?: (error: string) => void) => {
    const message = err instanceof Error ? err.message : 'An error occurred';
    setError(message);
    setIsLoading(false);
    callback?.(message);
  }, []);

  // Setup TOTP
  const setupTOTP = useCallback(async (): Promise<TOTPSetup | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa?action=setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'totp' }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to setup 2FA');
      }

      handleSuccess(options.onSuccess);
      return data.data;

    } catch (err) {
      handleError(err, options.onError);
      return null;
    }
  }, [options, handleSuccess, handleError]);

  // Verify code
  const verifyCode = useCallback(async (params: {
    type: TwoFactorType;
    code: string;
    secret?: string;
    challengeId?: string;
  }): Promise<VerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success) {
        handleSuccess(options.onSuccess);
        return {
          success: true,
          token: data.data?.token,
        };
      } else {
        return {
          success: false,
          error: data.error,
          remainingAttempts: data.remainingAttempts,
          cooldownUntil: data.cooldownUntil,
        };
      }
    } catch (err) {
      handleError(err, options.onError);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }, [options, handleSuccess, handleError]);

  // Send SMS code
  const sendSMSCode = useCallback(async (phoneNumber: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa?action=send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sms',
          destination: phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        handleSuccess();
        return { challengeId: data.data.challengeId };
      } else {
        return { error: data.error };
      }
    } catch (err) {
      handleError(err, options.onError);
      return { error: err instanceof Error ? err.message : 'Failed to send code' };
    }
  }, [options, handleSuccess, handleError]);

  // Send email code
  const sendEmailCode = useCallback(async (email?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa?action=send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          destination: email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        handleSuccess();
        return { challengeId: data.data.challengeId };
      } else {
        return { error: data.error };
      }
    } catch (err) {
      handleError(err, options.onError);
      return { error: err instanceof Error ? err.message : 'Failed to send code' };
    }
  }, [options, handleSuccess, handleError]);

  // Check 2FA status
  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/2fa');
      const data = await response.json();
      return data.data?.enabled || false;
    } catch {
      return false;
    }
  }, []);

  // Disable 2FA
  const disable2FA = useCallback(async (type: TwoFactorType, code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa?action=disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, verificationCode: code }),
      });

      const data = await response.json();

      if (data.success) {
        handleSuccess(options.onSuccess);
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      handleError(err, options.onError);
      return false;
    }
  }, [options, handleSuccess, handleError]);

  const resetError = useCallback(() => setError(null), []);

  return {
    setupTOTP,
    verifyCode,
    sendSMSCode,
    sendEmailCode,
    checkStatus,
    disable2FA,
    isLoading,
    error,
    resetError,
  };
}

export default useTwoFactorAuth;
