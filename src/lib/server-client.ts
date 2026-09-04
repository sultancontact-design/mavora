/**
 * Server-Side Supabase Client
 * 
 * ⚠️ SECURITY: This file should ONLY be imported in:
 * - Server Components (app/*)
 * - API Routes (app/api/*)
 * - Server Actions
 * 
 * NEVER import this in client components!
 * The SERVICE_ROLE_KEY must not be exposed to the browser.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Create admin client with full database access
 * Only use this on the server side!
 */
export function createAdminClient(): SupabaseClient {
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

/**
 * Get a pre-configured admin client (cached per request)
 */
let cachedAdminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }
  
  cachedAdminClient = createAdminClient();
  return cachedAdminClient;
}

/**
 * Reset cache (call at end of request)
 */
export function resetAdminCache(): void {
  cachedAdminClient = null;
}
