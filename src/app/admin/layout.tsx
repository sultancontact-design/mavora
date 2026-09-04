'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { UserRole } from '@/lib/types';

// Allowed roles for admin access
const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'moderator'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (!isLoading) {
      // Check if user has admin role
      if (!user || !ADMIN_ROLES.includes(user.role)) {
        // Redirect to home if not admin
        router.push('/');
        return;
      }
      // isChecking will be set to false when component re-renders with user data
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-amber-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have admin role (as fallback)
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-amber-50/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            الوصول مرفوض
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ليس لديك صلاحية الوصول إلى لوحة التحكم.
            هذه المنطقة مخصصة للمشرفين والمديرين فقط.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // Render the super admin dashboard with full navigation and features
  return <SuperAdminDashboard />;
}
