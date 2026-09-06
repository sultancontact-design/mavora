/**
 * Mavora - Error Boundary Component
 * Arabic Marketplace Platform (Morocco)
 * 
 * Catches JavaScript errors in child components and displays a fallback UI
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// =============================================================================
// Types / الأنواع
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom error message in Arabic */
  errorMessage?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show home button */
  showHome?: boolean;
  /** Additional CSS class name */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

// =============================================================================
// Error Boundary Component / مكون حدود الخطأ
// =============================================================================

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to logging service if available
    if (typeof window !== 'undefined' && (window as any).mavoraLogger) {
      (window as any).mavoraLogger.error('React Error Boundary caught error', {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        retryCount: this.retryCount,
      }, error);
    }
  }

  handleReset = () => {
    this.retryCount++;
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
    });
  };

  canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  render() {
    const { 
      children, 
      fallback, 
      errorMessage = 'حدث خطأ غير متوقع',
      showRetry = true,
      showHome = true,
      className = '',
    } = this.props;

    // If no error, render children normally
    if (!this.state.hasError) {
      return children;
    }

    // If custom fallback is provided, use it
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(this.state.error!, this.handleReset);
      }
      return <>{fallback}</>;
    }

    // Default error UI
    return (
      <div 
        className={`min-h-[300px] flex items-center justify-center p-6 ${className}`}
        dir="rtl"
      >
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Error Icon */}
          <div className="mb-6 relative inline-block">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            {/* Pulse animation */}
            <div className="absolute inset-0 w-20 h-20 bg-red-200 rounded-full opacity-30 animate-ping mx-auto" />
          </div>

          {/* Error Message */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {errorMessage}
          </h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            نعتذر عن هذا الإزعاج. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
          </p>

          {/* Error ID (for support) */}
          {this.state.errorId && (
            <p className="text-xs text-gray-400 mb-6 font-mono" dir="ltr">
              رمز الخطأ: {this.state.errorId}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && this.canRetry() && (
              <Button
                onClick={this.handleReset}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6"
              >
                🔄 إعادة المحاولة ({this.maxRetries - this.retryCount} متبقي)
              </Button>
            )}
            
            {showHome && (
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 px-6"
                >
                  🏠 العودة للرئيسية
                </Button>
              </Link>
            )}
          </div>

          {/* Retry exhausted message */}
          {!this.canRetry() && (
            <p className="mt-4 text-sm text-amber-600">
              تم استهلاك جميع محاولات إعادة التحميل. يرجى تحديث الصفحة.
            </p>
          )}

          {/* Contact Support */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              هل المشكلة مستمرة؟{' '}
              <Link href="/contact" className="text-primary-600 hover:underline font-medium">
                اتصل بالدعم الفني
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

// =============================================================================
// Higher-Order Component / مكون رتيب أعلى
// =============================================================================

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundary;
}

// =============================================================================
// Hook for Error Handling / خطاف معالجة الأخطاء
// =============================================================================

import { useState, useCallback } from 'react';

/**
 * Hook to catch async errors in components
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const captureError = useCallback((error: Error) => {
    console.error('[useErrorHandler] Captured error:', error);
    setError(error);
    
    // Log to external service if available
    if (typeof window !== 'undefined' && (window as any).mavoraLogger) {
      (window as any).mavoraLogger.error('Async error captured by hook', {}, error);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { error, captureError, resetError };
}

// =============================================================================
// Pre-configured Error Boundaries / حدود أخطاء معدة مسبقاً
// =============================================================================

/**
 * Error boundary for listing cards
 */
export function ListingCardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      errorMessage="فشل تحميل الإعلان"
      showRetry={true}
      showHome={false}
      fallback={(error, reset) => (
        <div className="bg-white rounded-lg shadow-sm p-4 text-center" dir="rtl">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-gray-600 text-sm mb-3">فشل تحميل الإعلان</p>
          <Button size="sm" variant="outline" onClick={reset}>
            إعادة المحاولة
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for user profile
 */
export function UserProfileErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      errorMessage="فشل تحميل الملف الشخصي"
      fallback={(error, reset) => (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center" dir="rtl">
          <div className="text-5xl mb-3">👤</div>
          <p className="text-gray-700 font-medium mb-2">فشل تحميل الملف الشخصي</p>
          <p className="text-gray-500 text-sm mb-4">يرجى المحاولة مرة أخرى</p>
          <Button onClick={reset} size="sm">
            إعادة التحميل
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for chat/messages
 */
export function ChatErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      errorMessage="مشكلة في الدردشة"
      fallback={(error, reset) => (
        <div className="flex-1 flex items-center justify-center bg-gray-50" dir="rtl">
          <div className="text-center p-6">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-700 font-medium mb-2">مشكلة في تحميل الرسائل</p>
            <Button onClick={reset} size="sm" variant="outline">
              إعادة الاتصال
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// =============================================================================
// Export Default / التصدير الافتراضي
// =============================================================================

export default ErrorBoundary;
