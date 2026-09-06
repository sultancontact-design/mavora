/**
 * Formatting Utilities for Mavora Mobile
 * Currency formatting (MAD), date formatting for Arabic locale
 * 
 * @module utils/formating
 */

import { APP_CONFIG } from '../constants/config';

// ============================================================
// Currency Formatting (Moroccan Dirham - MAD)
// ============================================================

/**
 * Format price in Moroccan Dirham with Arabic numerals
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted price string (e.g., "١٢٣٤ د.م.")
 */
export function formatPrice(
  amount: number,
  options: {
    showCurrency?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showCurrency = true, compact = false } = options;

  if (compact && amount >= 1000) {
    // Compact format: 1.2K د.م.
    const compactAmount = amount >= 1000000 
      ? (amount / 1000000).toFixed(1) + 'M'
      : (amount / 1000).toFixed(1) + 'K';
    
    return showCurrency 
      ? `${compactAmount} ${APP_CONFIG.currencySymbol}`
      : compactAmount;
  }

  // Format with Arabic-Indic numerals
  const formattedAmount = toArabicNumerals(amount.toLocaleString('ar-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
  }));

  return showCurrency 
    ? `${formattedAmount} ${APP_CONFIG.currencySymbol}`
    : formattedAmount;
}

/**
 * Parse price string back to number
 * @param priceString - The price string to parse
 * @returns Numeric value
 */
export function parsePrice(priceString: string): number {
  // Remove currency symbol and Arabic numerals, convert to Latin
  const cleaned = priceString
    .replace(new RegExp(APP_CONFIG.currencySymbol, 'g'), '')
    .trim()
    .split('')
    .map(char => {
      const arabicNumeral = '٠١٢٣٤٥٦٧٨٩'.indexOf(char);
      return arabicNumeral !== -1 ? arabicNumeral.toString() : char;
    })
    .join('');

  return parseFloat(cleaned.replace(/,/g, '')) || 0;
}

/**
 * Convert Latin numerals to Arabic-Indic numerals
 * @param str - String containing Latin numerals
 * @returns String with Arabic-Indic numerals
 */
export function toArabicNumerals(str: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
}

/**
 * Convert Arabic-Indic numerals to Latin numerals
 * @param str - String containing Arabic-Indic numerals
 * @returns String with Latin numerals
 */
export function toLatinNumerals(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => ('٠١٢٣٤٥٦٧٨٩'.indexOf(d)).toString());
}

// ============================================================
// Date & Time Formatting (Arabic Locale)
// ============================================================

/** Arabic month names */
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/** French month names (for Morocco bilingual support) */
const FRENCH_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/** Relative time labels (Arabic) */
const RELATIVE_TIME_AR: Record<string, string> = {
  now: 'الآن',
  justNow: 'الآن',
  minute_ago: 'منذ دقيقة',
  minutes_ago: 'منذ {count} دقائق',
  hour_ago: 'منذ ساعة',
  hours_ago: 'منذ {count} ساعات',
  yesterday: 'أمس',
  days_ago: 'منذ {count} أيام',
  week_ago: 'منذ أسبوع',
  weeks_ago: 'منذ {count} أسابيع',
  month_ago: 'منذ شهر',
  months_ago: 'منذ {count} أشهر',
  year_ago: 'منذ سنة',
  years_ago: 'منذ {count} سنوات',
};

/**
 * Format date to Arabic localized string
 * @param dateString - ISO date string or Date object
 * @param style - Format style ('short', 'long', 'relative')
 * @param language - Language for month names ('ar' | 'fr')
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  style: 'short' | 'long' | 'relative' = 'long',
  language: 'ar' | 'fr' = 'ar'
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return '';
  }

  if (style === 'relative') {
    return formatRelativeTime(date, language);
  }

  const months = language === 'ar' ? ARABIC_MONTHS : FRENCH_MONTHS;
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  if (style === 'short') {
    return `${toArabicNumerals(day.toString())} ${month}`;
  }

  return `${toArabicNumerals(day.toString())} ${month} ${toArabicNumerals(year.toString())}`;
}

/**
 * Format relative time (e.g., "منذ 5 دقائق")
 * @param date - Date object
 * @param language - Language for output
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date, language: 'ar' | 'fr' = 'ar'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (language === 'fr') {
    return formatRelativeTimeFr(diffSeconds, diffMinutes, diffHours, diffDays, diffWeeks, diffMonths, diffYears);
  }

  // Arabic relative time
  if (diffSeconds < 60) return RELATIVE_TIME_AR.now;
  if (diffMinutes < 2) return RELATIVE_TIME_AR.minute_ago;
  if (diffMinutes < 60) return RELATIVE_TIME_AR.minutes_ago.replace('{count}', toArabicNumerals(diffMinutes.toString()));
  if (diffHours < 2) return RELATIVE_TIME_AR.hour_ago;
  if (diffHours < 24) return RELATIVE_TIME_AR.hours_ago.replace('{count}', toArabicNumerals(diffHours.toString()));
  if (diffDays < 2) return RELATIVE_TIME_AR.yesterday;
  if (diffDays < 7) return RELATIVE_TIME_AR.days_ago.replace('{count}', toArabicNumerals(diffDays.toString()));
  if (diffWeeks < 2) return RELATIVE_TIME_AR.week_ago;
  if (diffWeeks < 4) return RELATIVE_TIME_AR.weeks_ago.replace('{count}', toArabicNumerals(diffWeeks.toString()));
  if (diffMonths < 2) return RELATIVE_TIME_AR.month_ago;
  if (diffMonths < 12) return RELATIVE_TIME_AR.months_ago.replace('{count}', toArabicNumerals(diffMonths.toString()));
  if (diffYears < 2) return RELATIVE_TIME_AR.year_ago;
  return RELATIVE_TIME_AR.years_ago.replace('{count}', toArabicNumerals(diffYears.toString()));
}

/**
 * French relative time formatter
 */
function formatRelativeTimeFr(
  _seconds: number,
  minutes: number,
  hours: number,
  days: number,
  weeks: number,
  months: number,
  years: number
): string {
  if (_seconds < 60) return "À l'instant";
  if (minutes < 2) return "Il y a une minute";
  if (minutes < 60) return `Il y a ${minutes} minutes`;
  if (hours < 2) return "Il y a une heure";
  if (hours < 24) return `Il y a ${hours} heures`;
  if (days < 2) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (weeks < 2) return "Il y a une semaine";
  if (weeks < 4) return `Il y a ${weeks} semaines`;
  if (months < 2) return "Il y a un mois";
  if (months < 12) return `Il y a ${months} mois`;
  if (years < 2) return "Il y a un an";
  return `Il y a ${years} ans`;
}

/**
 * Format time only (HH:MM)
 * @param dateString - ISO date string or Date object
 * @param is24Hour - Use 24-hour format
 * @returns Formatted time string
 */
export function formatTime(dateString: string | Date, is24Hour: boolean = true): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return '';
  }

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (!is24Hour) {
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${toArabicNumerals(hours.toString())}:${minutes} ${period}`;
  }

  return `${toArabicNumerals(hours.toString())}:${minutes}`;
}

// ============================================================
// Phone Number Formatting (Morocco)
// ============================================================

/**
 * Format Moroccan phone number
 * @param phone - Raw phone number
 * @returns Formatted phone number (+212 XX XXX XXXX)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if missing
  let fullNumber = digits;
  if (digits.startsWith('0')) {
    fullNumber = '212' + digits.substring(1);
  } else if (!digits.startsWith('212')) {
    fullNumber = '212' + digits;
  }

  // Format: +212 X XX XXX XXX
  if (fullNumber.length === 12) {
    return `+${fullNumber[0]}${fullNumber.slice(1, 4)} ${fullNumber[4]}${fullNumber.slice(5, 7)} ${fullNumber.slice(7, 10)} ${fullNumber.slice(10)}`;
  }

  return `+${fullNumber}`;
}

/**
 * Validate Moroccan phone number
 * @param phone - Phone number to validate
 * @returns Validation result
 */
export function validateMoroccanPhone(phone: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  const digits = phone.replace(/\D/g, '');
  
  // Check length
  if (digits.length < 10 || digits.length > 12) {
    return {
      isValid: false,
      error: 'رقم الهاتف غير صحيح',
    };
  }

  // Check prefix (Moroccan mobile: 6, 7; landline: 5)
  const last10Digits = digits.slice(-10);
  const firstDigit = last10Digits[0];
  
  if (!['5', '6', '7'].includes(firstDigit)) {
    return {
      isValid: false,
      error: 'رقم الهاتف يجب أن يبدأ بـ 5 أو 6 أو 7',
    };
  }

  return {
    isValid: true,
    formatted: formatPhoneNumber(phone),
  };
}

// ============================================================
// Text Formatting
// ============================================================

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter (works with Arabic)
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Get initials from name (for avatars)
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================================
// Number Formatting
// ============================================================

/**
 * Format number with commas (using Arabic numerals)
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return toArabicNumerals(num.toLocaleString('ar-MA'));
}

/**
 * Format percentage
 * @param value - Value (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${toArabicNumerals(Math.round(value).toString())}%`;
}

/**
 * Format file size
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '٠ بايت';
  
  const units = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${toArabicNumerals(size.toFixed(i > 0 ? 1 : 0))} ${units[i]}`;
}

// ============================================================
// Distance Formatting
// ============================================================

/**
 * Format distance (for map/listings)
 * @param meters - Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${toArabicNumerals(Math.round(meters).toString())} م`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${toArabicNumerals(km)} كم`;
}
