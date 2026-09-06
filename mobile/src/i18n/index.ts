/**
 * Internationalization (i18n) Configuration for Mavora Mobile
 * Arabic (primary) and French (secondary) support for Morocco
 * 
 * @module i18n
 */

import I18n from 'i18n-js';
import { AsyncStorage } from '@react-native-async-storage/async-storage';

// Import translations
import ar from './ar.json';
import fr from './fr.json';

// ============================================================
// I18n Configuration
// ============================================================

I18n.translations = {
  ar,
  fr,
};

// Set default locale to Arabic (Morocco)
I18n.defaultLocale = 'ar';
I18n.locale = 'ar';

// RTL locale detection
export const RTL_LOCALES: string[] = ['ar'];

/**
 * Check if a locale is RTL
 * @param locale - Locale code
 * @returns True if RTL locale
 */
export function isRTL(locale: string = I18n.locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get current text direction based on locale
 * @returns 'rtl' or 'ltr'
 */
export function getTextDirection(): 'rtl' | 'ltr' {
  return isRTL() ? 'rtl' : 'ltr';
}

// ============================================================
// Translation Function
// ============================================================

/**
 * Translate a key with optional interpolation
 * @param key - Translation key (dot notation supported)
 * @param options - Interpolation options
 * @returns Translated string
 * 
 * @example
 * t('common.ok') // 'موافق'
 * t('listings.resultsCount', { count: '٥' }) // '٥ نتيجة'
 */
export function t(
  key: string,
  options?: Record<string, string | number>
): string {
  try {
    return I18n.t(key, options);
  } catch (error) {
    console.warn(`[i18n] Missing translation key: ${key}`);
    return key;
  }
}

/**
 * Check if translation key exists
 * @param key - Translation key
 * @returns True if key exists
 */
export function hasTranslation(key: string): boolean {
  try {
    return I18n.t(key) !== key;
  } catch {
    return false;
  }
}

// ============================================================
// Language Management
// ============================================================

const STORAGE_KEY = '@mavora_language';

/** Supported languages */
export const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية', nativeName: 'العربية', direction: 'rtl' as const },
  { code: 'fr', name: 'Français', nativeName: 'Français', direction: 'ltr' as const },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

/**
 * Set application language
 * @param lang - Language code ('ar' | 'fr')
 */
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  I18n.locale = lang;
  
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.error('[i18n] Error saving language:', error);
  }
}

/**
 * Load saved language preference
 * @returns Current language code
 */
export async function loadLanguage(): Promise<SupportedLanguage> {
  try {
    const savedLang = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (savedLang && (savedLang === 'ar' || savedLang === 'fr')) {
      I18n.locale = savedLang;
      return savedLang;
    }
    
    return 'ar'; // Default to Arabic
  } catch (error) {
    console.error('[i18n] Error loading language:', error);
    return 'ar';
  }
}

/**
 * Get current language code
 * @returns Current language code
 */
export function getCurrentLanguage(): SupportedLanguage {
  return I18n.locale as SupportedLanguage;
}

/**
 * Get current language info
 * @returns Language object with name, direction, etc.
 */
export function getLanguageInfo() {
  const currentLang = getCurrentLanguage();
  return SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
}

// ============================================================
// Pluralization Helpers (Arabic)
// ============================================================

/**
 * Arabic plural forms helper
 * @param count - Number for pluralization
 * @param forms - Plural forms [zero, one, two, few, many, other]
 * @returns Correct plural form
 * 
 * @example
 * arabicPlural(1, ['لا نتائج', 'نتيجة واحدة', 'نتيجتان', '{count} نتائج', '{count} نتيجة', '{count} نتيجة'])
 */
export function arabicPlural(
  count: number,
  forms: [string, string, string, string, string, string]
): string {
  const mod100 = count % 100;
  
  if (count === 0) return forms[0]; // zero
  if (count === 1) return forms[1]; // one
  if (count === 2) return forms[2]; // two
  if (mod100 >= 3 && mod100 <= 10) return forms[3].replace('{count}', String(count)); // few
  
  return forms[5].replace('{count}', String(count)); // other/many
}

// ============================================================
// Date/Time Localization
// ============================================================

/**
 * Get locale-aware date formatter
 * @param style - Date style
 * @returns Formatted date string
 */
export function getLocalizedDate(date: Date, style: 'short' | 'long' = 'long'): string {
  const locale = I18n.locale === 'ar' ? 'ar-MA' : 'fr-FR';
  
  const options: Intl.DateTimeFormatOptions = style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short' };
  
  return date.toLocaleDateString(locale, options);
}

// ============================================================
// Exports
// ============================================================

export default I18n;

// Re-export for convenience
export { I18n };
