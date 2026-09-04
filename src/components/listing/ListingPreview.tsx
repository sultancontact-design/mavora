'use client';

import { motion } from 'framer-motion';
import { Eye, ArrowLeft, Check, Edit3, MapPin, Tag, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import type { Locale, ListingStatus } from '@/lib/types';

// ─── Props ──────────────────────────────────────────────────────

interface ListingPreviewProps {
  title: string;
  description: string;
  category?: { id: string; name_ar: string; name_fr: string; name_en: string; parent_id: string | null } | null;
  parentCategory?: { id: string; name_ar: string; name_fr: string; name_en: string } | null;
  country?: { id: string; name_ar: string; name_fr: string; name_en: string; flag_emoji: string } | null;
  city?: { id: string; name_ar: string; name_fr: string; name_en: string } | null;
  price?: string;
  currency?: { id: string; symbol: string; name_ar: string; name_fr: string; name_en: string } | null;
  images: Array<{ url: string; is_primary: boolean }>;
  status?: ListingStatus;
  onEdit: () => void;
  onPublish: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────

function getLocalizedName(
  item: { name_ar: string; name_fr: string; name_en: string },
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return item.name_ar;
    case 'fr': return item.name_fr;
    default: return item.name_en;
  }
}

function formatPrice(price: string, currencySymbol: string, locale: Locale): string {
  const num = Number(price);
  if (isNaN(num)) return '';
  return `${currencySymbol}${num.toLocaleString(locale)}`;
}

// ─── Animation Variants ─────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

// ─── Component ──────────────────────────────────────────────────

export default function ListingPreview({
  title,
  description,
  category,
  parentCategory,
  country,
  city,
  price,
  currency,
  images,
  status,
  onEdit,
  onPublish,
}: ListingPreviewProps) {
  const { t, locale } = useTranslation();

  const primaryImage = images.find((img) => img.is_primary) ?? images[0];
  const categoryName = category ? getLocalizedName(category, locale) : '';
  const parentCategoryName = parentCategory ? getLocalizedName(parentCategory, locale) : '';
  const countryName = country ? getLocalizedName(country, locale) : '';
  const cityName = city ? getLocalizedName(city, locale) : '';
  const currencySymbol = currency?.symbol ?? '';
  const isDraft = status === 'draft';

  return (
    <motion.div
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
      {...fadeIn}
    >
      {/* ── Header ── */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
        >
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <Eye className="size-5 text-[#0E9F6E]" />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t('listing.preview_title')}
          </h1>
        </div>
      </div>

      {/* ── Preview Card ── */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="border-b border-border bg-[#102A43] px-6 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold text-white">
            <span className="flex items-center gap-2">
              <Eye className="size-4" />
              {t('listing.preview')}
            </span>
            {isDraft && (
              <Badge className="border-0 bg-gold text-primary">
                {t('listing.preview_draft_badge')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-5">
            {/* ── Images Section ── */}
            <div className="lg:col-span-3">
              {/* Primary Image */}
              <div className="overflow-hidden bg-muted">
                {primaryImage ? (
                  <motion.img
                    src={primaryImage.url}
                    alt={title}
                    className="aspect-[4/3] w-full object-cover"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 text-muted-foreground/40">
                    <ImageIcon className="size-16" />
                    <p className="text-sm">{t('listing.preview_no_images')}</p>
                  </div>
                )}
              </div>

              {/* Image Thumbnails / Gallery Grid */}
              {images.length > 1 && (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        className={`overflow-hidden rounded-lg border-2 ${
                          img.is_primary ? 'border-[#0E9F6E]' : 'border-border'
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="p-6 pt-2">
                <Separator className="mb-4" />
                <h2 className="mb-3 text-lg font-bold text-foreground">
                  {t('listing.detail.description')}
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            {/* ── Info Sidebar ── */}
            <div className="border-t border-border p-6 lg:col-span-2 lg:border-s lg:border-t-0">
              <div className="space-y-6">
                {/* Category Breadcrumb */}
                {(parentCategoryName || categoryName) && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t('listing.preview_category')}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      {parentCategoryName && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="me-1 size-3" />
                          {parentCategoryName}
                        </Badge>
                      )}
                      {parentCategoryName && categoryName && (
                        <span className="text-muted-foreground">/</span>
                      )}
                      {categoryName && (
                        <Badge variant="secondary" className="text-xs">
                          {categoryName}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-2xl font-bold leading-tight text-foreground">
                  {title}
                </h1>

                {/* Price */}
                {price && Number(price) > 0 && (
                  <motion.div
                    className="text-3xl font-bold text-[#0E9F6E]"
                    initial={{ opacity: 0, x: locale === 'ar' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t('listing.preview_price')}
                    </p>
                    {formatPrice(price, currencySymbol, locale)}
                    {currency && (
                      <span className="ms-2 text-sm font-normal text-muted-foreground">
                        {getLocalizedName(currency, locale)}
                      </span>
                    )}
                  </motion.div>
                )}

                <Separator />

                {/* Location */}
                {(countryName || cityName) && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#102A43]/5">
                      <MapPin className="size-4 text-[#0E9F6E]" />
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t('listing.preview_location')}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {country?.flag_emoji && <span className="me-1.5">{country.flag_emoji}</span>}
                        {cityName}{cityName && countryName ? ', ' : ''}{countryName}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Preview Notice */}
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
                  <p className="text-center text-xs text-muted-foreground">
                    {t('listing.preview_title')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Action Buttons ── */}
      <motion.div
        className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
      >
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={onEdit}
        >
          <Edit3 className="size-4" />
          {t('listing.preview_edit')}
        </Button>
        <Button
          type="button"
          className="gap-2 bg-[#0E9F6E] text-white hover:bg-[#0E9F6E]/90"
          onClick={onPublish}
        >
          <Check className="size-4" />
          {t('listing.preview_publish')}
        </Button>
      </motion.div>
    </motion.div>
  );
}
