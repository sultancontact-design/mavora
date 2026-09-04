/**
 * UUID Utilities for Supabase Compatibility
 * 
 * Problem: Supabase's auth.uid() returns UUID type, but our tables use TEXT columns
 * Solution: Helper functions to ensure proper type handling
 * 
 * @module lib/uuid-utils
 */

/**
 * Convert any value to string for safe database comparisons
 * This ensures UUID values are properly cast when comparing with TEXT columns
 */
export function toTextId(id: string | null | undefined): string | null {
  if (id === null || id === undefined) return null;
  return String(id);
}

/**
 * Safely compare two IDs that might be UUID or text
 * Returns true if both IDs match when converted to strings
 */
export function idsMatch(id1: string | null | undefined, id2: string | null | undefined): boolean {
  if (!id1 || !id2) return false;
  return String(id1).toLowerCase() === String(id2).toLowerCase();
}

/**
 * Create a filter object for Supabase queries that handles UUID/text mismatch
 * Usage: .eq('userId', uuidFilter(authUserId))
 */
export function uuidFilter(id: string | null | undefined): string | null {
  return toTextId(id);
}

/**
 * Wrap auth.uid() comparison for RLS-safe queries
 * When building queries that will be checked against RLS policies,
 * use this to ensure the ID is in the correct format
 */
export function authUid(userId: string): string {
  return String(userId);
}

/**
 * Generate a new UUID string (text format)
 * Uses crypto.randomUUID() or falls back to manual generation
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
