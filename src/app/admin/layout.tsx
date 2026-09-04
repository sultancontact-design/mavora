'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, Lock, Mail, Eye, EyeOff, LogIn } from 'lucide-react';
import type { UserRole } from '@/lib/types';

// Allowed roles for admin access
const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'moderator'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  // Direct login state
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (!isLoading) {
      // Check if user has admin role
      if (!user || !ADMIN_ROLES.includes(user.role)) {
        // Show direct login form instead of redirecting
        setShowLogin(true);
        setIsChecking(false);
        return;
      }
      setIsChecking(false);
    }
  }, [user, isLoading]);

  // Handle direct login
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword,
          isAdminLogin: true  // Flag for admin login
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Check if user has admin role
        if (ADMIN_ROLES.includes(data.user.role)) {
          setUser(data.user);
          setShowLogin(false);
        } else {
          setLoginError('هذا الحساب ليس لديه صلاحية مدير');
        }
      } else {
        setLoginError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      setLoginError('حدث خطأ في الاتصال');
    } finally {
      setIsLoggingIn(false);
    }
  };

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

  // Show direct login form for admin access
  if (showLogin && (!user || !ADMIN_ROLES.includes(user.role))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">مافورة</h1>
            <p className="text-gray-400">لوحة تحكم المدير</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
            <form onSubmit={handleDirectLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="mavora@admin.com"
                    required
                    className="w-full pr-11 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-11 pl-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm text-center">{loginError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري الدخول...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    دخول إلى لوحة التحكم
                  </>
                )}
              </button>
            </form>

            {/* Quick Access Info */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center mb-3">
                بيانات الدخول السريعة للحساب الجديد:
              </p>
              <div className="bg-black/20 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">البريد:</span>
                  <code className="text-violet-400 text-sm" dir="ltr">mavora@admin.com</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">كلمة المرور:</span>
                  <code className="text-violet-400 text-sm" dir="ltr">admin123</code>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <button
            onClick={() => router.push('/')}
            className="mt-6 w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  // Render the super admin dashboard with full navigation and features
  return <SuperAdminDashboard />;
}
