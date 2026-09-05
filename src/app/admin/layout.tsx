'use client';

/**
 * Admin Layout - Professional Authentication Gate
 * Supports: Real auth, Demo mode, Direct bypass
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, Lock, Mail, Eye, EyeOff, LogIn, LayoutDashboard } from 'lucide-react';
import type { UserRole } from '@/lib/types';

// ============================================================
// Configuration
// ============================================================

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'moderator'];

// Demo credentials (for development/preview)
const DEMO_CREDENTIALS = [
  { email: 'mavora@admin.com', password: 'admin123', role: 'super_admin' as UserRole, name: 'مدير مافورا' },
  { email: 'admin@mavora.ma', password: 'Mavora@2024!Admin', role: 'super_admin' as UserRole, name: 'مدير النظام' },
];

// ============================================================
// Main Component
// ============================================================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const router = useRouter();
  
  // UI State
  const [isChecking, setIsChecking] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('mavora@admin.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ============================================================
  // Auth Check Logic
  // ============================================================

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkAuth = () => {
      // Check 1: User in store with admin role
      if (user && ADMIN_ROLES.includes(user.role)) {
        console.log('[Admin] ✅ User authenticated via store:', user.email);
        setShowLogin(false);
        setIsChecking(false);
        return;
      }

      // Check 2: localStorage (from /admin-login or previous session)
      if (typeof window !== 'undefined') {
        try {
          const storedUser = localStorage.getItem('mavora_user');
          const storedToken = localStorage.getItem('mavora_auth_token');
          
          if (storedUser && storedToken) {
            const parsedUser = JSON.parse(storedUser);
            
            // Validate stored user has admin role
            if (parsedUser && ADMIN_ROLES.includes(parsedUser.role)) {
              console.log('[Admin] ✅ User authenticated via localStorage:', parsedUser.email);
              setUser(parsedUser); // Restore to store
              setShowLogin(false);
              setIsChecking(false);
              return;
            }
          }
        } catch (e) {
          console.warn('[Admin] Failed to parse stored auth:', e);
        }
      }

      // Check 3: Demo mode - auto-login for preview
      if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
        console.log('[Admin] 🔄 Demo mode - showing login form');
        setShowLogin(true);
        setIsChecking(false);
        return;
      }

      // Default: Show login form
      console.log('[Admin] 🔒 No auth found, showing login');
      setShowLogin(true);
      setIsChecking(false);
    };

    // Prevent infinite loading with timeout
    timeoutId = setTimeout(() => {
      if (isLoading || isChecking) {
        console.warn('[Admin] ⏱️ Auth check timed out');
        setLoading(false);
        
        // In production/preview, allow demo access after timeout
        if (process.env.NODE_ENV !== 'production') {
          autoLoginDemo();
        } else {
          setShowLogin(true);
          setIsChecking(false);
        }
      }
    }, 3000); // 3 second timeout

    // Initial check
    if (!isLoading) {
      checkAuth();
    } else {
      // Wait for store to initialize
      const unwatch = useAuthStore.subscribe((state) => {
        if (!state.isLoading) {
          checkAuth();
          unwatch();
        }
      });
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isLoading, setLoading, setUser]);

  // ============================================================
  // Auto-login for demo mode
  // ============================================================

  const autoLoginDemo = useCallback(() => {
    console.log('[Admin] 🚀 Auto-logging in demo admin...');
    
    const demoUser = {
      id: `demo-admin-${Date.now()}`,
      email: 'mavora@admin.com',
      display_name: 'مدير مافورا',
      role: 'super_admin' as UserRole,
      is_verified: true,
      is_suspended: false,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    
    setUser(demoUser);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mavora_user', JSON.stringify(demoUser));
      localStorage.setItem('mavora_auth_token', `demo-${Date.now()}`);
      localStorage.setItem('mavora_login_time', new Date().toISOString());
    }
    
    setShowLogin(false);
    setIsChecking(false);
  }, [setUser]);

  // ============================================================
  // Login Handler
  // ============================================================

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    // Try demo credentials first (works offline)
    const demoMatch = DEMO_CREDENTIALS.find(
      cred => cred.email.toLowerCase() === loginEmail.toLowerCase().trim() && 
              cred.password === loginPassword
    );

    if (demoMatch) {
      console.log('[Admin] ✅ Demo credentials matched');
      
      const userData = {
        id: `demo-${Date.now()}`,
        email: demoMatch.email,
        display_name: demoMatch.name,
        role: demoMatch.role,
        is_verified: true,
        is_suspended: false,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      // Update state
      setUser(userData);
      
      // Persist
      if (typeof window !== 'undefined') {
        localStorage.setItem('mavora_user', JSON.stringify(userData));
        localStorage.setItem('mavora_auth_token', `demo-${Date.now()}`);
        localStorage.setItem('mavora_login_time', new Date().toISOString());
      }

      setShowLogin(false);
      setIsLoggingIn(false);
      return;
    }

    // Try API login
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword,
          isAdminLogin: true 
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.success && data.user) {
        if (ADMIN_ROLES.includes(data.user.role)) {
          setUser(data.user);
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('mavora_user', JSON.stringify(data.user));
            localStorage.setItem('mavora_auth_token', data.session?.access_token || `api-${Date.now()}`);
          }
          
          setShowLogin(false);
        } else {
          setLoginError('هذا الحساب ليس لديه صلاحية مدير');
        }
      } else {
        setLoginError(data.error || 'فشل تسجيل الدخول - جرب: mavora@admin.com / admin123');
      }
    } catch (error) {
      console.error('[Admin] Login error:', error);
      setLoginError('خطأ في الاتصال - جرب بيانات الدخول التجريبية');
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginEmail, loginPassword, setUser]);

  // ============================================================
  // Render States
  // ============================================================

  // Loading state
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-6 mx-auto animate-pulse">
              <LayoutDashboard className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-teal-400 mx-auto" />
          </div>
          <p className="text-gray-300 mt-4 font-medium">جاري تحميل لوحة التحكم...</p>
          <p className="text-gray-500 text-sm mt-2">Mavora Admin Dashboard</p>
        </div>
      </div>
    );
  }

  // Login form state
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl mb-4 shadow-lg shadow-teal-500/30 animate-pulse">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">مافورا</h1>
            <p className="text-gray-400">لوحة تحكم المسؤول</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-amber-300 text-sm">وضع العرض التجريبي</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="inline w-4 h-4 ml-1" />
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="mavora@admin.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  dir="ltr"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock className="inline w-4 h-4 ml-1" />
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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

              {/* Error */}
              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm text-center">{loginError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
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

            {/* Quick Access */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center mb-3">دخل سريع (تجريبي):</p>
              <button
                onClick={autoLoginDemo}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                الدخول التلقائي (بدون كلمة مرور)
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              → الرئيسية
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              تسجيل الدخول العادي ←
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // AUTHENTICATED - Render Dashboard
  // ============================================================
  
  return <SuperAdminDashboard />;
}
