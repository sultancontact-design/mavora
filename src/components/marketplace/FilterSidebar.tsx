'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Country, City, Currency, Locale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterSidebarProps {
  countries: Country[] | null;
  cities: City[] | null;
  currencies: Currency[] | null;
  selectedCountryId: string | null;
  selectedCityId: string | null;
  minPrice: string;
  maxPrice: string;
  onCountryChange: (id: string | null) => void;
  onCityChange: (id: string | null) => void;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}

function getLocalizedName(
  item: { name_ar: string; name_fr: string; name_en: string },
  locale: Locale
): string {
  return item[`name_${locale}`] ?? item.name_en;
}

/* ─── Filter Form Content (shared between desktop & mobile) ─── */
function FilterForm({
  countries,
  cities,
  selectedCountryId,
  selectedCityId,
  minPrice,
  maxPrice,
  onCountryChange,
  onCityChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClearAll,
  activeFilterCount,
}: FilterSidebarProps) {
  const { t, locale } = useTranslation();

  return (
    <div className="flex flex-col gap-5">
      {/* Header with Clear All */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('filters.title')}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-emerald hover:text-emerald/80 transition-colors"
          >
            {t('filters.clear_all')}
          </button>
        )}
      </div>

      {/* Country Select */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          {t('filters.country')}
        </Label>
        <Select
          value={selectedCountryId ?? '__all__'}
          onValueChange={(val) => onCountryChange(val === '__all__' ? null : val)}
        >
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue placeholder={t('filters.country_all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('filters.country_all')}</SelectItem>
            {countries?.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                <span className="flex items-center gap-2">
                  <span>{country.flag_emoji}</span>
                  <span>{getLocalizedName(country, locale)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Select */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          {t('filters.city')}
        </Label>
        <Select
          value={selectedCityId ?? '__all__'}
          onValueChange={(val) => onCityChange(val === '__all__' ? null : val)}
          disabled={!selectedCountryId}
        >
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue placeholder={
              selectedCountryId
                ? t('filters.city_all')
                : t('filters.city_all')
            } />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('filters.city_all')}</SelectItem>
            {cities?.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {getLocalizedName(city, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          {t('filters.price_range')}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder={t('filters.min_price')}
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="h-9 text-sm"
          />
          <span className="text-muted-foreground text-sm shrink-0">—</span>
          <Input
            type="number"
            min="0"
            placeholder={t('filters.max_price')}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Main FilterSidebar Export ─── */
export default function FilterSidebar(props: FilterSidebarProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mobile: floating button + bottom sheet
  if (isMobile) {
    return (
      <>
        {/* Floating filter button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-20 z-40 flex items-center gap-2 rounded-full bg-emerald px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-emerald/90 hover:shadow-xl active:scale-95"
        >
          <SlidersHorizontal className="size-4" />
          {t('filters.title')}
          {props.activeFilterCount > 0 && (
            <Badge className="h-5 min-w-5 rounded-full bg-white px-1.5 text-[10px] font-bold text-emerald">
              {props.activeFilterCount}
            </Badge>
          )}
        </button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader className="pb-2">
              <SheetTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="size-4 text-emerald" />
                  {t('filters.title')}
                </span>
                {props.activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {props.activeFilterCount} {t('filters.active')}
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="px-4 pb-2">
              <FilterForm {...props} />
            </div>

            <SheetFooter className="border-t pt-3">
              <Button
                onClick={() => setMobileOpen(false)}
                className="w-full bg-emerald hover:bg-emerald/90 text-white"
              >
                {t('filters.apply')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: collapsible sidebar panel
  return <DesktopFilterSidebar {...props} />;
}

/* ─── Desktop Sidebar (collapsible panel) ─── */
function DesktopFilterSidebar(props: FilterSidebarProps) {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-[280px] shrink-0">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`mb-3 flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-emerald ${
          isRtl ? 'flex-row-reverse' : ''
        }`}
      >
        <Filter className="size-4 text-emerald" />
        {isOpen ? t('filters.hide_filters') : t('filters.show_filters')}
        {props.activeFilterCount > 0 && (
          <Badge className="h-5 min-w-5 rounded-full bg-emerald/10 px-1.5 text-[10px] font-bold text-emerald">
            {props.activeFilterCount}
          </Badge>
        )}
      </button>

      {/* Collapsible panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, [isRtl ? 'marginRight' : 'marginLeft']: -10 }}
            animate={{ opacity: 1, height: 'auto', [isRtl ? 'marginRight' : 'marginLeft']: 0 }}
            exit={{ opacity: 0, height: 0, [isRtl ? 'marginRight' : 'marginLeft']: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <FilterForm {...props} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
