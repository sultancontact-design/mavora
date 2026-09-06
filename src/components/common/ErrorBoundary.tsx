'use client';

/**
 * @description Error Boundary Component for Mavora
 * مكون التقاط الأخطاء لمافورا
 * Catches JavaScript errors in child components and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// -------------------------------------------
// Types
// -------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

// -------------------------------------------
// Error Boundary Component
// -------------------------------------------

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
    // Log to console in development
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private async logErrorToService(error: Error, errorInfo: ErrorInfo) {
    try {
      // Send to your error tracking service (Sentry, LogRocket, etc.)
      const errorPayload = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
      };

      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorPayload),
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = `[BUG] ${this.state.error?.message || 'Unknown error'} (${this.state.errorId})`;
    const body = `
## وصف الخطأ

**Error ID:** ${this.state.errorId}
**Message:** ${this.state.error?.message}
**URL:** ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
**Time:** ${new Date().toISOString()}

## خطوات إعادة الإنتاج

1. 
2. 

## لقطة شاشة (اختياري)

## معلومات إضافية

${this.state.error?.stack}
`;

    window.open(
      `https://github.com/yourusername/mavora/issues/new?title=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank'
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback based on level
      switch (this.props.level) {
        case 'page':
          return <PageErrorFallback 
            error={this.state.error} 
            errorId={this.state.errorId}
            onReset={this.handleReset}
            onGoHome={this.handleGoHome}
            onReportBug={this.handleReportBug}
          />;
        case 'section':
          return <SectionErrorFallback onReset={this.handleReset} />;
        case 'component':
        default:
          return <ComponentErrorFallback onReset={this.handleReset} />;
      }
    }

    return this.props.children;
  }
}

// -------------------------------------------
// Fallback Components
// -------------------------------------------

function PageErrorFallback({ 
  error, 
  errorId, 
  onReset, 
  onGoHome, 
  onReportBug 
}: { 
  error: Error | null; 
  errorId: string;
  onReset: () => void; 
  onGoHome: () => void; 
  onReportBug: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          حدث خطأ غير متوقع!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          نعتذر عن هذا الإزعاج. حدث خطأ أثناء تحميل هذه الصفحة.
        </p>
        
        {/* Error ID (for support) */}
        {errorId && (
          <p className="text-xs text-gray-500 mb-6 font-mono">
          رمز الخطأ: {errorId}
          </p>
        )}

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-right" dir="ltr">
            <p className="text-sm text-red-600 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onReset} variant="default">
            <RefreshCw className="w-4 h-4 ml-2" />
            حاول مرة أخرى
          </Button>
          <Button onClick={onGoHome} variant="outline">
            <Home className="w-4 h-4 ml-2" />
            الصفحة الرئيسية
          </Button>
          <Button onClick={onReportBug} variant="ghost" size="sm">
            <Bug className="w-4 h-4 ml-2" />
            بلغ عن المشكلة
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl" dir="rtl">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        فشل تحميل هذا القسم
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        حدث خطأ أثناء تحميل هذا المحتوى
      </p>
      <Button onClick={onReset} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 ml-2" />
        إعادة المحاولة
      </Button>
    </div>
  );
}

function ComponentErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg" dir="rtl">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">
            حدث خطأ في هذا المكون
          </p>
        </div>
        <Button 
          onClick={onReset} 
          variant="ghost" 
          size="sm"
          className="flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// -------------------------------------------
// Higher-Order Component
// -------------------------------------------

function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

// -------------------------------------------
// Exports
// -------------------------------------------

export default ErrorBoundary;
export { PageErrorFallback, SectionErrorFallback, ComponentErrorFallback };
export { withErrorBoundary };
