'use client';

import { Facebook, Twitter, Instagram, Youtube, Smartphone, Download } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const SOCIAL_LINKS = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

const FOOTER_COUNTRIES = [
  { code: 'MA', flag: '🇲🇦', nameKey: 'footer.morocco' },
  { code: 'DZ', flag: '🇩🇿', nameKey: 'footer.algeria' },
  { code: 'TN', flag: '🇹🇳', nameKey: 'footer.tunisia' },
  { code: 'EG', flag: '🇪🇬', nameKey: 'footer.egypt' },
  { code: 'SA', flag: '🇸🇦', nameKey: 'footer.saudi' },
  { code: 'AE', flag: '🇦🇪', nameKey: 'footer.uae' },
];

const COUNTRY_NAMES: Record<string, Record<string, string>> = {
  'footer.morocco': { ar: 'المغرب', fr: 'Maroc', en: 'Morocco' },
  'footer.algeria': { ar: 'الجزائر', fr: 'Algérie', en: 'Algeria' },
  'footer.tunisia': { ar: 'تونس', fr: 'Tunisie', en: 'Tunisia' },
  'footer.egypt': { ar: 'مصر', fr: 'Égypte', en: 'Egypt' },
  'footer.saudi': { ar: 'السعودية', fr: 'Arabie Saoudite', en: 'Saudi Arabia' },
  'footer.uae': { ar: 'الإمارات', fr: 'Émirats', en: 'UAE' },
};

function MavoraLogoSmall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MAVORA"
    >
      <path
        d="M8 8 L22 32 L28 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18 32 L22 32 L26 24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M32 32 L46 8 L52 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M42 8 L46 8 L50 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="60"
        y="28"
        fontFamily="var(--font-inter), sans-serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="2"
        fill="currentColor"
      >
        MAVORA
      </text>
    </svg>
  );
}

export default function Footer() {
  const { t, locale } = useTranslation();

  const getCountryName = (nameKey: string) => {
    return COUNTRY_NAMES[nameKey]?.[locale] ?? nameKey;
  };

  return (
    <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Logo, tagline, social */}
          <div className="sm:col-span-2 lg:col-span-1">
            <MavoraLogoSmall className="mb-4 h-8 w-auto text-primary-foreground" />
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              {t('app.tagline')}
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              {t('footer.about')}
            </h3>
            <ul className="space-y-2.5">
              {[
                { key: 'footer.about', href: '#' },
                { key: 'footer.terms', href: '#' },
                { key: 'footer.privacy', href: '#' },
                { key: 'footer.help', href: '#' },
                { key: 'footer.contact', href: '#' },
              ].map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Countries */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              {t('footer.countries')}
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_COUNTRIES.map((country) => (
                <li key={country.code}>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    <span>{country.flag}</span>
                    <span>{getCountryName(country.nameKey)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Download app */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
              {locale === 'ar'
                ? 'حمّل التطبيق'
                : locale === 'fr'
                  ? 'Télécharger l\'app'
                  : 'Download App'}
            </h3>
            <div className="space-y-3">
              <div className="flex h-11 w-full items-center gap-2.5 rounded-lg bg-primary-foreground/10 px-3 transition-colors hover:bg-primary-foreground/20">
                <Smartphone className="size-5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-primary-foreground/50">
                    {locale === 'fr' ? 'Bientôt sur' : locale === 'ar' ? 'قريباً على' : 'Coming soon on'}
                  </span>
                  <span className="text-xs font-semibold">Google Play</span>
                </div>
              </div>
              <div className="flex h-11 w-full items-center gap-2.5 rounded-lg bg-primary-foreground/10 px-3 transition-colors hover:bg-primary-foreground/20">
                <Download className="size-5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-primary-foreground/50">
                    {locale === 'fr' ? 'Bientôt sur' : locale === 'ar' ? 'قريباً على' : 'Coming soon on'}
                  </span>
                  <span className="text-xs font-semibold">App Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="mt-10 border-t border-primary-foreground/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-primary-foreground/50 sm:flex-row">
            <p>
              © {new Date().getFullYear()} MAVORA. {t('footer.rights')}.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="transition-colors hover:text-primary-foreground">
                {t('footer.terms')}
              </a>
              <a href="#" className="transition-colors hover:text-primary-foreground">
                {t('footer.privacy')}
              </a>
              <a href="#" className="transition-colors hover:text-primary-foreground">
                {t('footer.contact')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
