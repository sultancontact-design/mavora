/**
 * Database-First Authentication
 * Works with users table directly when Supabase Auth has issues
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Simple password check for demo (in production, use proper hashing)
const DEMO_PASSWORDS: Record<string, string> = {
  'admin@mavora.ma': 'Mavora@2024!Admin',
  'testuser@mavora.ma': 'TestUser2024!Secure',
};

export async function dbLogin(email: string, password: string) {
  console.log('[DB Auth] Attempting login for:', email);
  
  try {
    // Step 1: Find user in database
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('isActive', true)
      .limit(1);
    
    if (error) {
      console.error('[DB Auth] Query error:', error);
      return { success: false, error: 'Database error' };
    }
    
    if (!users || users.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const user = users[0];
    
    // Step 2: Check password (demo mode - simple comparison)
    // In production, this should use proper password hashing
    const correctPassword = DEMO_PASSWORDS[email];
    if (!correctPassword || password !== correctPassword) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Step 3: Get profile
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('userId', user.id)
      .limit(1);
    
    const profile = profiles?.[0] || null;
    
    // Step 4: Update last login
    await supabaseAdmin
      .from('users')
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', user.id);
    
    // Step 5: Return user session
    const sessionUser = {
      id: user.id,
      email: user.email,
      display_name: user.name || profile?.bio?.split(' - ')[0] || 'User',
      role: user.role,
      is_verified: user.emailVerified || profile?.isVerified || false,
      avatar_url: user.image || profile?.avatarUrl,
      bio: profile?.bio,
    };
    
    console.log('[DB Auth] Login successful for:', email, 'as', user.role);
    
    return {
      success: true,
      user: sessionUser,
      session: {
        access_token: `db-token-${Date.now()}`,
        refresh_token: `db-refresh-${Date.now()}`,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };
    
  } catch (error) {
    console.error('[DB Auth] Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function dbGetUser(userId: string) {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .limit(1);
  
  if (!users || users.length === 0) return null;
  
  const user = users[0];
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('userId', userId)
    .limit(1);
  
  const profile = profiles?.[0];
  
  return {
    id: user.id,
    email: user.email,
    display_name: user.name || 'User',
    role: user.role,
    is_verified: user.emailVerified || false,
    avatar_url: user.image,
    bio: profile?.bio,
  };
}

export default {
  dbLogin,
  dbGetUser,
};
