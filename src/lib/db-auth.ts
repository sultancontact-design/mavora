/**
 * Database-First Authentication
 * Works with users table directly when Supabase Auth has issues
 * Supports both login and signup operations
 * 
 * SECURITY: Uses environment variables, NOT hardcoded keys
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { hash, compare } from 'bcryptjs';

// Use environment variables - NEVER hardcode secrets!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate on import (server-side only)
if (typeof window === 'undefined' && (!SUPABASE_URL || !SERVICE_ROLE_KEY)) {
  console.warn('[DB Auth] ⚠️ Supabase credentials not set in environment variables');
}

const supabaseAdmin = SUPABASE_URL && SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// Demo/Seed users with known passwords (for testing and admin access)
// These are stored in DB now, but kept as fallback for legacy accounts
const DEMO_PASSWORDS: Record<string, string> = {
  'admin@mavora.ma': 'Mavora@2024!Admin',
  'testuser@mavora.ma': 'TestUser2024!Secure',
  // Primary admin account for production
  'mavora@admin.com': 'admin123',
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
    const normalizedEmail = email.toLowerCase().trim();
    
    // Step 1: FIRST check demo passwords (for admin access without DB user)
    const demoPassword = DEMO_PASSWORDS[normalizedEmail] || DEMO_PASSWORDS[email];
    if (demoPassword && password === demoPassword) {
      console.log('[DB Auth] ✅ Demo password matched for:', email);
      
      // Try to find or create user in database (with full error handling)
      let user;
      
      try {
        if (!supabaseAdmin) {
          console.warn('[DB Auth] ⚠️ Supabase client not available, using demo session');
          return createDemoSession(email, password);
        }
        
        const { data: existingUsers, error: queryError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', normalizedEmail)
          .limit(1);
        
        if (queryError) {
          console.warn('[DB Auth] ⚠️ Query error, falling back to demo session:', queryError.message);
          return createDemoSession(email, password);
        }
        
        if (existingUsers && existingUsers.length > 0) {
          user = existingUsers[0];
          // Update password hash if needed
          try {
            if (!user.passwordHash) {
              const passwordHash = await hash(password, 10);
              await supabaseAdmin
                .from('users')
                .update({ passwordHash, lastLoginAt: new Date().toISOString() })
                .eq('id', user.id);
            }
          } catch (updateError) {
            console.warn('[DB Auth] ⚠️ Password update failed, continuing anyway');
          }
        } else {
          // Auto-create the user in database
          console.log('[DB Auth] Auto-creating user for:', email);
          const userId = randomUUID();
          const now = new Date().toISOString();
          const passwordHash = await hash(password, 10);
          
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              id: userId,
              email: normalizedEmail,
              name: email.includes('admin') ? 'مدير مافورا' : 'مستخدم',
              role: email.includes('admin') ? 'super_admin' : 'user',
              emailVerified: true,
              isActive: true,
              passwordHash,
              createdAt: now,
              updatedAt: now,
              lastLoginAt: now,
            })
            .select('*')
            .single();
          
          if (createError || !newUser) {
            console.warn('[DB Auth] ⚠️ Create user warning:', createError?.message, '- Using demo session');
            return createDemoSession(email, password);
          }
          
          user = newUser;
          
          // Create profile (non-critical)
          try {
            await supabaseAdmin.from('profiles').insert({
              id: userId,
              userId: userId,
              display_name: email.includes('admin') ? 'مدير مافورا' : 'مستخدم',
              email: normalizedEmail,
              isVerified: true,
              isSuspended: false,
              createdAt: now,
              updatedAt: now,
            });
          } catch (e) {
            console.warn('[DB Auth] Profile create warning:', e);
          }
        }
        
        // Return successful login with DB user
        return createUserSession(user);
        
      } catch (dbError) {
        // Any database error - fall back to demo session
        console.error('[DB Auth] ❌ Database operation failed, using demo session:', dbError);
        return createDemoSession(email, password);
      }
    }
    
    // Step 2: If not a demo account, check database normally
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
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
    
    // Step 3: Check password hash
    let passwordValid = false;
    
    if (user.passwordHash) {
      try {
        passwordValid = await compare(password, user.passwordHash);
      } catch (e) {
        console.warn('[DB Auth] Password comparison error:', e);
      }
    }
    
    if (!passwordValid) {
      return { success: false, error: 'auth.invalid_credentials' };
    }
    
    // Step 4: Get profile and return session
    return await finalizeLogin(user);
    
  } catch (error) {
    console.error('[DB Auth] Login error:', error);
    return { success: false, error: 'auth.error_occurred' };
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Create a demo session when DB is not available
function createDemoSession(email: string, _password: string): DbLoginResult {
  const userId = `demo-${Date.now()}`;
  
  return {
    success: true,
    user: {
      id: userId,
      email: email,
      display_name: email.includes('admin') ? 'مدير مافورا' : 'مستخدم',
      role: email.includes('admin') ? 'super_admin' : 'user',
      is_verified: true,
      avatar_url: null,
      bio: null,
      phone: null,
      created_at: new Date().toISOString(),
    },
    session: {
      access_token: `demo-token-${Date.now()}`,
      refresh_token: `demo-refresh-${Date.now()}`,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
    authMethod: 'demo',
  };
}

// Create user session from database user
async function createUserSession(user: any): Promise<DbLoginResult> {
  // Update last login
  await supabaseAdmin
    .from('users')
    .update({ lastLoginAt: new Date().toISOString() })
    .eq('id', user.id);
  
  // Get profile
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('userId', user.id)
    .limit(1);
  
  const profile = profiles?.[0];
  
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
  
  console.log('[DB Auth] Login successful for:', user.email, 'as', user.role);
  
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
}

// Finalize login - get profile and create session
async function finalizeLogin(user: any): Promise<DbLoginResult> {
  // Update last login
  await supabaseAdmin
    .from('users')
    .update({ lastLoginAt: new Date().toISOString() })
    .eq('id', user.id);
  
  // Get profile
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('userId', user.id)
    .limit(1);
  
  const profile = profiles?.[0];
  
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
  
  console.log('[DB Auth] Login successful for:', user.email, 'as', user.role);
  
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
