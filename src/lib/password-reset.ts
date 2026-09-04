// ============================================================
// 🔐 Password Reset Service
// Handles token generation, validation, and password updates
// Works with both Supabase Auth and Database-first approach
// ============================================================

import { getSupabaseServerClient, getSupabaseAdminClient } from './supabase';
import crypto from 'crypto';

// ============================================================
// Types
// ============================================================

export interface ResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  isUsed: boolean;
}

export interface PasswordResetOptions {
  email: string;
  ip?: string;
  userAgent?: string;
  locale?: 'ar' | 'en';
}

export interface PasswordResetResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
  errorKey?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

export interface PasswordConfirmResult {
  success: boolean;
  error?: string;
  errorKey?: string;
  user?: {
    id: string;
    email: string;
  };
}

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  // Token expiration time (1 hour)
  tokenExpirationHours: 1,
  // Token length in bytes (will be hex encoded, so double the length)
  tokenBytes: 32,
  // Max active tokens per user
  maxActiveTokens: 3,
  // Token prefix for identification
  tokenPrefix: 'pw_',
};

// ============================================================
// Token Generation
// ============================================================

/**
 * Generate a secure random reset token
 */
export function generateResetToken(): string {
  const bytes = crypto.randomBytes(CONFIG.tokenBytes);
  return CONFIG.tokenPrefix + bytes.toString('hex');
}

/**
 * Hash a token for storage (never store raw tokens)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its hash
 */
export function verifyToken(token: string, hashedToken: string): boolean {
  const inputHash = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(inputHash),
    Buffer.from(hashedToken)
  );
}

// ============================================================
// Main Service Functions
// ============================================================

/**
 * Request a password reset
 * Creates a reset token and sends email
 */
export async function requestPasswordReset(
  options: PasswordResetOptions
): Promise<PasswordResetResult> {
  const { email, ip, userAgent, locale = 'ar' } = options;

  try {
    const supabase = getSupabaseAdminClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, email_verified, is_banned, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (userError) {
      console.log(`[RESET-SERVICE] User not found or error: ${userError.message}`);
      
      // For security, don't reveal if user exists
      // Return success to prevent email enumeration
      if (userError.code === 'PGRST116') { // Not found
        return { success: true }; 
      }
      
      return {
        success: false,
        error: 'Database error occurred',
        errorKey: 'common.error',
      };
    }

    // Check if user account is active
    if (!user.is_active || user.is_banned) {
      console.log(`[RESET-SERVICE] Inactive/banned user attempted reset: ${email}`);
      // Still return success for security (don't reveal account status)
      return { success: true };
    }

    // Check for existing unused tokens and invalidate old ones
    await invalidateOldTokens(user.id);

    // Generate new token
    const rawToken = generateResetToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + CONFIG.tokenExpirationHours * 60 * 60 * 1000);

    // Store token in database
    const { error: insertError } = await supabase
      .from('verification_tokens')
      .insert({
        token: hashedToken,
        user_id: user.id,
        expires: expiresAt.toISOString(),
        type: 'password_reset',
      });

    if (insertError) {
      console.error('[RESET-SERVICE] Error storing token:', insertError.message);
      return {
        success: false,
        error: 'Failed to create reset token',
        errorKey: 'auth.token_creation_failed',
      };
    }

    // Log the request for audit
    await logPasswordResetEvent({
      userId: user.id,
      email,
      action: 'request',
      ip,
      userAgent,
      success: true,
    });

    console.log(`[RESET-SERVICE] Reset token created for user: ${user.id}`);

    // Return the raw token (for email sending - only returned once!)
    return {
      success: true,
      token: rawToken,
      expiresAt,
    };

  } catch (error) {
    console.error('[RESET-SERVICE] Error in requestPasswordReset:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      errorKey: 'common.error',
    };
  }
}

/**
 * Confirm password reset with token and new password
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string,
  ip?: string,
  userAgent?: string
): Promise<PasswordConfirmResult> {
  try {
    const supabase = getSupabaseAdminClient();

    // Hash the provided token
    const hashedToken = hashToken(token);

    // Look up the token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', hashedToken)
      .eq('type', 'password_reset')
      .single();

    if (tokenError || !tokenData) {
      console.log(`[RESET-SERVICE] Invalid or non-existent token`);
      await logPasswordResetEvent({
        userId: 'unknown',
        email: 'unknown',
        action: 'confirm_invalid_token',
        ip,
        userAgent,
        success: false,
        reason: 'Invalid token',
      });
      
      return {
        success: false,
        error: 'Invalid or expired reset token',
        errorKey: 'auth.invalid_reset_token',
      };
    }

    // Check if token is already used
    // (You might want to add an 'is_used' field to your schema)

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires);
    
    if (now > expiresAt) {
      console.log(`[RESET-SERVICE] Expired token used for user: ${tokenData.user_id}`);
      
      // Delete the expired token
      await supabase
        .from('verification_tokens')
        .delete()
        .eq('id', tokenData.id);

      await logPasswordResetEvent({
        userId: tokenData.user_id,
        email: 'unknown',
        action: 'confirm_expired_token',
        ip,
        userAgent,
        success: false,
        reason: 'Token expired',
      });

      return {
        success: false,
        error: 'Reset token has expired',
        errorKey: 'auth.reset_token_expired',
      };
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', tokenData.user_id)
      .single();

    if (userError || !user) {
      console.error(`[RESET-SERVICE] User not found for token: ${tokenData.user_id}`);
      return {
        success: false,
        error: 'User account not found',
        errorKey: 'auth.user_not_found',
      };
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[RESET-SERVICE] Error updating password:', updateError.message);
      return {
        success: false,
        error: 'Failed to update password',
        errorKey: 'auth.password_update_failed',
      };
    }

    // Delete ALL password reset tokens for this user (invalidate all old ones)
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'password_reset');

    // Log successful reset
    await logPasswordResetEvent({
      userId: user.id,
      email: user.email,
      action: 'confirm_success',
      ip,
      userAgent,
      success: true,
    });

    console.log(`[RESET-SASSWORD] Password reset successfully for user: ${user.id}`);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    };

  } catch (error) {
    console.error('[RESET-SERVICE] Error in confirmPasswordReset:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      errorKey: 'common.error',
    };
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Hash a password using bcrypt-like hashing (simplified for demo)
 * In production, use bcrypt/argon2 via a proper library
 */
async function hashPassword(password: string): Promise<string> {
  // For Supabase Auth, we don't need to hash manually
  // This is for database-first auth fallback
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Invalidate old unused tokens for a user
 */
async function invalidateOldTokens(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Delete all existing unused password reset tokens for this user
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'password_reset');

    console.log(`[RESET-SERVICE] Invalidated old tokens for user: ${userId}`);
  } catch (error) {
    console.error('[RESET-SERVICE] Error invalidating old tokens:', error);
  }
}

/**
 * Log password reset events for audit
 */
async function logPasswordResetEvent(event: {
  userId: string;
  email: string;
  action: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    
    await supabase.from('audit_logs').insert({
      user_id: event.userId,
      action: `password_reset_${event.action}`,
      details: {
        email: event.email,
        ip: event.ip,
        user_agent: event.userAgent,
        success: event.success,
        reason: event.reason,
        timestamp: new Date().toISOString(),
      },
      ip_address: event.ip,
    });
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.warn('[RESET-SERVICE] Failed to log audit event:', error);
  }
}

/**
 * Clean up expired tokens (call periodically via cron)
 */
export async function cleanupExpiredTokens(): Promise<{ deleted: number }> {
  try {
    const supabase = getSupabaseAdminClient();
    
    const { count, error } = await supabase
      .from('verification_tokens')
      .delete({ count: 'exact' })
      .eq('type', 'password_reset')
      .lt('expires', new Date().toISOString());

    if (error) {
      console.error('[RESET-SERVICE] Error cleaning up tokens:', error.message);
      return { deleted: 0 };
    }

    console.log(`[RESET-SERVICE] Cleaned up ${count} expired tokens`);
    return { deleted: count ?? 0 };
  } catch (error) {
    console.error('[RESET-SERVICE] Error in cleanupExpiredTokens:', error);
    return { deleted: 0 };
  }
}
