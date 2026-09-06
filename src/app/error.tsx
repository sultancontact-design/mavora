'use client';

/**
 * Mavora - Custom Error Page
 * Arabic Marketplace Platform (Morocco)
 * 
 * Displays user-friendly error messages with Arabic RTL support
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// =============================================================================
// Error Types / أنواع الأخطاء
// =============================================================================

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ERROR_MESSAGES: Record<string, { title: string; description: string; icon: string }> = {
  default: {
    title: 'حدث خطأ غير متوقع',
    description: 'نعتذر عن هذا الإزعاج. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.',
    icon: '⚠️',
  },
  400: {
    title: 'طلب غير صالح',
    description: 'الطلب الذي أرسلته غير صحيح. يرجى التحقق من البيانات والمحاولة مرة أخرى.',
    icon: '📝',
  },
  401: {
    title: 'غير مصرح لك',
    description: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة.',
    icon: '🔒',
  },
  403: {
    title: 'ممنوع الوصول',
    description: 'ليس لديك الصلاحية للوصول إلى هذه الصفحة.',
    icon: '🚫',
  },
  404: {
    title: 'الصفحة غير موجودة',
    description: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    icon: '🔍',
  },
  429: {
    title: 'طلبات كثيرة جداً',
    description: 'أرسلت عدداً كبيراً من الطلبات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.',
    icon: '⏱️',
  },
  500: {
    title: 'خطأ في الخادم',
    description: 'حدث خطأ داخلي في الخادم. نعمل على إصلاحه.',
    icon: '🔧',
  },
  502: {
    title: 'البوابة سيئة',
    description: 'الخادم يعمل كصيانة حالياً. يرجى المحاولة لاحقاً.',
    icon: '🔌',
  },
  503: {
    title: 'الخدمة غير متاحة',
    description: 'الخدمة مؤقتاً غير متاحة بسبب صيانة مجدولة.',
    icon: '🛠️',
  },
};

// =============================================================================
// Main Error Component / المكون الرئيسي
// =============================================================================

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('[Mavora Error]', error);
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).mavoraAnalytics) {
      (window as any).mavoraAnalytics.trackError(error);
    }
  }, [error]);

  // Try to determine error type from message or status
  const getErrorType = (): string => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('not found') || message.includes('404')) return '404';
    if (message.includes('unauthorized') || message.includes('401')) return '401';
    if (message.includes('forbidden') || message.includes('403')) return '403';
    if (message.includes('too many') || message.includes('429')) return '429';
    if (message.includes('bad request') || message.includes('400')) return '400';
    
    return 'default';
  };

  const errorType = getErrorType();
  const errorInfo = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.default;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        {/* Error Icon Animation */}
        <div className="mb-8 relative inline-block">
          <div className="text-8xl animate-bounce">{errorInfo.icon}</div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {errorInfo.title}
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {errorInfo.description}
        </p>

        {/* Technical Details (in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-right" dir="ltr">
            <p className="text-sm text-red-800 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3"
          >
            🔄 إعادة المحاولة
          </Button>
          
          <Link href="/">
            <Button
              variant="outline"
              className="border-gray-300 hover:bg-gray-50 px-6 py-3"
            >
              🏠 العودة للرئيسية
            </Button>
          </Link>
        </div>

        {/* Help Links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">هل تحتاج مساعدة؟</p>
          <div className="flex justify-center gap-4 text-sm">
            <Link
              href="/help"
              className="text-primary-600 hover:text-primary-700 hover:underline"
            >
              مركز المساعدة
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/contact"
              className="text-primary-600 hover:text-primary-700 hover:underline"
            >
              اتصل بنا
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-xs text-gray-400">
          {error.digest && `رمز الخطأ: ${error.digest}`}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Specialized Error Components / مكونات أخطاء متخصصة
// =============================================================================

/**
 * Network Error Component
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🌐</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          مشكلة في الاتصال بالإنترنت
        </h2>
        <p className="text-gray-600 mb-6">
          يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.
        </p>
        <Button onClick={onRetry} className="bg-primary-600 hover:bg-primary-700">
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="py-16 text-center" dir="rtl">
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="border-primary-300">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Rate Limit Error Component
 */
export function RateLimitError({ retryAfter }: { retryAfter?: number }) {
  return (
    <div className="max-w-md mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center" dir="rtl">
      <div className="text-5xl mb-4">⏱️</div>
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        انتظر قليلاً
      </h3>
      <p className="text-yellow-700 text-sm mb-4">
        {retryAfter 
          ? `يمكنك المحاولة مرة أخرى بعد ${retryAfter} ثانية`
          : 'أرسلت الكثير من الطلبات. يرجى الانتظار قبل المحاولة مرة أخرى.'
        }
      </p>
      <Button
        variant="outline"
        className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
        onClick={() => window.location.reload()}
      >
        إعادة التحميل
      </Button>
    </div>
  );
}
