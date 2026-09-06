/**
 * Theme Context for Mavora Mobile
 * Manages light/dark theme and RTL/LTR layout
 * 
 * @module context/ThemeContext
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';
type LanguageDirection = 'rtl' | 'ltr';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

interface ThemeState {
  mode: ThemeMode;
  direction: LanguageDirection;
  language: 'ar' | 'en' | 'fr';
  colors: ThemeColors;
}

interface ThemeContextType extends ThemeState {
  toggleTheme: () => void;
  setLanguage: (lang: 'ar' | 'en' | 'fr') => void;
  isDark: boolean;
}

const LIGHT_COLORS: ThemeColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

const DARK_COLORS: ThemeColors = {
  primary: '#818cf8',
  secondary: '#a78bfa',
  background: '#111827',
  surface: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  border: '#374151',
  error: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [state, setState] = useState<ThemeState>({
    mode: 'light',
    direction: 'rtl',
    language: 'ar',
    colors: LIGHT_COLORS,
  });

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  // Update colors when theme changes
  useEffect(() => {
    const colors = state.mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    setState(prev => ({ ...prev, colors }));
  }, [state.mode]);

  const loadPreferences = async () => {
    try {
      const [savedTheme, savedLanguage] = await Promise.all([
        AsyncStorage.getItem('theme_mode'),
        AsyncStorage.getItem('app_language'),
      ]);

      setState(prev => ({
        ...prev,
        mode: (savedTheme as ThemeMode) || (systemColorScheme === 'dark' ? 'dark' : 'light'),
        language: (savedLanguage as 'ar' | 'en' | 'fr') || 'ar',
        direction: ((savedLanguage as string) || 'ar') === 'ar' ? 'rtl' : 'ltr',
      }));
    } catch (error) {
      console.error('[Theme] Load error:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = state.mode === 'light' ? 'dark' : 'light';
    
    setState(prev => ({
      ...prev,
      mode: newMode,
      colors: newMode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    }));

    await AsyncStorage.setItem('theme_mode', newMode);
  };

  const setLanguage = async (lang: 'ar' | 'en' | 'fr') => {
    const direction = lang === 'ar' ? 'rtl' : 'ltr';
    
    setState(prev => ({
      ...prev,
      language: lang,
      direction,
    }));

    await Promise.all([
      AsyncStorage.setItem('app_language', lang),
      // In production, you would also update I18nManager here
    ]);
  };

  const value: ThemeContextType = {
    ...state,
    isDark: state.mode === 'dark',
    toggleTheme,
    setLanguage,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
