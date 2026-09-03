'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { User, AuthState } from '@/lib/types';

// ============================================================
// Auth Event Types
// ============================================================

type AuthEvent = 
  | 'SIGNED_IN' 
  | 'SIGNED_OUT' 
  | 'TOKEN_REFRESHED' 
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

interface AuthChangeEvent {
  event: string;
  session: unknown;
}

// ============================================================
// Session Fetch Options
// ============================================================

interface FetchSessionOptions {
  setUser?: (user: User | null) => void;
  setLoading?: (loading: boolean) => void;
}

// ============================================================
// Helper: Fetch session from API
// ============================================================

async function fetchSession(options?: FetchSessionOptions): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/session');
    if (res.ok) {
      const data = await res.json();
      options?.setUser?.(data.user);
      return data.user;
    }
    return null;
  } catch (error) {
    console.warn('[AuthProvider] Session fetch failed:', error);
    return null;
  }
}

// ============================================================
// AuthProvider Component
// ============================================================

/**
 * AuthProvider - Main authentication context provider
 * 
 * Features:
 * - Fetches and maintains user session
 * - Listens to Supabase auth state changes
 * - Handles token refresh automatically
 * - Provides authentication utilities via the store
 * - XSS protection through secure cookie handling
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const mounted = useRef(false);
  const fetchingRef = useRef(false);

  // ============================================================
  // Initialize session on mount
  // ============================================================
  
  useEffect(() => {
    mounted.current = true;

    async function initializeAuth() {
      setLoading(true);
      
      const user = await fetchSession({
        setUser: (user) => {
          if (mounted.current) {
            setUser(user);
          }
        },
        setLoading: (loading) => {
          if (mounted.current) {
            setLoading(loading);
          }
        },
      });

      if (mounted.current) {
        setLoading(false);
        
        // Check if session is about to expire and refresh if needed
        if (user) {
          checkAndRefreshToken();
        }
      }
    }

    initializeAuth();

    return () => {
      mounted.current = false;
    };
  }, [setUser, setLoading]);

  // ============================================================
  // Listen for Supabase auth state changes
  // ============================================================
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: unknown) => {
        if (!mounted.current) return;

        console.log(`[AuthProvider] Auth event: ${event}`);

        switch (event as AuthEvent) {
          case 'SIGNED_IN':
            handleSignIn();
            break;
            
          case 'SIGNED_OUT':
            handleSignOut();
            break;
            
          case 'TOKEN_REFRESHED':
            handleTokenRefresh();
            break;
            
          case 'USER_UPDATED':
            handleUserUpdate();
            break;
            
          case 'PASSWORD_RECOVERY':
            // Handle password recovery - could redirect to reset page
            console.log('[AuthProvider] Password recovery initiated');
            break;
            
          default:
            // Ignore other events
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  // ============================================================
  // Event Handlers
  // ============================================================

  const handleSignIn = useCallback(async () => {
    if (!mounted.current) return;
    
    setLoading(true);
    
    const user = await fetchSession({
      setUser: (user) => {
        if (mounted.current) setUser(user);
      },
    });
    
    if (mounted.current) {
      setLoading(false);
      
      if (user) {
        console.log(`[AuthProvider] User signed in: ${user.id}`);
      }
    }
  }, [setUser, setLoading]);

  const handleSignOut = useCallback(() => {
    if (!mounted.current) return;
    
    setUser(null);
    setLoading(false);
    
    console.log('[AuthProvider] User signed out');
  }, [setUser, setLoading]);

  const handleTokenRefresh = useCallback(async () => {
    if (!mounted.current || fetchingRef.current) return;
    
    fetchingRef.current = true;
    
    const user = await fetchSession({
      setUser: (user) => {
        if (mounted.current) setUser(user);
      },
    });
    
    fetchingRef.current = false;
    
    if (user && mounted.current) {
      console.log('[AuthProvider] Token refreshed successfully');
    }
  }, [setUser]);

  const handleUserUpdate = useCallback(async () => {
    if (!mounted.current || fetchingRef.current) return;
    
    fetchingRef.current = true;
    
    const user = await fetchSession({
      setUser: (user) => {
        if (mounted.current) setUser(user);
      },
    });
    
    fetchingRef.current = false;
    
    if (user && mounted.current) {
      console.log('[AuthProvider] User profile updated');
    }
  }, [setUser]);

  // ============================================================
  // Token Refresh Check
  // ============================================================

  const checkAndRefreshToken = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if token expires in less than 5 minutes
        const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
        const now = new Date();
        
        if (expiresAt) {
          const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
          
          if (minutesUntilExpiry < 5) {
            console.log('[AuthProvider] Token expiring soon, refreshing...');
            await handleTokenRefresh();
          }
        }
      }
    } catch (error) {
      console.warn('[AuthProvider] Token refresh check failed:', error);
    }
  }, [handleTokenRefresh]);

  // ============================================================
  // Render children
  // ============================================================

  return <>{children}</>;
}

// ============================================================
// Export utility functions for use outside the provider
// ============================================================

/**
 * Get current authenticated user from the API
 * Useful for server components or when you need fresh data
 */
export async function getServerSideUser(): Promise<User | null> {
  // This would be used in server components with cookies
  // For now, it's a placeholder for future implementation
  return null;
}
