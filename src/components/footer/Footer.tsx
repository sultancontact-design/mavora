'use client';

import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Smartphone, 
  Download,
  Mail,
  Phone,
  MapPin,
  Heart,
  ExternalLink
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import MavoraLogo from '@/components/common/MavoraLogo';
import type { Locale } from '@/lib/types';

/* ── Constants ── */

const SOCIAL_LINKS = [
  { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:bg-blue-600 hover:text-white' },
  { icon: Twitter, href: '#', label: 'Twitter / X', color: 'hover:bg-sky-500 hover:text-white' },
  { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:bg-pink-600 hover:text-white' },
  { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:bg-red-600 hover:text-white' },
  { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:bg-blue-700 hover:text-white' },
];

const FOOTER_COUNTRIES = [
  { code: 'MA', flag: '🇲🇦', nameKey: 'footer.morocco', url: '/?country=MA' },
  { code: 'DZ', flag: '🇩🇿', nameKey: 'footer.algeria', url: '/?country=DZ' },
  { code: 'TN', flag: '🇹🇳', nameKey: 'footer.tunisia', url: '/?country=TN' },
  { code: 'EG', flag: '🇪🇬', nameKey: 'footer.egypt', url: '/?country=EG' },
  { code: 'SA', flag: '🇸🇦', nameKey: 'footer.saudi', url: '/?country=SA' },
  { code: 'AE', flag: '🇦🇪', nameKey: 'footer.uae', url: '/?country=AE' },
];

const COUNTRY_NAMES: Record<string, Record<Locale, string>> = {
  'footer.morocco': { ar: 'المغرب', fr: 'Maroc', en: 'Morocco' },
  'footer.algeria': { ar: 'الجزائر', fr: 'Algérie', en: 'Algeria' },
  'footer.tunisia': { ar: 'تونس', fr: 'Tunisie', en: 'Tunisia' },
  'footer.egypt': { ar: 'مصر', fr: 'Égypte', en: 'Egypt' },
  'footer.saudi': { ar: 'السعودية', fr: 'Arabie Saoudite', en: 'Saudi Arabia' },
  'footer.uae': { ar: 'الإمارات', fr: 'Émirats', en: 'UAE' },
};

const QUICK_LINKS = [
  { key: 'footer.about', href: '/about' },
  { key: 'footer.terms', href: '/terms' },
  { key: 'footer.privacy', href: '/privacy' },
  { key: 'footer.help', href: '/help' },
  { key: 'footer.contact', href: '/contact' },
];

const CATEGORY_LINKS = [
  { key: 'categories.vehicles', slug: 'vehicles', icon: '🚗' },
  { key: 'categories.real_estate', slug: 'real-estate', icon: '🏠' },
  { key: 'categories.electronics', slug: 'electronics', icon: '📱' },
  { key: 'categories.jobs', slug: 'jobs', icon: '💼' },
  { key: 'categories.services', slug: 'services', icon: '🔧' },
  { key: 'categories.fashion', slug: 'fashion', icon: '👗' },
];

/* ── Main Component ── */

export default function Footer() {
  const { t, locale } = useTranslation();

  const getCountryName = (nameKey: string): string => {
    return COUNTRY_NAMES[nameKey]?.[locale] ?? nameKey;
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-white">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-teal-500 via-violet-500 to-gold" />
      
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          
          {/* ── Column 1: Brand & Social (spans 2 cols on lg) ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <MavoraLogo size="md" className="text-white mb-5" />
            
            {/* Tagline */}
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-gray-400">
              {t('app.tagline')}
            </p>

            {/* Contact Info */}
            <div className="mb-6 space-y-3">
              <a 
                href="mailto:support@mavora.ma" 
                className="flex items-center gap-2.5 text-sm text-gray-400 transition-all duration-200 hover:text-teal-400 group"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-gray-800 group-hover:bg-teal-900/50 transition-colors">
                  <Mail className="size-4" />
                </div>
                support@mavora.ma
              </a>
              <a 
                href="tel:+212500000000" 
                className="flex items-center gap-2.5 text-sm text-gray-400 transition-all duration-200 hover:text-teal-400 group"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-gray-800 group-hover:bg-teal-900/50 transition-colors">
                  <Phone className="size-4" />
                </div>
                +212 5 00 00 00 00
              </a>
              <div className="flex items-start gap-2.5 text-sm text-gray-400">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-800 mt-0.5">
                  <MapPin className="size-4" />
                </div>
                <span>Casablanca, Morocco</span>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                {locale === 'ar' ? 'تابعنا' : locale === 'fr' ? 'Suivez-nous' : 'Follow Us'}
              </p>
              <div className="flex items-center gap-2.5">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex size-10 items-center justify-center rounded-xl bg-gray-800 text-gray-400 transition-all duration-200 hover:scale-110 ${social.color}`}
                    >
                      <Icon className="size-4.5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-500">
              {t('footer.about')}
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-gray-400 transition-all duration-200 hover:text-white"
                  >
                    {t(link.key)}
                    <ExternalLink className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Categories ── */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-500">
              {t('categories.title')}
            </h3>
            <ul className="space-y-3">
              {CATEGORY_LINKS.map((cat) => (
                <li key={cat.slug}>
                  <a
                    href={`/category/${cat.slug}`}
                    className="inline-flex items-center gap-2.5 text-sm text-gray-400 transition-all duration-200 hover:text-teal-400"
                  >
                    <span className="text-base">{cat.icon}</span>
                    {t(cat.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Countries ── */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-500">
              {t('footer.countries')}
            </h3>
            <ul className="space-y-3">
              {FOOTER_COUNTRIES.map((country) => (
                <li key={country.code}>
                  <a
                    href={country.url}
                    className="inline-flex items-center gap-2.5 text-sm text-gray-400 transition-all duration-200 hover:text-teal-400"
                  >
                    <span>{country.flag}</span>
                    <span>{getCountryName(country.nameKey)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 5: Download App ── */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-500">
              {locale === 'ar'
                ? 'حمّل التطبيق'
                : locale === 'fr'
                  ? 'Télécharger l\'app'
                  : 'Download App'}
            </h3>
            
            <p className="mb-5 text-xs leading-relaxed text-gray-500">
              {locale === 'ar'
                ? 'احصل على أفضل تجربة مع تطبيق مافورا للموبايل'
                : locale === 'fr'
                  ? 'Obtenez la meilleure expérience avec l\'application MAVORA'
                  : 'Get the best experience with MAVORA mobile app'}
            </p>

            <div className="space-y-3">
              {/* Google Play Button */}
              <a
                href="/coming-soon"
                className="flex h-12 w-full items-center gap-3 rounded-xl bg-gray-800/50 px-4 transition-all duration-200 hover:bg-gray-800 opacity-60 cursor-not-allowed border border-gray-700/50"
                aria-label="Download on Google Play"
                onClick={(e) => e.preventDefault()}
              >
                <Smartphone className="size-5 shrink-0 text-teal-400" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">
                    {locale === 'fr' ? 'Bientôt disponible' : locale === 'ar' ? 'قريباً' : 'COMING SOON'}
                  </span>
                  <span className="text-sm font-semibold">Google Play</span>
                </div>
              </a>
              
              {/* App Store Button */}
              <a
                href="/coming-soon"
                className="flex h-12 w-full items-center gap-3 rounded-xl bg-gray-800/50 px-4 transition-all duration-200 hover:bg-gray-800 opacity-60 cursor-not-allowed border border-gray-700/50"
                aria-label="Download on App Store"
                onClick={(e) => e.preventDefault()}
              >
                <Download className="size-5 shrink-0 text-violet-400" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">
                    {locale === 'fr' ? 'Bientôt disponible' : locale === 'ar' ? 'قريباً' : 'COMING SOON'}
                  </span>
                  <span className="text-sm font-semibold">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Copyright */}
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              © {currentYear} MAVORA. {t('footer.rights')}.
              <span className="hidden sm:inline">
                Made with
                <Heart className="inline size-3.5 mx-1 text-rose-500 fill-rose-500 animate-pulse" />
                in Morocco
              </span>
            </p>

            {/* Legal Links */}
            <nav className="flex items-center gap-5" aria-label="Footer navigation">
              <a 
                href="/terms" 
                className="text-xs text-gray-500 transition-colors hover:text-teal-400 link-underline"
              >
                {t('footer.terms')}
              </a>
              <span className="text-gray-700">|</span>
              <a 
                href="/privacy" 
                className="text-xs text-gray-500 transition-colors hover:text-teal-400 link-underline"
              >
                {t('footer.privacy')}
              </a>
              <span className="text-gray-700">|</span>
              <a 
                href="/contact" 
                className="text-xs text-gray-500 transition-colors hover:text-teal-400 link-underline"
              >
                {t('footer.contact')}
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
