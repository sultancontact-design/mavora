'use client';

import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
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
// Types
// ============================================================

export type AuthView = 'login' | 'signup' | 'forgot-password' | 'success';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
}

// ============================================================
// Schemas
// ============================================================

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const signupSchema = z
  .object({
    display_name: z.string().min(2).max(50),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password needs a lowercase letter')
      .regex(/[0-9]/, 'Password needs a number'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ============================================================
// Password Strength Calculator
// ============================================================

function getPasswordStrength(password: string): {
  score: number;
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
    { labelKey: 'Weak', color: 'bg-red-500', width: 'w-1/4' },
    { labelKey: 'Fair', color: 'bg-orange-500', width: 'w-2/4' },
    { labelKey: 'Good', color: 'bg-yellow-500', width: 'w-3/4' },
    { labelKey: 'Strong', color: 'bg-teal-500', width: 'w-full' },
  ];

  return { score, ...levels[score] };
}

// ============================================================
// Modern Input Component
// ============================================================

function ModernInput({
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
  icon: Icon,
  showToggle,
  onToggleShow,
  autoComplete,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
  showToggle?: boolean;
  onToggleShow?: () => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const inputType = type === 'password' ? (show ? 'text' : 'password') : type;

  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
          <Icon className={`size-5 text-gray-400 group-focus-within:text-teal-500 transition-colors`} />
        </div>
      )}
      <Input
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          h-12 ${Icon ? 'ps-11' : 'ps-4'} pe-${showToggle || type === 'password' ? '11' : '4'} 
          rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 
          placeholder:text-gray-400 
          focus:border-teal-500 focus:ring-teal-500/20 
          transition-all ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
        `}
        autoComplete={autoComplete}
        dir={type === 'email' ? 'ltr' : undefined}
      />
      {(type === 'password' || showToggle) && (
        <button
          type="button"
          onClick={() => {
            setShow(!show);
            onToggleShow?.();
          }}
          className="absolute end-1.5 top-1/2 -translate-y-1/2 size-9 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      )}
    </div>
  );
}

// ============================================================
// Login Form Component
// ============================================================

function LoginForm({
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onSuccess,
}: {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
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
        // Handle rate limiting specifically
        if (res.status === 429) {
          toast.error(t('auth.too_many_attempts'));
          return;
        }
        
        const errorMsg = data.error?.includes('.') ? t(data.error) || data.error : data.error;
        toast.error(errorMsg || t('common.error'));
        return;
      }

      if (data.user) {
        setUser(data.user);
      }
      
      toast.success(t('auth.login_success') || 'Welcome back!');
      onSuccess();
    } catch {
      toast.error(t('auth.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-700">{t('auth.email')}</FormLabel>
              <FormControl>
                <ModernInput
                  {...field}
                  placeholder="name@example.com"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                />
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
                <FormLabel className="text-sm font-semibold text-gray-700">{t('auth.password')}</FormLabel>
                <button
                  type="button"
                  onClick={onSwitchToForgotPassword}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  {t('auth.forgot_password')}
                </button>
              </div>
              <FormControl>
                <ModernInput
                  {...field}
                  placeholder="••••••••"
                  icon={Lock}
                  type="password"
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 rounded-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4.5 animate-spin" />
              <span className="ms-2">{t('auth.logging_in')}</span>
            </>
          ) : (
            t('common.login')
          )}
        </Button>

        <p className="text-center text-sm text-gray-500">
          {t('auth.no_account')}{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            {t('auth.signup_link')}
          </button>
        </p>
      </form>
    </Form>
  );
}

// ============================================================
// Signup Form Component
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
          confirmPassword: values.confirmPassword,
          display_name: values.display_name,
          phone: '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error?.includes('.') ? t(data.error) || data.error : data.error;
        toast.error(errorMsg || t('common.error'));
        return;
      }

      if (data.user) {
        setUser(data.user);
      }
      
      toast.success(t('auth.signup_success') || 'Account created successfully!');
      onSuccess();
    } catch {
      toast.error(t('auth.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-700">{t('auth.display_name')}</FormLabel>
              <FormControl>
                <ModernInput
                  {...field}
                  placeholder="Your name"
                  icon={User}
                  autoComplete="name"
                />
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
              <FormLabel className="text-sm font-semibold text-gray-700">{t('auth.email')}</FormLabel>
              <FormControl>
                <ModernInput
                  {...field}
                  placeholder="name@example.com"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                />
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
              <FormLabel className="text-sm font-semibold text-gray-700">{t('auth.password')}</FormLabel>
              <FormControl>
                <ModernInput
                  {...field}
                  placeholder="••••••••"
                  icon={Lock}
                  type="password"
                  autoComplete="new-password"
                />
              </FormControl>
              {strength && (
                <div className="space-y-1.5 pt-1">
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Password strength: {strength.labelKey}
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
              <FormLabel className="text-sm font-semibold text-gray-700">{t('auth.confirm_password')}</FormLabel>
              <FormControl>
                <ModernInput
                  {...field}
                  placeholder="••••••••"
                  icon={Lock}
                  type="password"
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 rounded-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4.5 animate-spin" />
              <span className="ms-2">{t('auth.creating_account')}</span>
            </>
          ) : (
            t('common.signup')
          )}
        </Button>

        <p className="text-center text-sm text-gray-500">
          {t('auth.has_account')}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            {t('auth.login_link')}
          </button>
        </p>
      </form>
    </Form>
  );
}

// ============================================================
// Forgot Password Form Component
// ============================================================

function ForgotPasswordForm({
  onBackToLogin,
  onSuccess,
}: {
  onBackToLogin: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok && !data.rateLimited) {
        toast.error(data.error || t('common.error'));
        return;
      }

      // Always show success for security (prevent email enumeration)
      setIsEmailSent(true);
      toast.success(t('auth.reset_email_sent') || 'Check your email for reset link');
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch {
      toast.error(t('auth.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-emerald-100">
          <CheckCircle className="size-7 text-teal-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Check Your Email</h3>
          <p className="text-sm text-gray-500 mt-2">
            We've sent you a password reset link. Please check your inbox.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onBackToLogin}
          className="w-full h-11 rounded-xl border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="size-4 me-2" />
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
          <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-700">{t('auth.email')}</FormLabel>
              <FormControl>
                <ModernInput
                  {...field}
                  placeholder="name@example.com"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 rounded-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4.5 animate-spin" />
              <span className="ms-2">Sending...</span>
            </>
          ) : (
            <>
              <KeyRound className="size-4 me-2" />
              Send Reset Link
            </>
          )}
        </Button>

        <p className="text-center text-sm text-gray-500">
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-semibold text-teal-600 hover:text-teal-700 transition-colors inline-flex items-center"
          >
            <ArrowLeft className="size-4 me-1" />
            Back to Login
          </button>
        </p>
      </form>
    </Form>
  );
}

// ============================================================
// Main Auth Modal Component
// ============================================================

export default function AuthModal({ 
  open, 
  onOpenChange, 
  defaultView = 'login' 
}: AuthModalProps) {
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
  const isSignup = view === 'signup';
  const isForgotPassword = view === 'forgot-password';

  // Gradient based on view
  const getHeaderGradient = () => {
    switch (view) {
      case 'login':
        return 'bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500';
      case 'signup':
        return 'bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500';
      case 'forgot-password':
        return 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500';
      default:
        return 'bg-gradient-to-r from-teal-600 to-emerald-500';
    }
  };

  const getHeaderIcon = () => {
    switch (view) {
      case 'login':
        return ShieldCheck;
      case 'signup':
        return Sparkles;
      case 'forgot-password':
        return KeyRound;
      default:
        return ShieldCheck;
    }
  };

  const HeaderIcon = getHeaderIcon();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl"
        dir={direction}
      >
        {/* Header */}
        <div className={`${getHeaderGradient()} px-6 py-6 text-white relative overflow-hidden`}>
          {/* Decorative elements */}
          <div className="absolute top-0 -end-16 -mt-8 size-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 -start-12 mb-[-1rem] size-24 rounded-full bg-white/10 blur-xl" />
          
          <DialogHeader className="text-start relative">
            <DialogTitle className="text-xl font-bold flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <HeaderIcon className="size-4.5" />
              </div>
              {isLogin && t('auth.welcome_back')}
              {isSignup && t('auth.signup_title') || 'Create Account'}
              {isForgotPassword && (t('auth.forgot_password') || 'Forgot Password?')}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1.5 font-normal">
              {isLogin && (t('auth.welcome_subtitle') || 'Sign in to continue to MAVORA')}
              {isSignup && (t('auth.create_account_subtitle') || 'Join our community today')}
              {isForgotPassword && (t('auth.reset_password_subtitle') || "We'll help you get back in")}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Area */}
        <div className="px-6 py-6 bg-white">
          {isLogin && (
            <LoginForm
              onSwitchToSignup={() => setView('signup')}
              onSwitchToForgotPassword={() => setView('forgot-password')}
              onSuccess={handleSuccess}
            />
          )}

          {isSignup && (
            <SignupForm
              onSwitchToLogin={() => setView('login')}
              onSuccess={handleSuccess}
            />
          )}

          {isForgotPassword && (
            <ForgotPasswordForm
              onBackToLogin={() => setView('login')}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
