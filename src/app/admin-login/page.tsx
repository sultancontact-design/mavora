'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { Loader2, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';

// Direct Admin Login - Bypasses API for immediate access
// This is a TEMPORARY solution for deployment issues

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [email, setEmail] = useState('mavora@admin.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));

    // Direct credential check (bypasses API)
    const validCredentials = [
      { email: 'mavora@admin.com', password: 'admin123', role: 'super_admin', name: 'مدير مافورا' },
      { email: 'admin@mavora.ma', password: 'Mavora@2024!Admin', role: 'super_admin', name: 'مدير مافورا' },
    ];

    const match = validCredentials.find(
      cred => cred.email.toLowerCase() === email.toLowerCase().trim() && cred.password === password
    );

    if (match) {
      // Set user directly in state and localStorage
      const userData = {
        id: `admin-${Date.now()}`,
        email: match.email,
        display_name: match.name,
        role: match.role,
        is_verified: true,
        is_suspended: false,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      // Update Zustand store
      setUser(userData);
      
      // Also store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('mavora_user', JSON.stringify(userData));
        localStorage.setItem('mavora_auth_token', `direct-admin-${Date.now()}`);
        localStorage.setItem('mavora_login_time', new Date().toISOString());
      }

      // Redirect to admin or home
      router.push('/admin');
      router.refresh();
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/30 mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">مافورا</h1>
          <p className="text-teal-200/80">لوحة تحكم المسؤول</p>
          <p className="text-xs text-amber-400/80 mt-2">⚡ دخول مباشر - وضع الطوارئ</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleDirectLogin} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-teal-100">البريد الإلكتروني</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-teal-400"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-teal-100">كلمة المرور</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-teal-400 pr-12"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-lg shadow-lg shadow-teal-500/30 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جارِ الدخول...
                </>
              ) : (
                <>
                  دخول المسؤول
                  <ArrowRight className="w-5 h-5 mr-2" />
                </>
              )}
            </Button>
          </form>

          {/* Credentials reminder */}
          <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-200/80 text-center">
              بيانات الدخول الافتراضية:
            </p>
            <p className="text-sm text-amber-100 text-center mt-1" dir="ltr">
              mavora@admin.com / admin123
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center space-x-4 text-sm">
          <a href="/auth/login" className="text-teal-300 hover:text-teal-200 transition-colors">
            ← صفحة تسجيل الدخول العادية
          </a>
        </div>
        <div className="mt-2 text-center">
          <a href="/" className="text-white/50 hover:text-white/70 transition-colors text-sm">
            → العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
