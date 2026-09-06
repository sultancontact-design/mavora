/**
 * TypeScript Type Definitions for Mavora Mobile
 * Complete type system for the Arabic marketplace app
 * 
 * @module types
 */

// ============================================================
// User Types
// ============================================================

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  is_seller?: boolean;
  is_verified?: boolean;
  rating?: number;
  total_reviews?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile extends User {
  bio?: string;
  location?: LocationData;
  listings_count?: number;
  followers_count?: number;
  following_count?: boolean;
}

// ============================================================
// Listing Types
// ============================================================

export type ListingStatus = 'active' | 'sold' | 'draft' | 'expired' | 'rejected';
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export interface LocationData {
  lat: number;
  lng: number;
  city: string;
  region?: string;
  address?: string;
}

export interface ListingImage {
  id: string;
  url: string;
  order: number;
  is_primary: boolean;
}

export interface Listing {
  id: string;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  price: number;
  currency: string;
  category_id: string;
  category_name?: string;
  category_name_ar?: string;
  seller_id: string;
  seller?: User;
  images: string[] | ListingImage[];
  location?: LocationData;
  condition?: ListingCondition;
  status: ListingStatus;
  is_featured?: boolean;
  is_negotiable?: boolean;
  view_count?: number;
  favorite_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ListingFilters {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  condition?: ListingCondition;
  location?: string;
  search_query?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'date' | 'popularity';
  is_negotiable?: boolean;
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  category_id: string;
  images: string[];
  location?: LocationData;
  condition?: ListingCondition;
  is_negotiable?: boolean;
}

// ============================================================
// Category Types
// ============================================================

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  image_url?: string;
  parent_id?: string;
  listing_count?: number;
  children?: Category[];
}

// ============================================================
// Message & Chat Types
// ============================================================

export type MessageType = 'text' | 'image' | 'listing' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  message_type: MessageType;
  attachment_url?: string;
  listing_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  participants?: User[];
  last_message?: Message;
  listing_id?: string;
  listing?: Listing;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Notification Types
// ============================================================

export type NotificationType = 
  | 'new_message'
  | 'new_follower'
  | 'listing_liked'
  | 'listing_sold'
  | 'price_drop'
  | 'new_listing_nearby'
  | 'system'
  | 'promotion';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  title_ar?: string;
  body: string;
  body_ar?: string;
  data?: Record<string, any>;
  image_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// ============================================================
// Review Types
// ============================================================

export interface Review {
  id: string;
  reviewer_id: string;
  reviewer?: User;
  target_id: string;
  listing_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// ============================================================
// Favorite / Wishlist Types
// ============================================================

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  listing?: Listing;
  created_at: string;
}

// ============================================================
// Wallet / Payment Types
// ============================================================

export type TransactionType = 'sale' | 'purchase' | 'refund' | 'withdrawal' | 'deposit';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  reference_id?: string;
  created_at: string;
}

// ============================================================
// Navigation Types (extended)
// ============================================================

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  ListingDetail: { listingId: string };
  CreateListing: undefined;
  EditListing: { listingId: string };
  Chat: { conversationId: string; userName: string; userAvatar?: string };
  SellerProfile: { sellerId: string };
  SellerDashboard: { sellerId: string };
  MapView: { listings?: Listing[]; selectedLocation?: LocationData };
  Search: { query?: string; category?: string };
  Settings: undefined;
  Notifications: undefined;
  Favorites: undefined;
  Messages: undefined;
  Wallet: undefined;
  Reviews: { userId: string };
  ImageViewer: { images: string[]; initialIndex?: number };
};

export type MainTabParamList = {
  Home: undefined;
  Browse: undefined;
  PostAd: undefined;
  Messages: undefined;
  Profile: undefined;
};

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_more: boolean;
}

// ============================================================
// Form Types
// ============================================================

export interface FormFieldError {
  field: string;
  message: string;
}

export interface ValidationError {
  errors: FormFieldError[];
  message: string;
}
