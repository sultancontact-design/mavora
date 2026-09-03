import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/lib/types';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'ar' as Locale,
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'mavora-locale' }
  )
);
