'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import MavoraLogo from '@/components/common/MavoraLogo';
import { Loader2, Eye, EyeOff, ArrowRight, Sparkles, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { setUser } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('auth.fill_all_fields'));
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Translate error key if it looks like one
        const errorMsg = data.error?.includes('.') ? t(data.error) || data.error : (data.error || t('auth.login_failed'));
        setError(errorMsg);
        return;
      }

      // Update auth state
      if (data.user) {
        setUser(data.user);
      }
      
      // Redirect to home or profile
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(t('auth.error_occurred'));
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-amber-50/20 p-4 py-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -start-40 -top-40 size-[600px] rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute -end-40 top-1/3 size-[500px] rounded-full bg-amber-400/5 blur-3xl" />
        <div className="absolute bottom-0 start-1/3 size-[400px] rounded-full bg-violet-500/5 blur-3xl" />
        {/* Geometric Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl relative z-10">
        {/* Header Gradient */}
        <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-6 py-8 text-white">
          <div className="absolute top-0 end-0 -mt-8 -me-16 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 -start-12 mb-[-2rem] size-32 rounded-full bg-emerald-400/20 blur-xl" />
          
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <MavoraLogo size="md" className="text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t('auth.welcome_back')}
            </CardTitle>
            <CardDescription className="text-base text-white/80 mt-2">
              {t('auth.login_to_account')}
            </CardDescription>
            
            {/* Trust Badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Shield className="size-3.5" />
              {t('home.secure_platform')}
            </div>
          </div>
        </div>
        
        <CardContent className="pt-8 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3 animate-fade-in">
                <svg className="size-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                {t('auth.email')}
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <svg className="size-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.email_placeholder') || 'name@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12 ps-11 pe-4 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  {t('auth.password')}
                </Label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  {t('auth.forgot_password') || (locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?')}
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <svg className="size-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password_placeholder') || '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 pe-11 ps-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
                  autoComplete="current-password"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 size-9 hover:bg-transparent text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4.5" />
                  ) : (
                    <Eye className="size-4.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-base shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0 rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4.5 animate-spin me-2" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  {t('common.login')}
                  <ArrowRight className="size-4.5 ms-2" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-400 font-medium">
                  {t('auth.or_continue_with')}
                </span>
              </div>
            </div>

            {/* Social Login (Placeholder) */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                disabled
                className="h-11 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
              >
                <svg className="size-4 me-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled
                className="h-11 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
              >
                <svg className="size-4 me-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-500 pt-2">
              {t('auth.no_account')}{' '}
              <Link 
                href="/auth/signup" 
                className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                {t('common.signup')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
