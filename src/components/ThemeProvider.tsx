'use client';

/**
 * ThemeProvider - مزود السمة (داكن/فاتح)
 * 2026 Modern Implementation with next-themes
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────

type Theme = 'light' | 'dark' | 'system';
type Locale = 'ar' | 'fr' | 'en';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// ─── Context ─────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  locale: 'ar',
  setLocale: () => {},
});

// ─── Hook ────────────────────────────────────────────────

export const useThemeContext = () => useContext(ThemeContext);

// ─── Theme Toggle Component ──────────────────────────────

interface ThemeToggleProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showLabel?: boolean;
}

export function ThemeToggle({ 
  variant = 'default', 
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, setTheme } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  if (variant === 'icon-only') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="rounded-lg relative overflow-hidden"
        aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      >
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Moon className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Sun className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { value: 'light', icon: Sun, label: 'فاتح' },
          { value: 'system', icon: Monitor, label: 'تلقائي' },
          { value: 'dark', icon: Moon, label: 'داكن' },
        ].map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            variant={theme === value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme(value as Theme)}
            className={`rounded-md gap-1.5 ${theme === value ? 'shadow-sm' : ''}`}
          >
            <Icon className="w-4 h-4" />
            {showLabel && <span>{label}</span>}
          </Button>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="gap-2 rounded-lg border-gray-200 dark:border-gray-700"
      >
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Moon className="w-4 h-4 text-violet-500" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.3 }}
            >
              <Sun className="w-4 h-4 text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
        <span>{theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح'}</span>
      </Button>
    </div>
  );
}

// ─── Main Provider Component ─────────────────────────────

interface MavoraThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultLocale?: Locale;
}

export function MavoraThemeProvider({ 
  children, 
  defaultTheme = 'system',
  defaultLocale = 'ar'
}: MavoraThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('mavora-theme') as Theme;
      const savedLocale = localStorage.getItem('mavora-locale') as Locale;
      
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
      if (savedLocale && ['ar', 'fr', 'en'].includes(savedLocale)) {
        setLocale(savedLocale);
      }
    } catch (e) {
      console.warn('Failed to load theme preferences:', e);
    }
  }, []);

  // Save theme changes
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('mavora-theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  };

  // Save locale changes
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem('mavora-locale', newLocale);
    } catch (e) {
      console.warn('Failed to save locale:', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, locale, setLocale: handleSetLocale }}>
      <NextThemesProvider
        attribute="class"
        defaultTheme={defaultTheme}
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        {/* Smooth transitions for theme changes */}
        <div className={`theme-transition ${theme}`}>
          {children}
        </div>
        
        {/* Global Styles for Theme Transitions */}
        <style jsx global>{`
          .theme-transition * {
            transition: background-color 300ms ease, color 200ms ease, border-color 300ms ease !important;
          }
          
          /* Custom scrollbar for dark mode */
          .dark ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .dark ::-webkit-scrollbar-track {
            background: #1f2937;
          }
          
          .dark ::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 4px;
          }
          
          .dark ::-webkit-scrollbar-thumb:hover {
            background: #4b5563;
          }
          
          /* Selection colors */
          ::selection {
            background-color: rgba(139, 92, 246, 0.3);
            color: inherit;
          }
          
          /* Focus styles */
          :focus-visible {
            outline: 2px solid #8b5cf6;
            outline-offset: 2px;
          }
        `}</style>
      </NextThemesProvider>
    </ThemeContext.Provider>
  );
}

// ─── Export Default Provider ─────────────────────────────

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MavoraThemeProvider defaultTheme="system" defaultLocale="ar">
      {children}
    </MavoraThemeProvider>
  );
}
