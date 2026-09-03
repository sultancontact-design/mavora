'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/lib/types';

type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';

interface AuthChangeEvent {
  event: string;
  session: unknown;
}

/**
 * AuthProvider fetches the current session on mount and listens for
 * Supabase auth state changes, keeping the Zustand auth store in sync.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    // Fetch initial session
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (mounted.current) {
            setUser(data.user);
          }
        }
      } catch {
        // Silently fail — user stays null
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    }

    fetchSession();

    // Listen for auth state changes from Supabase client
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (!mounted.current) return;

        const relevantEvents: AuthEvent[] = ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'];
        if (!relevantEvents.includes(event as AuthEvent)) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        // Re-fetch session for fresh profile data
        try {
          const res = await fetch('/api/auth/session');
          if (res.ok) {
            const data = await res.json();
            if (mounted.current) {
              setUser(data.user);
            }
          }
        } catch {
          // Silently fail
        } finally {
          if (mounted.current) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
