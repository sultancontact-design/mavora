'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[#1a3a5c] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -start-20 -top-20 size-80 rounded-full bg-emerald/5 blur-3xl" />
        <div className="absolute -end-20 top-1/4 size-96 rounded-full bg-emerald/8 blur-3xl" />
        <div className="absolute -bottom-20 start-1/3 size-64 rounded-full bg-gold/5 blur-3xl" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-primary-foreground/70 sm:text-lg">
          {t('hero.subtitle')}
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl flex-col items-center gap-3 sm:flex-row"
        >
          <div className="relative w-full">
            <Search className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('hero.search_placeholder')}
              className="h-12 w-full rounded-full border-0 bg-white/95 pe-14 ps-12 text-sm text-foreground shadow-lg backdrop-blur-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald sm:h-14"
            />
            <Button
              type="submit"
              className="absolute end-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full bg-emerald px-5 text-sm font-semibold text-white hover:bg-emerald/90 sm:h-10 sm:px-6"
            >
              {t('common.search')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
