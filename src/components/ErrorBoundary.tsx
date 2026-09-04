'use client';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * Displays a fallback UI instead of crashing
 * 
 * @components/ErrorBoundary
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return (
        <Fallback 
          error={this.state.error!} 
          resetError={this.resetError} 
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
function DefaultErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-red-100 dark:border-red-900">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            نعتذر عن هذا الإزعاج. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
          </p>
        </div>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 text-right text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-32">
            {error.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            حاول مرة أخرى
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
export { DefaultErrorFallback };
export type { ErrorBoundaryProps, ErrorBoundaryFallbackProps };
