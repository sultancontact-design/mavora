/**
 * Supabase Client Configuration for Mobile
 * 
 * @module services/SupabaseClient
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client with AsyncStorage adapter
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

// Database types (simplified)
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_id: string;
  seller_id: string;
  images: string[];
  location?: {
    lat: number;
    lng: number;
    city: string;
  };
  status: 'active' | 'sold' | 'draft' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export default supabase;
