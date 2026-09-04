'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          setRateLimited(true);
          setError(
            locale === 'ar' 
              ? 'محاولات كثيرة جداً. يرجى المحاولة بعد ساعة.' 
              : 'Too many attempts. Please try again later.'
          );
        } else {
          setError(data.error || 'An error occurred');
        }
        return;
      }

      // Check if rate limited but still returned success
      if (data.rateLimited) {
        setRateLimited(true);
      }

      // Always show success for security (prevent email enumeration)
      setIsSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(
        locale === 'ar' 
          ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' 
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#0E9F6E]/10">
              <CheckCircle2 className="size-8 text-[#0E9F6E]" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {locale === 'ar' ? 'تم إرسال البريد!' : 'Email Sent!'}
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              {locale === 'ar' 
                ? 'إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة مع تعليمات إعادة تعيين كلمة المرور.'
                : 'If this email is registered, you will receive instructions to reset your password.'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t('auth.email') || 'Email'}:</strong> {email}
              </p>
              {rateLimited && (
                <p className="mt-2 text-sm text-amber-600">
                  {locale === 'ar' 
                    ? 'ملاحظة: بسبب محاولات متعددة، قد تستغرق الرسالة وقتاً أطول للوصول.'
                    : 'Note: Due to multiple attempts, the email may take longer to arrive.'
                  }
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• {locale === 'ar' ? 'تحقق من مجلد Spam/البريد المزعج' : 'Check your spam/junk folder'}</p>
              <p>• {locale === 'ar' ? 'الرابط صالح لمدة ساعة واحدة فقط' : 'The link is valid for only 1 hour'}</p>
              <p>• {locale === 'ar' ? 'لم تتلقَ البريد؟ يمكنك المحاولة مرة أخرى بعد دقائق' : "Didn't receive it? You can try again in a few minutes"}</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSubmitted(false);
                setRateLimited(false);
              }}
            >
              {locale === 'ar' ? 'محاولة مرة أخرى' : 'Try Again'}
            </Button>
            
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
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
            <Mail className="size-8 text-[#0E9F6E]" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
          </CardTitle>
          <CardDescription className="mt-2">
            {locale === 'ar'
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
              : 'Enter your email and we\'ll send you a reset link'
            }
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('auth.email') || 'Email'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={locale === 'ar' ? 'example@email.com' : 'example@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                dir="ltr"
                className={locale === 'ar' ? 'text-right' : ''}
              />
            </div>

            {/* Security Note */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {locale === 'ar'
                  ? '🔒 لأسباب أمنية، لن نؤكد إذا كان البريد مسجلاً أم لا. ستصلك رسالة فقط إذا كان الحساب موجوداً.'
                  : '🔒 For security reasons, we won\'t confirm if the email is registered. You\'ll only receive an email if the account exists.'
                }
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-[#0E9F6E] hover:bg-[#0E9F6E]/90"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {locale === 'ar' ? 'جارِ الإرسال...' : 'Sending...'}
                </>
              ) : (
                locale === 'ar' ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'
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
