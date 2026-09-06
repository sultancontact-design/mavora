/**
 * Auth Context for Mavora Mobile
 * Manages authentication state and user session
 * 
 * @module context/AuthContext
 */

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseClient';

// Types
interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  is_seller?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: any | null;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: any }
  | { type: 'LOGOUT' };

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  session: null,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'LOGOUT' });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUser(session.user.id);
        dispatch({ type: 'SET_SESSION', payload: session });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('[Auth] Session check error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        dispatch({ type: 'SET_USER', payload: data });
      }
    } catch (error) {
      console.error('[Auth] Fetch user error:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string
  ): Promise<{ error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'حدث خطأ أثناء إنشاء الحساب' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!state.user) return;

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', state.user.id);

      if (!error) {
        dispatch({
          type: 'SET_USER',
          payload: { ...state.user, ...updates },
        });
      }
    } catch (error) {
      console.error('[Auth] Update profile error:', error);
    }
  };

  const refreshUser = async () => {
    if (state.user) {
      await fetchUser(state.user.id);
    }
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
