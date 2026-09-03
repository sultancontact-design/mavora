'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import type { CategoryField, Locale } from '@/lib/types';
import { Settings2 } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────

function getFieldLocalizedName(
  field: { name_ar: string; name_fr: string; name_en: string },
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return field.name_ar;
    case 'fr': return field.name_fr;
    default: return field.name_en;
  }
}

function getFieldLocalizedPlaceholder(
  field: CategoryField,
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return field.placeholder_ar ?? '';
    case 'fr': return field.placeholder_fr ?? '';
    default: return field.placeholder_en ?? '';
  }
}

function getFieldLocalizedUnit(
  field: CategoryField,
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return field.unit_ar ?? '';
    case 'fr': return field.unit_fr ?? '';
    default: return field.unit_en ?? '';
  }
}

function getOptionLocalizedName(
  option: { value_ar: string; value_fr: string; value_en: string },
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return option.value_ar;
    case 'fr': return option.value_fr;
    default: return option.value_en;
  }
}

// ─── Props ──────────────────────────────────────────────────────────

interface DynamicFieldsFormProps {
  categoryId: string;
  value: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  disabled?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────

export default function DynamicFieldsForm({
  categoryId,
  value,
  onChange,
  disabled = false,
}: DynamicFieldsFormProps) {
  const { t, locale } = useTranslation();
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // ── Fetch fields when category changes ──
  useEffect(() => {
    if (!categoryId) return;

    let cancelled = false;

    // Use an async IIFE so setState only happens in callbacks, not synchronously
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/category-fields?category_id=${categoryId}`);
        const data = res.ok ? await res.json() : [];
        if (!cancelled) {
          setFields(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setFields([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [categoryId]);

  // ── Validate on change ──
  const handleChange = useCallback(
    (fieldId: string, newValue: string) => {
      onChange(fieldId, newValue);
      // Clear error for this field if a value was set
      setErrors((prev) => {
        if (newValue) {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        }
        return prev;
      });
    },
    [onChange]
  );

  // ── Public validation method ──
  // Exposed via a ref pattern isn't needed here since the parent
  // can check `value` for required fields. We do inline validation display.

  // ── Loading skeleton ──
  if (loading) {
    return (
      <Card className="overflow-hidden border-border">
        <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Settings2 className="size-5 text-[#0E9F6E]" />
            {t('listing.dynamic_fields')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // ── No fields for this category ──
  if (fields.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Settings2 className="size-5 text-[#0E9F6E]" />
          {t('listing.dynamic_fields')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {fields.map((field) => {
          const fieldName = getFieldLocalizedName(field, locale);
          const placeholder = getFieldLocalizedPlaceholder(field, locale);
          const unit = getFieldLocalizedUnit(field, locale);
          const currentValue = value[field.id] ?? '';
          const showError = field.is_required && !currentValue && errors[field.id];

          switch (field.field_type) {
            case 'text':
              return (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`} className="text-sm font-medium">
                    {fieldName}
                    {field.is_required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    id={`field-${field.id}`}
                    placeholder={placeholder}
                    value={currentValue}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    disabled={disabled}
                    onBlur={() => {
                      if (field.is_required && !value[field.id]) {
                        setErrors((prev) => ({ ...prev, [field.id]: true }));
                      }
                    }}
                  />
                  {showError && (
                    <p className="text-xs text-destructive">{t('listing.fields_required')}</p>
                  )}
                </div>
              );

            case 'number':
              return (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`} className="text-sm font-medium">
                    {fieldName}
                    {field.is_required && <span className="text-destructive"> *</span>}
                    {unit && (
                      <span className="ms-1 text-xs text-muted-foreground">({unit})</span>
                    )}
                  </Label>
                  <Input
                    id={`field-${field.id}`}
                    type="number"
                    placeholder={placeholder}
                    value={currentValue}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    disabled={disabled}
                    min={field.validation_min}
                    max={field.validation_max}
                    onBlur={() => {
                      if (field.is_required && !value[field.id]) {
                        setErrors((prev) => ({ ...prev, [field.id]: true }));
                      }
                    }}
                  />
                  {showError && (
                    <p className="text-xs text-destructive">{t('listing.fields_required')}</p>
                  )}
                </div>
              );

            case 'select':
              return (
                <div key={field.id} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {fieldName}
                    {field.is_required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Select
                    value={currentValue}
                    onValueChange={(val) => handleChange(field.id, val)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {getOptionLocalizedName(opt, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showError && (
                    <p className="text-xs text-destructive">{t('listing.fields_required')}</p>
                  )}
                </div>
              );

            case 'multiselect': {
              const selectedIds = currentValue ? currentValue.split(',').filter(Boolean) : [];
              return (
                <div key={field.id} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {fieldName}
                    {field.is_required && <span className="text-destructive"> *</span>}
                  </Label>
                  <div className="space-y-2">
                    {field.options?.map((opt) => {
                      const isChecked = selectedIds.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const newIds = checked
                                ? [...selectedIds, opt.id]
                                : selectedIds.filter((id) => id !== opt.id);
                              handleChange(field.id, newIds.join(','));
                            }}
                            disabled={disabled}
                          />
                          <span className="text-sm text-foreground">
                            {getOptionLocalizedName(opt, locale)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {showError && (
                    <p className="text-xs text-destructive">{t('listing.fields_required')}</p>
                  )}
                </div>
              );
            }

            case 'boolean':
              return (
                <div key={field.id} className="flex items-center justify-between">
                  <Label htmlFor={`field-${field.id}`} className="text-sm font-medium">
                    {fieldName}
                  </Label>
                  <Switch
                    id={`field-${field.id}`}
                    checked={currentValue === 'true'}
                    onCheckedChange={(checked) => handleChange(field.id, checked ? 'true' : 'false')}
                    disabled={disabled}
                  />
                </div>
              );

            case 'date':
              return (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`} className="text-sm font-medium">
                    {fieldName}
                    {field.is_required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    id={`field-${field.id}`}
                    type="date"
                    value={currentValue}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    disabled={disabled}
                    onBlur={() => {
                      if (field.is_required && !value[field.id]) {
                        setErrors((prev) => ({ ...prev, [field.id]: true }));
                      }
                    }}
                  />
                  {showError && (
                    <p className="text-xs text-destructive">{t('listing.fields_required')}</p>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}
      </CardContent>
    </Card>
  );
}

// ─── Exported helper for use in DetailView ──────────────────────────

export function getLocalizedOptionName(
  option: { value_ar: string; value_fr: string; value_en: string },
  locale: Locale
): string {
  return getOptionLocalizedName(option, locale);
}
