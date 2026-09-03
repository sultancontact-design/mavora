'use client';

import { useLocaleStore } from '@/stores/locale';
import ar from '@/i18n/ar.json';
import fr from '@/i18n/fr.json';
import en from '@/i18n/en.json';
import type { Locale } from '@/lib/types';

const translations: Record<Locale, Record<string, string>> = { ar, fr, en };

export function useTranslation() {
  const { locale } = useLocaleStore();
  const t = (key: string, fallback?: string): string => {
    return translations[locale]?.[key] ?? fallback ?? key;
  };
  return { t, locale };
}
