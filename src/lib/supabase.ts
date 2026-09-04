import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isProduction = process.env.NODE_ENV === 'production';

// Create Supabase client with proper error handling
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // In PRODUCTION: Fail loudly - do NOT use placeholder
    if (isProduction) {
      throw new Error(
        '❌ CRITICAL: Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are required in production. ' +
        'Set them in your environment variables or Vercel dashboard.'
      );
    }
    
    // In DEVELOPMENT: Allow build to succeed with warning
    console.warn(
      '⚠️ [DEV] Supabase credentials not found. ' +
      'Using placeholder client - features requiring database will not work. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
    
    // Return a minimal client that won't crash during dev/build
    // This client will fail gracefully on actual API calls
    return createClient(
      'https://placeholder.supabase.co', 
      'placeholder-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    ) as unknown as SupabaseClient;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = createSupabaseClient();

export function getSupabaseServerClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // In production, this is a critical error
    if (isProduction) {
      throw new Error(
        '❌ CRITICAL: Supabase credentials missing in production. Cannot create server client.'
      );
    }
    
    console.warn('⚠️ [DEV] Supabase credentials not found. Using placeholder client.');
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
