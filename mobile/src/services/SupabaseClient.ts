/**
 * Supabase Client Configuration for Mavora Mobile
 * Complete Supabase integration with database types and helper functions
 * 
 * @module services/SupabaseClient
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Listing, Message, Conversation, Notification, Category, User } from '../types';

// ============================================================
// Configuration
// ============================================================

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// ============================================================
// Client Initialization
// ============================================================

/**
 * Supabase client instance with AsyncStorage adapter for persistence
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ============================================================
// Database Types (re-exported from types)
// ============================================================

export type { 
  User, 
  Listing, 
  Message, 
  Conversation, 
  Notification, 
  Category 
} from '../types';

export type { 
  ListingStatus, 
  ListingCondition, 
  LocationData,
  MessageType,
  NotificationType,
} from '../types';

// ============================================================
// Listings Service
// ============================================================

export interface ListingsService {
  getListings: (params?: ListingsQueryParams) => Promise<{ data: Listing[]; error: any }>;
  getListingById: (id: string) => Promise<{ data: Listing | null; error: any }>;
  createListing: (data: CreateListingData) => Promise<{ data: Listing | null; error: any }>;
  updateListing: (id: string, data: Partial<Listing>) => Promise<{ data: Listing | null; error: any }>;
  deleteListing: (id: string) => Promise<{ error: any }>;
  searchListings: (query: string, filters?: SearchFilters) => Promise<{ data: Listing[]; error: any }>;
  getFeaturedListings: (limit?: number) => Promise<{ data: Listing[]; error: any }>;
  getUserListings: (userId: string) => Promise<{ data: Listing[]; error: any }>;
  toggleFavorite: (userId: string, listingId: string) => Promise<{ isFavorite: boolean; error: any }>;
  getFavorites: (userId: string) => Promise<{ data: Listing[]; error: any }>;
  incrementViewCount: (listingId: string) => Promise<void>;
}

export interface ListingsQueryParams {
  category_id?: string;
  status?: string;
  seller_id?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  min_price?: number;
  max_price?: number;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  currency?: string;
  category_id: string;
  images: string[];
  location?: {
    lat: number;
    lng: number;
    city: string;
    address?: string;
  };
  condition?: string;
  is_negotiable?: boolean;
}

export interface SearchFilters {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  condition?: string;
  city?: string;
}

/**
 * Listings service implementation
 */
export const listingsService: ListingsService = {
  async getListings(params?: ListingsQueryParams) {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active');

      if (params?.category_id) {
        query = query.eq('category_id', params.category_id);
      }
      if (params?.seller_id) {
        query = query.eq('seller_id', params.seller_id);
      }
      if (params?.min_price !== undefined) {
        query = query.gte('price', params.min_price);
      }
      if (params?.max_price !== undefined) {
        query = query.lte('price', params.max_price);
      }

      // Sorting
      switch (params?.sort_by) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'popularity':
          query = query.order('view_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const limit = params?.limit || 20;
      const offset = params?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      return { data: data || [], error };
    } catch (error) {
      console.error('[ListingsService] getListings error:', error);
      return { data: [], error };
    }
  },

  async getListingById(id: string) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('[ListingsService] getListingById error:', error);
      return { data: null, error };
    }
  },

  async createListing(data: CreateListingData) {
    try {
      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          ...data,
          currency: data.currency || 'MAD',
          status: 'active',
          view_count: 0,
          favorite_count: 0,
        })
        .select()
        .single();

      return { data: listing, error };
    } catch (error) {
      console.error('[ListingsService] createListing error:', error);
      return { data: null, error };
    }
  },

  async updateListing(id: string, data: Partial<Listing>) {
    try {
      const { data: listing, error } = await supabase
        .from('listings')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      return { data: listing, error };
    } catch (error) {
      console.error('[ListingsService] updateListing error:', error);
      return { data: null, error };
    }
  },

  async deleteListing(id: string) {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('[ListingsService] deleteListing error:', error);
      return { error };
    }
  },

  async searchListings(query: string, filters?: SearchFilters) {
    try {
      let dbQuery = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      if (filters?.category_id) {
        dbQuery = dbQuery.eq('category_id', filters.category_id);
      }
      if (filters?.min_price !== undefined) {
        dbQuery = dbQuery.gte('price', filters.min_price);
      }
      if (filters?.max_price !== undefined) {
        dbQuery = dbQuery.lte('price', filters.max_price);
      }
      if (filters?.condition) {
        dbQuery = dbQuery.eq('condition', filters.condition);
      }

      const { data, error } = await dbQuery
        .order('created_at', { ascending: false })
        .limit(50);

      return { data: data || [], error };
    } catch (error) {
      console.error('[ListingsService] searchListings error:', error);
      return { data: [], error };
    }
  },

  async getFeaturedListings(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      console.error('[ListingsService] getFeaturedListings error:', error);
      return { data: [], error };
    }
  },

  async getUserListings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('[ListingsService] getUserListings error:', error);
      return { data: [], error };
    }
  },

  async toggleFavorite(userId: string, listingId: string) {
    try {
      // Check if already favorited
      const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .single();

      if (existing) {
        // Remove favorite
        await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);

        return { isFavorite: false, error: null };
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, listing_id });

        return { isFavorite: !error, error };
      }
    } catch (error) {
      console.error('[ListingsService] toggleFavorite error:', error);
      return { isFavorite: false, error };
    }
  },

  async getFavorites(userId: string) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listings (*)
        `)
        .eq('user_id', userId);

      const listings = (data || []).map((f: any) => f.listings).filter(Boolean);
      return { data: listings, error };
    } catch (error) {
      console.error('[ListingsService] getFavorites error:', error);
      return { data: [], error };
    }
  },

  async incrementViewCount(listingId: string) {
    try {
      await supabase.rpc('increment_view_count', { listing_id: listingId });
    } catch (error) {
      // Silently fail - not critical
    }
  },
};

// ============================================================
// Messages/Chat Service
// ============================================================

export interface MessagesService {
  getMessages: (conversationId: string, limit?: number) => Promise<{ data: Message[]; error: any }>;
  sendMessage: (data: SendMessageData) => Promise<{ data: Message | null; error: any }>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  getConversations: (userId: string) => Promise<{ data: Conversation[]; error: any }>;
  getOrCreateConversation: (user1Id: string, user2Id: string) => Promise<{ data: Conversation | null; error: any }>;
  subscribeToMessages: (conversationId: string, callback: (message: Message) => void) => () => void;
}

export interface SendMessageData {
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type?: string;
  listing_id?: string;
}

/**
 * Messages service implementation
 */
export const messagesService: MessagesService = {
  async getMessages(conversationId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      console.error('[MessagesService] getMessages error:', error);
      return { data: [], error };
    }
  },

  async sendMessage(data: SendMessageData) {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          ...data,
          message_type: data.message_type || 'text',
          is_read: false,
        })
        .select()
        .single();

      // Update conversation timestamp
      if (!error) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString(), last_message_id: message?.id })
          .eq('id', data.conversation_id);
      }

      return { data: message, error };
    } catch (error) {
      console.error('[MessagesService] sendMessage error:', error);
      return { data: null, error };
    }
  },

  async markAsRead(messageIds: string[]) {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', messageIds);
    } catch (error) {
      console.error('[MessagesService] markAsRead error:', error);
    }
  },

  async getConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          last_message (*),
          participants:profiles!conversations_participant_ids_fkey (id, full_name, avatar_url)
        `)
        .contains('participant_ids', [userId])
        .order('updated_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('[MessagesService] getConversations error:', error);
      return { data: [], error };
    }
  },

  async getOrCreateConversation(user1Id: string, user2Id: string) {
    try {
      // Try to find existing conversation
      const participantIds = [user1Id, user2Id].sort();
      
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', participantIds)
        .single();

      if (existing) {
        return { data: existing, error: null };
      }

      // Create new conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          participant_ids: participantIds,
        })
        .select()
        .single();

      return { data: conversation, error };
    } catch (error) {
      console.error('[MessagesService] getOrCreateConversation error:', error);
      return { data: null, error };
    }
  },

  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },
};

// ============================================================
// Users Service
// ============================================================

export interface UsersService {
  getUserById: (id: string) => Promise<{ data: User | null; error: any }>;
  updateUser: (id: string, data: Partial<User>) => Promise<{ data: User | null; error: any }>;
  uploadAvatar: (userId: string, uri: string) => Promise<{ url: string | null; error: any }>;
  getUserProfile: (username: string) => Promise<{ data: User & { listings_count: number; reviews: Review[] } | null; error: any }>;
  followUser: (followerId: string, followingId: string) => Promise<{ success: boolean; error: any }>;
  unfollowUser: (followerId: string, followingId: string) => Promise<{ success: boolean; error: any }>;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer: User;
  created_at: string;
}

/**
 * Users service implementation
 */
export const usersService: UsersService = {
  async getUserById(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('[UsersService] getUserById error:', error);
      return { data: null, error };
    }
  },

  async updateUser(id: string, data: Partial<User>) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      return { data: user, error };
    } catch (error) {
      console.error('[UsersService] updateUser error:', error);
      return { data: null, error };
    }
  },

  async uploadAvatar(userId: string, uri: string) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}_avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user's avatar_url
      await this.updateUser(userId, { avatar_url: publicUrlData.publicUrl });

      return { url: publicUrlData.publicUrl, error: null };
    } catch (error) {
      console.error('[UsersService] uploadAvatar error:', error);
      return { url: null, error };
    }
  },

  async getUserProfile(username: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_profile', { p_username: username });

      return { data, error };
    } catch (error) {
      console.error('[UsersService] getUserProfile error:', error);
      return { data: null, error };
    }
  },

  async followUser(followerId: string, followingId: string) {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
        });

      return { success: !error, error };
    } catch (error) {
      console.error('[UsersService] followUser error:', error);
      return { success: false, error };
    }
  },

  async unfollowUser(followerId: string, followingId: string) {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      return { success: !error, error };
    } catch (error) {
      console.error('[UsersService] unfollowUser error:', error);
      return { success: false, error };
    }
  },
};

// ============================================================
// Categories Service
// ============================================================

export interface CategoriesService {
  getCategories: (parentId?: string) => Promise<{ data: Category[]; error: any }>;
  getCategoryById: (id: string) => Promise<{ data: Category | null; error: any }>;
}

export const categoriesService: CategoriesService = {
  async getCategories(parentId?: string) {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('name_ar');

      if (parentId) {
        query = supabase
          .from('categories')
          .select('*')
          .eq('parent_id', parentId)
          .order('name_ar');
      }

      const { data, error } = await query;

      return { data: data || [], error };
    } catch (error) {
      console.error('[CategoriesService] getCategories error:', error);
      return { data: [], error };
    }
  },

  async getCategoryById(id: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('[CategoriesService] getCategoryById error:', error);
      return { data: null, error };
    }
  },
};

// ============================================================
// Storage Service
// ============================================================

export interface StorageService {
  uploadImage: (bucket: string, path: string, uri: string) => Promise<{ url: string | null; error: any }>;
  uploadImages: (bucket: string, basePath: string, uris: string[]) => Promise<{ urls: string[]; errors: any[] }>;
  deleteImage: (bucket: string, path: string) => Promise<{ error: any }>;
  getPublicUrl: (bucket: string, path: string) => string;
}

export const storageService: StorageService = {
  async uploadImage(bucket: string, path: string, uri: string) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    } catch (error) {
      console.error('[StorageService] uploadImage error:', error);
      return { url: null, error };
    }
  },

  async uploadImages(bucket: string, basePath: string, uris: string[]) {
    const urls: string[] = [];
    const errors: any[] = [];

    for (let i = 0; i < uris.length; i++) {
      const path = `${basePath}_${i}.jpg`;
      const result = await this.uploadImage(bucket, path, uris[i]);
      
      if (result.url) {
        urls.push(result.url);
      } else {
        errors.push(result.error);
      }
    }

    return { urls, errors };
  },

  async deleteImage(bucket: string, path: string) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return { error };
    } catch (error) {
      console.error('[StorageService] deleteImage error:', error);
      return { error };
    }
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};

// ============================================================
// Export default
// ============================================================

export default supabase;
