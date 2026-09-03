'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import AdminDashboard from '@/components/admin/AdminDashboard';
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
      setIsChecking(false);
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have admin role (as fallback)
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don&apos;t have permission to access the admin dashboard.
            This area is restricted to administrators and moderators.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Render the admin dashboard which includes its own layout and navigation
  return <AdminDashboard />;
}
