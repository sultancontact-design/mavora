'use client';

/**
 * Not Found (404) Page Component
 * Displayed when a route doesn't exist
 * 
 * @components/NotFound
 */

import React from 'react';
import { SearchX, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NotFoundProps {
  title?: string;
  message?: string;
  showHomeLink?: boolean;
}

export default function NotFound({ 
  title = 'الصفحة غير موجودة',
  message = 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
  showHomeLink = true 
}: NotFoundProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">
            404
          </div>
          
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <SearchX className="w-8 h-8 text-orange-600 dark:text-orange-400" />
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

        {/* Suggestions */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-right space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            قد تبحث عن:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mr-4">
            <li>• صفحة إعلان تم حذفه أو نقله</li>
            <li>• قسم من الأقسام الرئيسية</li>
            <li>• نتائج بحث عن منتج معين</li>
          </ul>
        </div>

        {/* Actions */}
        {showHomeLink && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
            >
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Link>
            
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <SearchX className="w-5 h-5" />
              البحث في الموقع
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
