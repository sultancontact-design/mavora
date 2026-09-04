'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ArrowLeft,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Password strength calculator
function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2)
    return { score: 25, label: 'ضعيفة', color: 'bg-red-500' };
  if (score <= 3)
    return { score: 50, label: 'متوسطة', color: 'bg-amber-500' };
  if (score <= 4)
    return { score: 75, label: 'جيدة', color: 'bg-blue-500' };
  
  return { score: 100, label: 'قوية', color: 'bg-green-500' };
}

// Inner component that uses useSearchParams
function ResetPasswordForm() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);

  // Check for token in URL (Supabase adds this automatically)
  useEffect(() => {
    // The token is managed by Supabase client-side
    // We just need to verify we're on the correct page
    console.log('[Reset Password] Page loaded');
  }, []);

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setError(
        locale === 'ar'
          ? 'كلمتا المرور غير متطابقتين'
          : 'Passwords do not match'
      );
      return;
    }

    if (password.length < 8) {
      setError(
        locale === 'ar'
          ? 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)'
          : 'Password too short (min 8 characters)'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Call the reset password confirm API
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password,
          confirmPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('token') || data.error?.includes('expired')) {
          setTokenError(true);
          setError(
            locale === 'ar'
              ? 'رمز إعادة التعيين منتهي الصلاحية أو غير صالح'
              : 'Reset token is invalid or expired'
          );
        } else {
          setError(data.error || 'An error occurred');
        }
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        locale === 'ar'
          ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (isSuccess) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#0E9F6E]/10">
              <ShieldCheck className="size-8 text-[#0E9F6E]" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {locale === 'ar' ? 'تم تغيير كلمة المرور!' : 'Password Changed!'}
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              {locale === 'ar'
                ? 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمتك الجديدة.'
                : 'Your password has been updated successfully. You can now sign in with your new password.'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">✅ {locale === 'ar' ? 'كلمة المرور جديدة' : 'New Password Set'}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? 'تم تأمين حسابك. تأكد من عدم مشاركة كلمة مرورك مع أي شخص.'
                  : 'Your account is secured. Make sure not to share your password with anyone.'
                }
              </p>
            </div>

            {/* Security Tips */}
            <div className="space-y-2 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">
                {locale === 'ar' ? 'نصائح أمان' : 'Security Tips'}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {locale === 'ar' ? 'استخدم كلمة فريدة لهذا الحساب' : 'Use a unique password for this account'}</li>
                <li>• {locale === 'ar' ? 'فعّل المصادقة ثنائية إذا كانت متاحة' : 'Enable 2FA if available'}</li>
                <li>• {locale === 'ar' ? 'غيّر كلمة المرور بشكل دوري' : 'Change your password periodically'}</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full bg-[#0E9F6E] hover:bg-[#0E9F6E]/90"
              onClick={() => router.push('/auth/login')}
            >
              {locale === 'ar' ? 'تسجيل الدخول الآن' : 'Sign In Now'}
            </Button>

            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              {locale === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#0E9F6E]/10">
            <Lock className="size-8 text-[#0E9F6E]" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {locale === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
          </CardTitle>
          <CardDescription className="mt-2">
            {locale === 'ar'
              ? 'أدخل كلمة المرور الجديدة لحسابك'
              : 'Enter your new password for your account'
            }
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Token Error */}
            {tokenError && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-[#0E9F6E] hover:underline"
                  >
                    {locale === 'ar' ? 'طلب رابط جديد' : 'Request new link'}
                  </Link>
                </div>
              </div>
            )}

            {/* General Error */}
            {error && !tokenError && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={locale === 'ar' ? '••••••••' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  dir="ltr"
                  className={locale === 'ar' ? 'text-right pe-10' : 'ps-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 ${locale === 'ar' ? 'start-3' : 'end-3'} text-muted-foreground hover:text-foreground`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {locale === 'ar' ? 'قوة كلمة المرور' : 'Password Strength'}
                    </span>
                    <span className={strength.color.replace('bg-', 'text-')}>
                      {strength.label}
                    </span>
                  </div>
                  <Progress value={strength.score} className="h-1.5" />
                  
                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <span className={`text-xs flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {password.length >= 8 ? '✓' : '○'} 8+ {locale === 'ar' ? 'أحرف' : 'chars'}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {/[a-z]/.test(password) ? '✓' : '○'} {locale === 'ar' ? 'صغير' : 'lowercase'}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {/[A-Z]/.test(password) ? '✓' : '○'} {locale === 'ar' ? 'كبير' : 'uppercase'}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {/[0-9]/.test(password) ? '✓' : '○'} {locale === 'ar' ? 'رقم' : 'number'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={locale === 'ar' ? '••••••••' : '••••••••'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  dir="ltr"
                  className={locale === 'ar' ? 'text-right pe-10' : 'ps-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 ${locale === 'ar' ? 'start-3' : 'end-3'} text-muted-foreground hover:text-foreground`}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              
              {/* Mismatch Warning */}
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">
                  {locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Security Note */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {locale === 'ar'
                  ? '🔐 استخدم كلمة قوية فريدة لا تستخدمها في حسابات أخرى.'
                  : '🔐 Use a strong, unique password that you don\'t use elsewhere.'}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-[#0E9F6E] hover:bg-[#0E9F6E]/90"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {locale === 'ar' ? 'جارِ التحديث...' : 'Updating...'}
                </>
              ) : (
                locale === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'
              )}
            </Button>

            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0E9F6E]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
