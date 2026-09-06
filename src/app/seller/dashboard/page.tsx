/**
 * Seller Dashboard Page
 * Advanced analytics and insights for sellers
 * 
 * @module app/seller/dashboard/page
 */

'use client';

import { AdvancedSellerDashboard } from '@/components/seller/AdvancedSellerDashboard';
import { useAuthStore } from '@/stores/auth';

export default function SellerDashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">يجب تسجيل الدخول</h1>
          <p className="text-gray-500">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdvancedSellerDashboard sellerId={user.id} />
    </div>
  );
}
