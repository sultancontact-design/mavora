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
  { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:bg-blue-600' },
  { icon: Twitter, href: '#', label: 'Twitter / X', color: 'hover:bg-sky-500' },
  { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:bg-pink-600' },
  { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:bg-red-600' },
  { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:bg-blue-700' },
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
    <footer className="mt-auto bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          
          {/* ── Column 1: Brand & Social (spans 2 cols on lg) ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <MavoraLogo size="md" className="text-primary-foreground mb-4" />
            
            {/* Tagline */}
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              {t('app.tagline')}
            </p>

            {/* Contact Info */}
            <div className="mb-6 space-y-3">
              <a 
                href="mailto:support@mavora.ma" 
                className="flex items-center gap-2.5 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                <Mail className="size-4 shrink-0" />
                support@mavora.ma
              </a>
              <a 
                href="tel:+212500000000" 
                className="flex items-center gap-2.5 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                <Phone className="size-4 shrink-0" />
                +212 5 00 00 00 00
              </a>
              <div className="flex items-start gap-2.5 text-sm text-primary-foreground/70">
                <MapPin className="size-4 shrink-0 mt-0.5" />
                <span>Casablanca, Morocco</span>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
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
                      className={`flex size-9 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20 hover:scale-110 ${social.color} hover:text-white`}
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              {t('footer.about')}
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 transition-colors duration-200 hover:text-primary-foreground"
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
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              {t('categories.title')}
            </h3>
            <ul className="space-y-2.5">
              {CATEGORY_LINKS.map((cat) => (
                <li key={cat.slug}>
                  <a
                    href={`/category/${cat.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors duration-200 hover:text-primary-foreground"
                  >
                    <span>{cat.icon}</span>
                    {t(cat.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Countries ── */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              {t('footer.countries')}
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_COUNTRIES.map((country) => (
                <li key={country.code}>
                  <a
                    href={country.url}
                    className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors duration-200 hover:text-primary-foreground"
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
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              {locale === 'ar'
                ? 'حمّل التطبيق'
                : locale === 'fr'
                  ? 'Télécharger l\'app'
                  : 'Download App'}
            </h3>
            
            <p className="mb-4 text-xs leading-relaxed text-primary-foreground/60">
              {locale === 'ar'
                ? 'احصل على أفضل تجربة مع تطبيق مافورا للموبايل'
                : locale === 'fr'
                  ? 'Obtenez la meilleure expérience avec l\'application MAVORA'
                  : 'Get the best experience with MAVORA mobile app'}
            </p>

            <div className="space-y-3">
              {/* Google Play Button */}
              <a
                href="#"
                className="flex h-11 w-full items-center gap-2.5 rounded-lg bg-primary-foreground/10 px-4 transition-all duration-200 hover:bg-primary-foreground/20 hover:scale-[1.02]"
                aria-label="Download on Google Play"
              >
                <Smartphone className="size-5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-primary-foreground/50">
                    {locale === 'fr' ? 'Disponible sur' : locale === 'ar' ? 'متوفر على' : 'GET IT ON'}
                  </span>
                  <span className="text-sm font-semibold">Google Play</span>
                </div>
              </a>
              
              {/* App Store Button */}
              <a
                href="#"
                className="flex h-11 w-full items-center gap-2.5 rounded-lg bg-primary-foreground/10 px-4 transition-all duration-200 hover:bg-primary-foreground/20 hover:scale-[1.02]"
                aria-label="Download on App Store"
              >
                <Download className="size-5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-primary-foreground/50">
                    {locale === 'fr' ? 'Disponible sur' : locale === 'ar' ? 'متوفر على' : 'Download on'}
                  </span>
                  <span className="text-sm font-semibold">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Copyright */}
            <p className="flex items-center gap-1 text-xs text-primary-foreground/50">
              © {currentYear} MAVORA. {t('footer.rights')}.
              <span className="hidden sm:inline">
                Made with
                <Heart className="inline size-3 mx-0.5 text-red-400 fill-red-400" />
                in Morocco
              </span>
            </p>

            {/* Legal Links */}
            <nav className="flex items-center gap-4" aria-label="Footer navigation">
              <a 
                href="/terms" 
                className="text-xs text-primary-foreground/50 transition-colors hover:text-primary-foreground link-underline"
              >
                {t('footer.terms')}
              </a>
              <span className="text-primary-foreground/20">|</span>
              <a 
                href="/privacy" 
                className="text-xs text-primary-foreground/50 transition-colors hover:text-primary-foreground link-underline"
              >
                {t('footer.privacy')}
              </a>
              <span className="text-primary-foreground/20">|</span>
              <a 
                href="/contact" 
                className="text-xs text-primary-foreground/50 transition-colors hover:text-primary-foreground link-underline"
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
