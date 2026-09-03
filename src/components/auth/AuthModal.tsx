'use client';

import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';

// ============================================================
// Schemas
// ============================================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormData = z.infer<typeof loginSchema>;

const signupSchema = z
  .object({
    display_name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwords_mismatch',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

// ============================================================
// Password Strength
// ============================================================

function getPasswordStrength(password: string): {
  score: number; // 0-4
  labelKey: string;
  color: string;
  width: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { labelKey: 'auth.password_weak', color: 'bg-red-500', width: 'w-1/4' },
    { labelKey: 'auth.password_fair', color: 'bg-orange-500', width: 'w-2/4' },
    { labelKey: 'auth.password_good', color: 'bg-yellow-500', width: 'w-3/4' },
    { labelKey: 'auth.password_strong', color: 'bg-emerald', width: 'w-full' },
  ];

  return { score, ...levels[score] };
}

// ============================================================
// Password Input with Toggle
// ============================================================

function PasswordInput({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pe-10 ps-10 ${error ? 'border-destructive' : ''}`}
        autoComplete={show ? 'off' : 'current-password'}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

// ============================================================
// Login Form
// ============================================================

function LoginForm({
  onSwitchToSignup,
  onSuccess,
}: {
  onSwitchToSignup: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { setUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(t(data.error) || t('common.error'));
        return;
      }

      setUser(data.user);
      toast.success(t('auth.login_success'));
      onSuccess();
    } catch {
      toast.error(t('auth.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">{t('auth.email')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    className="ps-10"
                    autoComplete="email"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">{t('auth.password')}</FormLabel>
                <button
                  type="button"
                  onClick={() => {
                    toast.info('Password reset will be available soon.');
                  }}
                  className="text-xs text-emerald hover:text-emerald/80 font-medium transition-colors"
                >
                  {t('auth.forgot_password')}
                </button>
              </div>
              <FormControl>
                <PasswordInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="••••••••"
                  error={form.formState.errors.password?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="ms-2">{t('auth.logging_in')}</span>
            </>
          ) : (
            t('common.login')
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.no_account')}{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-emerald hover:text-emerald/80 transition-colors"
          >
            {t('auth.signup_link')}
          </button>
        </p>
      </form>
    </Form>
  );
}

// ============================================================
// Signup Form
// ============================================================

function SignupForm({
  onSwitchToLogin,
  onSuccess,
}: {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { setUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      display_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = form.watch('password');
  const strength = useMemo(
    () => (passwordValue ? getPasswordStrength(passwordValue) : null),
    [passwordValue]
  );

  const onSubmit = async (values: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          display_name: values.display_name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(t(data.error) || t('common.error'));
        return;
      }

      if (data.user) {
        setUser(data.user);
      }
      toast.success(t('auth.signup_success'));
      onSuccess();
    } catch {
      toast.error(t('auth.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">{t('auth.display_name')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('auth.display_name')}
                    className="ps-10"
                    autoComplete="name"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">{t('auth.email')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    className="ps-10"
                    autoComplete="email"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">{t('auth.password')}</FormLabel>
              <FormControl>
                <PasswordInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="••••••••"
                  error={form.formState.errors.password?.message}
                />
              </FormControl>
              {strength && (
                <div className="space-y-1.5 pt-1">
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('auth.password_strength')}: {t(strength.labelKey)}
                  </p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">{t('auth.confirm_password')}</FormLabel>
              <FormControl>
                <PasswordInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="••••••••"
                  error={form.formState.errors.confirmPassword?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald text-emerald-foreground hover:bg-emerald/90 h-11 text-sm font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="ms-2">{t('auth.creating_account')}</span>
            </>
          ) : (
            t('common.signup')
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.has_account')}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-emerald hover:text-emerald/80 transition-colors"
          >
            {t('auth.login_link')}
          </button>
        </p>
      </form>
    </Form>
  );
}

// ============================================================
// Auth Modal (exported)
// ============================================================

export type AuthView = 'login' | 'signup';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
}

export default function AuthModal({ open, onOpenChange, defaultView = 'login' }: AuthModalProps) {
  const { t, locale } = useTranslation();
  const [view, setView] = useState<AuthView>(defaultView);
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Reset to default view when modal opens
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setView(defaultView);
      }
      onOpenChange(nextOpen);
    },
    [defaultView, onOpenChange]
  );

  const handleSuccess = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const isLogin = view === 'login';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Navy header bar */}
        <div className="bg-primary px-6 py-5 text-primary-foreground">
          <DialogHeader className="text-start">
            {isLogin ? (
              <>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="size-5" />
                  {t('auth.welcome_back')}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/70 text-sm mt-1">
                  {t('auth.welcome_subtitle')}
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <User className="size-5" />
                  {t('auth.signup_title')}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/70 text-sm mt-1">
                  {t('auth.create_account_subtitle')}
                </DialogDescription>
              </>
            )}
          </DialogHeader>
        </div>

        {/* Form area */}
        <div className="px-6 py-5">
          {isLogin ? (
            <LoginForm
              onSwitchToSignup={() => setView('signup')}
              onSuccess={handleSuccess}
            />
          ) : (
            <SignupForm
              onSwitchToLogin={() => setView('login')}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
