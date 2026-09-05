'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, Lock, Mail, Eye, EyeOff, LogIn } from 'lucide-react';
import type { UserRole } from '@/lib/types';

// Allowed roles for admin access
const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'moderator'];

// Auth check timeout (5 seconds)
const AUTH_TIMEOUT = 5000;

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

  // Check auth status with timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkAuth = () => {
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
    };

    // Set up timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth check timed out, showing login form');
        setLoading(false); // Force stop loading
        setShowLogin(true);
        setIsChecking(false);
      }
    }, AUTH_TIMEOUT);

    // Initial check
    checkAuth();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isLoading, setLoading]);

  // Handle direct login
  const handleDirectLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword,
          isAdminLogin: true  // Flag for admin login
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Check if user has admin role
        if (ADMIN_ROLES.includes(data.user.role)) {
          setUser(data.user);
          setShowLogin(false);
          setLoginError('');
        } else {
          setLoginError('هذا الحساب ليس لديه صلاحية مدير');
        }
      } else {
        setLoginError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setLoginError('انتهت مهلة الاتصال - يرجى المحاولة مرة أخرى');
      } else {
        setLoginError('حدث خطأ في الاتصال');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoggingIn(false);
    }
  }, [loginEmail, loginPassword, setUser]);

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
                    autoComplete="email"
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
                    autoComplete="current-password"
                    className="w-full pr-11 pl-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
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
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
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

            {/* Back to Home */}
            <button
              onClick={() => router.push('/')}
              className="mt-6 w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the super admin dashboard with full navigation and features
  return <SuperAdminDashboard />;
}
