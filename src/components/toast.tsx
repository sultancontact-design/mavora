/**
 * Mavora - Toast Notification System
 * Arabic Marketplace Platform (Morocco)
 * 
 * Beautiful, accessible toast notifications with:
 * - Multiple types (success, error, warning, info)
 * - RTL support
 * - Auto-dismiss with progress bar
 * - Queue management
 * - Customizable positioning
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// =============================================================================
// Types / الأنواع
// =============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms (0 = persistent)
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  createdAt: Date;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  loading: (title: string, message?: string) => string;
}

// =============================================================================
// Default Config / الإعدادات الافتراضية
// =============================================================================

const DEFAULT_DURATION = 5000; // 5 seconds
const MAX_TOASTS = 5;

const TOAST_STYLES: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'bg-green-50',
    icon: '✅',
    border: 'border-green-200',
  },
  error: {
    bg: 'bg-red-50',
    icon: '❌',
    border: 'border-red-200',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: '⚠️',
    border: 'border-amber-200',
  },
  info: {
    bg: 'bg-blue-50',
    icon: 'ℹ️',
    border: 'border-blue-200',
  },
  loading: {
    bg: 'bg-gray-50',
    icon: '⏳',
    border: 'border-gray-200',
  },
};

// =============================================================================
// Context / السياق
// =============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// =============================================================================
// Toast Provider / مزود الإشعارات
// =============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({ children, position = 'top-left' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const addToast = useCallback(
    (toastData: Omit<Toast, 'id' | 'createdAt'>): string => {
      const id = `toast_${++toastCounter.current}_${Date.now()}`;
      const newToast: Toast = {
        ...toastData,
        id,
        createdAt: new Date(),
      };

      setToasts((prev) => {
        // Remove oldest if at max capacity
        const updated = [...prev, newToast];
        if (updated.length > MAX_TOASTS) {
          return updated.slice(-MAX_TOASTS);
        }
        return updated;
      });

      // Auto-dismiss if duration is set
      if (toastData.duration !== 0) {
        setTimeout(() => {
          removeToast(id);
        }, toastData.duration || DEFAULT_DURATION);
      }

      return id;
    },
    [removeToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
    [addToast]
  );

  const loading = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'loading', title, message, duration: 0 }),
    [addToast]
  );

  // Position classes
  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts, success, error, warning, info, loading }}
    >
      {children}
      
      {/* Toast Container */}
      <div
        className={`fixed z-[9999] flex flex-col gap-3 ${positionClasses[position]} max-w-sm w-full pointer-events-none`}
        dir="rtl"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// =============================================================================
// Toast Item Component / مكون الإشعار الفردي
// =============================================================================

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const { bg, icon, border } = TOAST_STYLES[toast.type];
  const [isExiting, setIsExiting] = React.useState(false);
  const [progress, setProgress] = React.useState(100);

  // Animate out before removing
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  // Progress bar animation
  React.useEffect(() => {
    if (toast.duration === 0) return;

    const startTime = Date.now();
    const duration = toast.duration || DEFAULT_DURATION;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  return (
    <div
      className={`
        ${bg} ${border} border rounded-xl shadow-lg p-4 pointer-events-auto
        transform transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}
      `}
      dir="rtl"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-gray-600 text-sm mt-1 leading-relaxed">{toast.message}</p>
          )}

          {/* Action button */}
          {toast.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.action!.onClick();
                handleClose();
              }}
              className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1"
          aria-label="إغلاق"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar (only for auto-dismissing toasts) */}
      {toast.duration !== 0 && (
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ease-linear ${
              toast.type === 'error'
                ? 'bg-red-500'
                : toast.type === 'warning'
                ? 'bg-amber-500'
                : toast.type === 'success'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Hook Variations / تباينات الخطافات
// =============================================================================

/**
 * Hook that returns only the toast functions without context access
 */
export function useToastActions() {
  const { success, error, warning, info, loading } = useToast();
  return { success, error, warning, info, loading };
}

/**
 * Hook for managing async operation toasts
 */
export function useAsyncToast<T>() {
  const { loading, success, error } = useToast();

  const executeAsync = useCallback(
    async (
      operation: () => Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      }
    ): Promise<T | null> => {
      const toastId = loading(messages.loading);

      try {
        const result = await operation();
        success(messages.success);
        return result;
      } catch (err) {
        error(messages.error);
        return null;
      }
    },
    [loading, success, error]
  );

  return { executeAsync };
}

// =============================================================================
// Export Default / التصدير الافتراضي
// =============================================================================

export default ToastProvider;
