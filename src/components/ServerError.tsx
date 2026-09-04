'use client';

/**
 * Server Error (500) Page Component
 * Displayed when a server error occurs
 * 
 * @components/ServerError
 */

import React from 'react';
import { ServerCrash, RefreshCw, Home, Support } from 'lucide-react';
import Link from 'next/link';

interface ServerErrorProps {
  error?: Error | null;
  reset?: () => void;
  title?: string;
  message?: string;
}

export default function ServerError({ 
  error,
  reset,
  title = 'خطأ في الخادم',
  message = 'حدث خطأ أثناء معرفة طلبك. نعمل على إصلاح المشكلة.'
}: ServerErrorProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* 500 Illustration */}
        <div className="space-y-4">
          <div className="text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">
            500
          </div>
          
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <ServerCrash className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-right">
            <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-2">
              تفاصيل الخطأ (وضع التطوير):
            </p>
            <pre className="text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-40 whitespace-pre-wrap">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          {reset && (
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              حاول مرة أخرى
            </button>
          )}
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Home className="w-5 h-5" />
            الرئيسية
          </Link>
          
          <Link
            href="/support"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Support className="w-5 h-5" />
            الدعم الفني
          </Link>
        </div>

        {/* Status Link */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          إذا استمرت المشكلة، يرجى{' '}
          <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
            التواصل مع الدعم الفني
          </Link>
        </p>
      </div>
    </div>
  );
}
