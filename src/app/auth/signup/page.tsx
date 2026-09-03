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
import { Loader2, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';

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
          display_name: formData.displayName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('auth.signup_failed'));
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <MavoraLogo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {t('auth.create_account')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('auth.join_mavora')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Display Name Field */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                {t('auth.display_name')}
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder={t('auth.display_name_placeholder')}
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                disabled={isLoading}
                className="h-11"
                autoComplete="name"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isLoading}
                className="h-11"
                autoComplete="email"
                dir="ltr"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password_placeholder')}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={isLoading}
                  className="h-11 pe-10"
                  autoComplete="new-password"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1/2 -translate-y-1/2 size-8 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4 text-muted-foreground" />
                  ) : (
                    <Eye className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('auth.password_requirements')}
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                {t('auth.confirm_password')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirm_password_placeholder')}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  disabled={isLoading}
                  className="h-11 pe-10"
                  autoComplete="new-password"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1/2 -translate-y-1/2 size-8 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4 text-muted-foreground" />
                  ) : (
                    <Eye className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleChange('agreeToTerms', checked === true)}
                disabled={isLoading}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                {t('auth.agree_to_terms')}{' '}
                <Link href="/terms" className="text-emerald hover:text-emerald/80 underline">
                  {t('auth.terms_of_service')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="/privacy" className="text-emerald hover:text-emerald/80 underline">
                  {t('auth.privacy_policy')}
                </Link>
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald hover:bg-emerald/90 text-white font-semibold text-base shadow-lg shadow-emerald/20 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <UserPlus className="size-4 me-2" />
                  {t('common.signup')}
                </>
              )}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground pt-4">
              {t('auth.already_have_account')}{' '}
              <Link 
                href="/auth/login" 
                className="text-emerald hover:text-emerald/80 font-semibold transition-colors"
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
