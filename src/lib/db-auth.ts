/**
 * Database-First Authentication
 * Works with users table directly when Supabase Auth has issues
 * Supports both login and signup operations
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { hash, compare } from 'bcryptjs';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Demo/Seed users with known passwords (for testing) - these are stored in DB now
// But we keep this as fallback for accounts created before password hashing was added
const DEMO_PASSWORDS: Record<string, string> = {
  'admin@mavora.ma': 'Mavora@2024!Admin',
  'testuser@mavora.ma': 'TestUser2024!Secure',
};

// ============================================================
// Helper: Generate a simple hash for password storage
// In production, use bcrypt/argon2
// ============================================================

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'hashed_' + Math.abs(hash).toString(36);
}

// ============================================================
// SIGNUP - Create new user in database directly
// ============================================================

export interface DbSignupResult {
  success: boolean;
  user?: Record<string, unknown>;
  error?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
}

export async function dbSignup(
  email: string, 
  password: string, 
  displayName: string,
  phone?: string | null
): Promise<DbSignupResult> {
  console.log('[DB Auth] Attempting signup for:', email);
  
  try {
    // Step 1: Check if user already exists
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: 'auth.email_taken' };
    }
    
    // Step 2: Create new user
    const userId = randomUUID();
    const now = new Date().toISOString();
    
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase().trim(),
        name: displayName.trim(),
        image: null,
        role: 'user',
        emailVerified: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      })
      .select('*')
      .single();
    
    if (insertError || !newUser) {
      console.error('[DB Auth] Insert error:', insertError?.message);
      return { success: false, error: 'auth.signup_failed' };
    }
    
    // Step 3: Hash and store password in database
    const passwordHash = await hash(password, 10);
    
    // Update user with password hash
    await supabaseAdmin
      .from('users')
      .update({ passwordHash: passwordHash })
      .eq('id', userId);
    
    // Also keep in memory for backward compatibility during this session
    DEMO_PASSWORDS[email.toLowerCase()] = password;
    
    // Step 4: Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        userId: userId,
        display_name: displayName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        bio: null,
        avatarUrl: null,
        isVerified: false,
        isSuspended: false,
        createdAt: now,
        updatedAt: now,
      });
    
    if (profileError) {
      console.warn('[DB Auth] Profile creation warning:', profileError.message);
      // Don't fail - profile might be created by trigger
    }
    
    // Step 5: Return user session
    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      display_name: displayName,
      role: 'user',
      is_verified: false,
      avatar_url: null,
      bio: null,
      created_at: now,
    };
    
    console.log('[DB Auth] Signup successful for:', email);
    
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
    console.error('[DB Auth] Signup error:', error);
    return { success: false, error: 'auth.error_occurred' };
  }
}

// ============================================================
// LOGIN - Authenticate user against database
// ============================================================

export interface DbLoginResult {
  success: boolean;
  user?: Record<string, unknown>;
  error?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
  authMethod?: string;
}

export async function dbLogin(email: string, password: string): Promise<DbLoginResult> {
  console.log('[DB Auth] Attempting login for:', email);
  
  try {
    // Step 1: Find user in database
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('isActive', true)
      .limit(1);
    
    if (error) {
      console.error('[DB Auth] Query error:', error);
      return { success: false, error: 'Database error' };
    }
    
    if (!users || users.length === 0) {
      return { success: false, error: 'auth.invalid_credentials' };
    }
    
    const user = users[0];
    
    // Step 2: Check password - first try database hash, then fallback to demo passwords
    let passwordValid = false;
    const normalizedEmail = email.toLowerCase().trim();
    
    // First, check if user has a password hash in database
    if (user.passwordHash) {
      try {
        passwordValid = await compare(password, user.passwordHash);
      } catch (e) {
        console.warn('[DB Auth] Password comparison error:', e);
      }
    }
    
    // Fallback to demo passwords for legacy accounts
    if (!passwordValid) {
      const correctPassword = DEMO_PASSWORDS[normalizedEmail] || DEMO_PASSWORDS[email];
      if (correctPassword) {
        passwordValid = password === correctPassword;
      }
    }
    
    if (!passwordValid) {
      return { success: false, error: 'auth.invalid_credentials' };
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
      display_name: user.name || profile?.display_name || 'User',
      role: user.role || 'user',
      is_verified: user.emailVerified || profile?.isVerified || false,
      avatar_url: user.image || profile?.avatarUrl,
      bio: profile?.bio,
      phone: profile?.phone,
      created_at: user.createdAt,
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
      authMethod: 'database',
    };
    
  } catch (error) {
    console.error('[DB Auth] Login error:', error);
    return { success: false, error: 'auth.error_occurred' };
  }
}

// ============================================================
// GET USER - Fetch user by ID
// ============================================================

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
    role: user.role || 'user',
    is_verified: user.emailVerified || false,
    avatar_url: user.image,
    bio: profile?.bio,
  };
}

// Export demo passwords for testing (remove in production)
export { DEMO_PASSWORDS };

export default {
  dbLogin,
  dbSignup,
  dbGetUser,
};
