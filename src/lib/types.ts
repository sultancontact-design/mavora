// ===================================================
// MAVORA Type Definitions
// ===================================================

export type Locale = 'ar' | 'fr' | 'en';
export type Direction = 'rtl' | 'ltr';

// ===================================================
// Auth Types
// ===================================================

/**
 * Extended UserRole including all possible roles in the system
 */
export type UserRole =
  | 'user'
  | 'verified_user'
  | 'professional_seller'
  | 'support_agent'
  | 'finance_manager'
  | 'content_manager'
  | 'analyst'
  | 'moderator'
  | 'admin'
  | 'super_admin';

/**
 * User interface - represents an authenticated user
 * This is the main user object used throughout the application
 */
export interface User {
  id: string;
  email: string;
  phone?: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  country_id?: string;
  city_id?: string;
  is_verified: boolean;
  is_suspended: boolean;
  role: UserRole;
  created_at: string;
}

/**
 * Session data returned after successful authentication
 */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: string;
}

/**
 * Complete authentication response including user and session
 */
export interface AuthResponse {
  user: User;
  session?: AuthSession | null;
  profile?: Record<string, unknown> | null;
  message?: string;
}

/**
 * Authentication state for the auth store
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * Password strength result with score and metadata
 */
export interface PasswordStrengthResult {
  score: number; // 0-4
  labelKey: string; // i18n key for the label
  color: string; // Tailwind color class
  width: string; // Tailwind width class
}

/**
 * 2FA (Two-Factor Authentication) status
 */
export interface TwoFactorStatus {
  enabled: boolean;
  secret?: string;
  qrCodeUrl?: string;
  recoveryCodes?: string[];
}

/**
 * Rate limit information for API responses
 */
export interface RateLimitInfo {
  remainingAttempts: number;
  lockoutEnd?: number;
  retryAfter?: number;
}

export interface Country {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  code: string;
  currency_code: string;
  flag_emoji: string;
  is_active: boolean;
  sort_order: number;
}

export interface City {
  id: string;
  country_id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  is_active: boolean;
  sort_order: number;
}

export interface Currency {
  id: string;
  code: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  symbol: string;
  exchange_rate: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name_ar: string;
  name_fr: string;
  name_en: string;
  slug: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
}

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'sold'
  | 'reserved'
  | 'archived'
  | 'rejected';

export interface Listing {
  id: string;
  seller_id: string;
  seller?: User;
  title: string;
  description: string;
  price: number | null;
  currency_id: string | null;
  currency?: Currency;
  category_id: string;
  category?: Category;
  country_id: string;
  city_id: string;
  status: ListingStatus;
  is_featured: boolean;
  is_urgent: boolean;
  view_count: number;
  video_url: string | null;
  media: ListingMedia[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  expires_at: string | null;
}

export interface ListingMedia {
  id: string;
  listing_id: string;
  url: string;
  type: 'image' | 'video';
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Favorite {
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'listing' | 'user' | 'message';
  target_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// ===================================================
// Auth Form Types
// ===================================================

export interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  display_name: string;
  phone?: string;
  acceptTerms?: boolean;
}

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UpdateProfileFormValues {
  display_name?: string;
  bio?: string;
  phone?: string;
  avatar_url?: string;
  country_id?: string;
  city_id?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordFormValues {
  email: string;
}

export interface ResetPasswordConfirmFormValues {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface CreateListingFormValues {
  title: string;
  description: string;
  price: string;
  currency_id: string;
  category_id: string;
  country_id: string;
  city_id: string;
  status: 'draft' | 'active';
}

export interface SearchFilters {
  query?: string;
  category_id?: string;
  country_id?: string;
  city_id?: string;
  min_price?: number;
  max_price?: number;
  currency_id?: string;
  status?: ListingStatus;
  sort_by?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Conversation {
  id: string;
  listing_id: string | null;
  created_at: string;
  updated_at: string;
  other_user: { id: string; display_name: string; avatar_url: string | null } | null;
  last_message?: { content: string; created_at: string } | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  seller_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
}

// ===================================================
// Payment Adapter Types
// ===================================================

export interface PaymentProvider {
  name: string;
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyResult>;
  handleWebhook(body: unknown, headers: Record<string, string>): Promise<WebhookResult>;
  refund(params: RefundParams): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResult>;
}

export interface CreateCheckoutParams {
  amount: number;
  currency: string;
  description: string;
  metadata: Record<string, string>;
  returnUrl: string;
  cancelUrl: string;
  customerId?: string;
}

export interface CheckoutResult {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}

export interface VerifyPaymentParams {
  paymentId: string;
  idempotencyKey: string;
}

export interface VerifyResult {
  success: boolean;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed';
  transactionId?: string;
  amount?: number;
  error?: string;
}

export interface WebhookResult {
  success: boolean;
  eventType: string;
  paymentId?: string;
  amount?: number;
  status?: string;
  error?: string;
}

export interface RefundParams {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  status: string;
  amount?: number;
  error?: string;
}

// ===================================================
// Audit Log Types
// ===================================================

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: { display_name: string } | null;
}

// ===================================================
// Category Dynamic Fields Types
// ===================================================

export interface CategoryFieldOption {
  id: string;
  field_id: string;
  value_ar: string;
  value_fr: string;
  value_en: string;
  sort_order: number;
}

export interface CategoryField {
  id: string;
  category_id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  slug: string;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  placeholder_ar?: string;
  placeholder_fr?: string;
  placeholder_en?: string;
  unit_ar?: string;
  unit_fr?: string;
  unit_en?: string;
  validation_min?: number;
  validation_max?: number;
  options?: CategoryFieldOption[];
  created_at: string;
}

export interface ListingFieldValue {
  id: string;
  listing_id: string;
  field_id: string;
  value: string;
  field?: CategoryField;
}

// ===================================================
// Invoice Types
// ===================================================

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  type: 'token_purchase' | 'subscription' | 'promotion';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  amount: number;
  currency_code: string;
  description?: string;
  metadata?: Record<string, unknown>;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
}

