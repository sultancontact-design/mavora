'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import MavoraLogo from '@/components/common/MavoraLogo';
import { Loader2, Eye, EyeOff, ArrowRight, UserPlus, Sparkles, Shield } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setUser } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.email || !formData.password || !formData.displayName) {
      setError(t('auth.fill_all_fields'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwords_not_match'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('auth.password_too_short'));
      return;
    }

    if (!formData.agreeToTerms) {
      setError(t('auth.accept_terms'));
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          display_name: formData.displayName,
          phone: '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Try to translate error key
        const errorMsg = data.error?.includes('.') ? t(data.error) || data.error : (data.error || t('auth.signup_failed'));
        setError(errorMsg);
        return;
      }

      // Auto login after signup or redirect to login
      if (data.user) {
        setUser(data.user);
        router.push('/');
        router.refresh();
      } else {
        router.push('/auth/login?message=signup_success');
      }
    } catch (err) {
      setError(t('auth.error_occurred'));
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string; width: string } => {
    if (!pwd.length) return { score: 0, label: '', color: '', width: 'w-0' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    
    const levels: { label: string; color: string; width: string }[] = [
      { label: t('auth.password_weak') || 'Weak', color: 'bg-red-500', width: 'w-1/5' },
      { label: t('auth.password_fair') || 'Fair', color: 'bg-orange-500', width: 'w-2/5' },
      { label: t('auth.password_good') || 'Good', color: 'bg-yellow-500', width: 'w-3/5' },
      { label: t('auth.password_strong') || 'Strong', color: 'bg-teal-500', width: 'w-4/5' },
      { label: 'Very Strong', color: 'bg-emerald-500', width: 'w-full' },
    ];
    
    return { score, ...levels[Math.min(score, 4)] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/20 to-amber-50/20 p-4 py-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -end-40 -top-40 size-[600px] rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute -start-40 bottom-1/3 size-[500px] rounded-full bg-teal-400/5 blur-3xl" />
        <div className="absolute top-1/2 end-1/4 size-[400px] rounded-full bg-amber-400/5 blur-3xl" />
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
        <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 px-6 py-8 text-white">
          <div className="absolute top-0 -start-16 -mt-8 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 -end-12 mb-[-2rem] size-32 rounded-full bg-pink-400/20 blur-xl" />
          
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <MavoraLogo size="md" className="text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t('auth.create_account')}
            </CardTitle>
            <CardDescription className="text-base text-white/80 mt-2">
              {t('auth.join_mavora')}
            </CardDescription>
            
            {/* Welcome Badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              100% {t('common.free')}
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

            {/* Display Name Field */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-semibold text-gray-700">
                {t('auth.display_name')}
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <svg className="size-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <Input
                  id="displayName"
                  type="text"
                  placeholder={t('auth.display_name_placeholder') || 'Your name'}
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  disabled={isLoading}
                  className="h-12 ps-11 pe-4 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                {t('auth.email')}
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <svg className="size-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.email_placeholder') || 'name@example.com'}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isLoading}
                  className="h-12 ps-11 pe-4 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                {t('auth.password')}
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <svg className="size-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password_placeholder') || '••••••••'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={isLoading}
                  className="h-12 pe-11 ps-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                  autoComplete="new-password"
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-1.5 pt-1">
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} 
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('auth.password_strength') || 'Password strength'}: {passwordStrength.label}
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-400">
                {t('auth.password_requirements')}
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                {t('auth.confirm_password')}
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <svg className="size-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirm_password_placeholder') || 'Confirm password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  disabled={isLoading}
                  className="h-12 pe-11 ps-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                  autoComplete="new-password"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 size-9 hover:bg-transparent text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4.5" />
                  ) : (
                    <Eye className="size-4.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleChange('agreeToTerms', checked === true)}
                disabled={isLoading}
                className="mt-0.5 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
              />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                {t('auth.agree_to_terms')}{' '}
                <Link href="/terms" className="text-violet-600 hover:text-violet-700 font-medium underline underline-offset-2">
                  {t('auth.terms_of_service')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="/privacy" className="text-violet-600 hover:text-violet-700 font-medium underline underline-offset-2">
                  {t('auth.privacy_policy')}
                </Link>
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white font-semibold text-base shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4.5 animate-spin me-2" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <UserPlus className="size-4.5 me-2" />
                  {t('common.signup')}
                </>
              )}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-500 pt-2">
              {t('auth.already_have_account')}{' '}
              <Link 
                href="/auth/login" 
                className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                {t('common.login')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
