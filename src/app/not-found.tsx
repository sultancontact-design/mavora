/**
 * Mavora - Custom 404 Not Found Page
 * Arabic Marketplace Platform (Morocco)
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <div className="relative mb-8 inline-block">
          <h1 className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-primary-600 leading-none select-none">
            404
          </h1>
          
          {/* Floating elements */}
          <div className="absolute top-0 left-1/4 w-8 h-8 bg-yellow-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }} />
          <div className="absolute top-1/4 right-1/4 w-6 h-6 bg-green-400 rounded-lg opacity-60 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.5s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-10 h-10 bg-blue-400 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '3s' }} />
          
          {/* Search icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-24 h-24 text-primary-500 opacity-20" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" 
              />
            </svg>
          </div>
        </div>

        {/* Title & Description */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          الصفحة غير موجودة
        </h2>
        
        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
          عذراً، الصفحة التي تبحث عنها قد تم نقلها أو حذفها أو لم تكن موجودة من الأساس.
        </p>

        {/* Search Suggestion */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 max-w-md mx-auto border border-gray-100">
          <p className="text-sm text-gray-500 mb-3">جرب البحث عن ما تريد:</p>
          <Link href="/listings">
            <Button variant="outline" className="w-full justify-start gap-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>تصفح الإعلانات</span>
            </Button>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="bg-gradient-to-l from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 shadow-lg shadow-primary-200">
              🏠 العودة للرئيسية
            </Button>
          </Link>
          
          <Link href="/categories">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 px-8"
            >
              📂 تصفح الفئات
            </Button>
          </Link>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-4">روابط شائعة:</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/listings?category=electronics" className="text-primary-600 hover:text-primary-700 hover:underline">
              إلكترونيات
            </Link>
            <Link href="/listings?category=fashion" className="text-primary-600 hover:text-primary-700 hover:underline">
              أزياء وموضة
            </Link>
            <Link href="/listings?category=vehicles" className="text-primary-600 hover:text-primary-700 hover:underline">
              سيارات
            </Link>
            <Link href="/listings?category=home-garden" className="text-primary-600 hover:text-primary-700 hover:underline">
              منزل وحديقة
            </Link>
            <Link href="/help" className="text-primary-600 hover:text-primary-700 hover:underline">
              مركز المساعدة
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-gray-600">
            هل تحتاج مساعدة؟{' '}
            <Link href="/contact" className="text-primary-600 font-medium hover:underline">
              تواصل معنا
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
