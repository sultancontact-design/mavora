import type { Locale, Direction } from './types';

export const locales: Locale[] = ['ar', 'fr', 'en'];
export const defaultLocale: Locale = 'ar';

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  fr: 'Français',
  en: 'English',
};

export const localeDirections: Record<Locale, Direction> = {
  ar: 'rtl',
  fr: 'ltr',
  en: 'ltr',
};
