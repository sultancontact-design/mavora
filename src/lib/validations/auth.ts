import { z } from 'zod';

// ============================================================
// Auth Validation Schemas
// Comprehensive validation for all auth operations
// ============================================================

// -------------------------------
// Email Validation
// -------------------------------

const emailSchema = z
  .string()
  .min(1, 'auth.email_required')
  .max(254, 'auth.email_too_long')
  .email('auth.invalid_email')
  // Additional security: prevent common injection patterns
  .refine(
    (email) => !email.includes('..') && !email.startsWith('.') && !email.endsWith('.'),
    { message: 'auth.invalid_email_format' }
  )
  // Normalize to lowercase
  .transform((val) => val.toLowerCase().trim());

// -------------------------------
// Password Validation
// -------------------------------

const passwordSchema = z
  .string()
  .min(8, 'auth.password_too_short')
  .max(128, 'auth.password_too_long')
  // At least one lowercase letter
  .regex(/[a-z]/, 'auth.password_needs_lowercase')
  // At least one uppercase letter (optional - uncomment if required)
  // .regex(/[A-Z]/, 'auth.password_needs_uppercase')
  // At least one digit
  .regex(/[0-9]/, 'auth.password_needs_number')
  // No whitespace
  .refine((pwd) => !/\s/.test(pwd), { message: 'auth.password_no_spaces' });

// -------------------------------
// Display Name Validation
// -------------------------------

const displayNameSchema = z
  .string()
  .min(2, 'auth.name_too_short')
  .max(50, 'auth.name_too_long')
  // Only allow letters, numbers, spaces, and common name characters
  .regex(/^[\p{L}\s\-'.]+$/u, 'auth.invalid_name_format')
  .transform((val) => val.trim());

// -------------------------------
// Phone Number Validation (Morocco + International)
// -------------------------------

const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => {
      if (!phone) return true; // Optional field
      // Morocco phone format: +212 6XX XXX XXX or 06XX XXXXXX
      const moroccoRegex = /^(\+212|0)[5-9]\d{8}$/;
      // General international format
      const internationalRegex = /^\+?[1-9]\d{1,14}$/;
      return moroccoRegex.test(phone.replace(/\s/g, '')) || 
             internationalRegex.test(phone.replace(/\s/g, ''));
    },
    { message: 'auth.invalid_phone' }
  );

// -------------------------------
// Signup Schema
// -------------------------------

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'auth.confirm_password_required'),
    display_name: displayNameSchema,
    phone: phoneSchema,
    // Accept terms (should be true) - optional for API, enforce on frontend
    acceptTerms: z.boolean().optional(), 
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwords_mismatch',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

// -------------------------------
// Login Schema
// -------------------------------

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'auth.password_required'),
  // Remember me option
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// -------------------------------
// Profile Update Schema
// -------------------------------

export const updateProfileSchema = z.object({
  display_name: displayNameSchema.optional(),
  bio: z
    .string()
    .max(500, 'auth.bio_too_long')
    .optional(),
  phone: phoneSchema,
  avatar_url: z
    .string()
    .url('auth.invalid_avatar_url')
    .max(500, 'auth.url_too_long')
    .optional()
    .or(z.literal('')),
  country_id: z.string().uuid('auth.invalid_country_id').optional(),
  city_id: z.string().uuid('auth.invalid_city_id').optional(),
  // Notification preferences
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// -------------------------------
// Change Password Schema
// -------------------------------

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'auth.current_password_required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'auth.confirm_password_required'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'auth.passwords_mismatch',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'auth.new_password_same_as_old',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// -------------------------------
// Reset Password Schema (Request)
// -------------------------------

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

// -------------------------------
// Reset Password Schema (Confirm)
// -------------------------------

export const resetPasswordConfirmSchema = z
  .object({
    token: z.string().min(1, 'auth.token_required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'auth.confirm_password_required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwords_mismatch',
    path: ['confirmPassword'],
  });

export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;

// -------------------------------
// Email Verification Schema
// -------------------------------

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'auth.token_required'),
  // Optional: email for verification
  email: emailSchema.optional(),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// -------------------------------
// 2FA Schemas
// -------------------------------

export const enable2FASchema = z.object({
  code: z.string().length(6, 'auth.invalid_2fa_code').regex(/^\d+$/, 'auth.invalid_2fa_code'),
});

export const verify2FASchema = z.object({
  code: z.string().length(6, 'auth.invalid_2fa_code').regex(/^\d+$/, 'auth.invalid_2fa_code'),
});

export type Enable2FAInput = z.infer<typeof enable2FASchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;

// ============================================================
// Error Message Maps (Arabic & English)
// ============================================================

export const authErrorMessages: Record<string, { ar: string; en: string }> = {
  // General
  'common.error': { ar: 'حدث خطأ ما', en: 'An error occurred' },
  'common.unauthorized': { ar: 'غير مصرح لك', en: 'Unauthorized' },
  'common.forbidden': { ar: 'ممنوع الوصول', en: 'Forbidden' },
  
  // Email errors
  'auth.email_required': { ar: 'البريد الإلكتروني مطلوب', en: 'Email is required' },
  'auth.email_too_long': { ar: 'البريد الإلكتروني طويل جداً', en: 'Email is too long' },
  'auth.invalid_email': { ar: 'بريد إلكتروني غير صالح', en: 'Invalid email address' },
  'auth.invalid_email_format': { ar: 'تنسيق البريد الإلكتروني غير صالح', en: 'Invalid email format' },
  'auth.email_taken': { ar: 'البريد الإلكتروني مستخدم بالفعل', en: 'Email already registered' },
  
  // Password errors
  'auth.password_required': { ar: 'كلمة المرور مطلوبة', en: 'Password is required' },
  'auth.password_too_short': { ar: 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)', en: 'Password too short (min 8 characters)' },
  'auth.password_too_long': { ar: 'كلمة المرور طويلة جداً', en: 'Password too long' },
  'auth.password_needs_lowercase': { ar: 'كلمة المرور يجب أن تحتوي على حرف صغير', en: 'Password needs a lowercase letter' },
  'auth.password_needs_uppercase': { ar: 'كلمة المرور يجب أن تحتوي على حرف كبير', en: 'Password needs an uppercase letter' },
  'auth.password_needs_number': { ar: 'كلمة المرور يجب أن تحتوي على رقم', en: 'Password needs a number' },
  'auth.password_no_spaces': { ar: 'كلمة المرور لا يمكن أن تحتوي على مسافات', en: 'Password cannot contain spaces' },
  'auth.weak_password': { ar: 'كلمة مرور ضعيفة', en: 'Password is too weak' },
  'auth.passwords_mismatch': { ar: 'كلمتا المرور غير متطابقتين', en: 'Passwords do not match' },
  'auth.current_password_required': { ar: 'كلمة المرور الحالية مطلوبة', en: 'Current password is required' },
  'auth.new_password_same_as_old': { ar: 'كلمة المرور الجديدة يجب أن تختلف عن القديمة', en: 'New password must be different' },
  'auth.confirm_password_required': { ar: 'تأكيد كلمة المرور مطلوب', en: 'Please confirm your password' },
  
  // Name errors
  'auth.name_too_short': { ar: 'الاسم قصير جداً (حرفان على الأقل)', en: 'Name too short (min 2 characters)' },
  'auth.name_too_long': { ar: 'الاسم طويل جداً', en: 'Name too long' },
  'auth.invalid_name_format': { ar: 'تنسيق الاسم غير صالح', en: 'Invalid name format' },
  
  // Phone errors
  'auth.invalid_phone': { ar: 'رقم الهاتف غير صالح', en: 'Invalid phone number' },
  
  // Bio errors
  'auth.bio_too_long': { ar: 'النبذة طويلة جداً', en: 'Bio is too long' },
  
  // URL errors
  'auth.invalid_avatar_url': { ar: 'رابط الصورة الرمزية غير صالح', en: 'Invalid avatar URL' },
  'auth.url_too_long': { ar: 'الرابط طويل جداً', en: 'URL is too long' },
  'auth.invalid_country_id': { ar: 'معرف الدولة غير صالح', en: 'Invalid country ID' },
  'auth.invalid_city_id': { ar: 'معرف المدينة غير صالح', en: 'Invalid city ID' },
  
  // Terms
  'auth.accept_terms_required': { ar: 'يجب قبول الشروط والأحكام', en: 'You must accept the terms and conditions' },
  
  // Token errors
  'auth.token_required': { ar: 'الرمز مطلوب', en: 'Token is required' },
  'auth.invalid_token': { ar: 'رمز غير صالح أو منتهي الصلاحية', en: 'Invalid or expired token' },
  
  // 2FA errors
  'auth.invalid_2fa_code': { ar: 'رمز التحقق ثنائي غير صالح', en: 'Invalid 2FA code' },
  
  // Auth operation messages
  'auth.invalid_credentials': { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Invalid email or password' },
  'auth.email_not_confirmed': { ar: 'يرجى تأكيد بريدك الإلكتروني أولاً', en: 'Please confirm your email first' },
  'auth.user_not_found': { ar: 'المستخدم غير موجود', en: 'User not found' },
  'auth.account_disabled': { ar: 'الحساب معطّل', en: 'Account is disabled' },
  'auth.account_banned': { ar: 'الحساب محظور', en: 'Account is banned' },
  'auth.too_many_attempts': { ar: 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً', en: 'Too many attempts, please try again later' },
  
  // Success messages
  'auth.login_success': { ar: 'تم تسجيل الدخول بنجاح', en: 'Successfully signed in' },
  'auth.logout_success': { ar: 'تم تسجيل الخروج بنجاح', en: 'Successfully signed out' },
  'auth.signup_success': { ar: 'تم إنشاء الحساب بنجاح', en: 'Account created successfully' },
  'auth.profile_updated': { ar: 'تم تحديث الملف الشخصي', en: 'Profile updated successfully' },
  'auth.password_changed': { ar: 'تم تغيير كلمة المرور', en: 'Password changed successfully' },
  'auth.reset_email_sent': { ar: 'تم إرسال بريد إعادة التعيين', en: 'Reset email sent' },
  'auth.email_verified': { ar: 'تم تأكيد البريد الإلكتروني', en: 'Email verified successfully' },
  'auth.2fa_enabled': { ar: 'تم تفعيل التحقق ثنائي العامل', en: 'Two-factor authentication enabled' },
  
  // Status messages
  'auth.logging_in': { ar: 'جارِ تسجيل الدخول...', en: 'Signing in...' },
  'auth.creating_account': { ar: 'جارِ إنشاء الحساب...', en: 'Creating account...' },
  'auth.error_occurred': { ar: 'حدث خطأ غير متوقع', en: 'An unexpected error occurred' },
};

// Helper function to get localized error message
export function getAuthErrorMessage(key: string, locale: 'ar' | 'fr' | 'en' = 'en'): string {
  const message = authErrorMessages[key];
  if (!message) return key; // Return key if not found
  
  // For French, fall back to English if no French translation
  if (locale === 'fr') {
    return message.en;
  }
  
  return message[locale] || message.en;
}
