/**
 * صفحة البحث المتقدم
 * Advanced Search Page
 * 
 * @features
 * - Full search interface with filters
 * - RTL Arabic layout
 * - Responsive design (mobile/tablet/desktop)
 * - SEO optimized with structured data
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';
import { SearchLoadingSkeleton } from './SearchPageClient';

// ==================== Metadata ====================

export const metadata: Metadata = {
  title: 'ابحث في مافورا | سوق المغرب الرقمي',
  description: 'ابحث عن المنتجات والخدمات في سوق مافورا المغربي. آلاف الإعلانات في جميع الفئات: إلكترونيات، سيارات، عقارات، وأكثر.',
  keywords: ['بحث', 'سوق', 'مغرب', 'شراء', 'بيع', 'إعلانات', 'مافورا'],
  openGraph: {
    title: 'ابحث في مافورا | سوق المغرب الرقمي',
    description: 'ابحث عن أفضل العروض في سوق مافورا المغربي',
    type: 'website',
    locale: 'ar_MA',
    siteName: 'مافورا',
  },
};

// ==================== Page Component ====================

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingSkeleton />}>
      <SearchPageClient />
    </Suspense>
  );
}
