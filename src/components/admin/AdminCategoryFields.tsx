'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { Category, CategoryField, CategoryFieldOption, Locale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  X,
  GripVertical,
} from 'lucide-react';

// ===================== Helpers =====================

function getLocalizedName(
  item: { name_ar?: string; name_fr?: string; name_en?: string },
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return item.name_ar || item.name_en || item.name_fr || '';
    case 'fr': return item.name_fr || item.name_en || item.name_ar || '';
    default: return item.name_en || item.name_ar || item.name_fr || '';
  }
}

function getLocalizedValue(
  item: { value_ar?: string; value_fr?: string; value_en?: string },
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return item.value_ar || item.value_en || item.value_fr || '';
    case 'fr': return item.value_fr || item.value_en || item.value_ar || '';
    default: return item.value_en || item.value_ar || item.value_fr || '';
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function flattenCategories(cats: Category[]): Category[] {
  const flat: Category[] = [];
  for (const cat of cats) {
    flat.push(cat);
    if (cat.children?.length) {
      flat.push(...flattenCategories(cat.children));
    }
  }
  return flat;
}

type FieldType = CategoryField['field_type'];

interface FieldFormData {
  category_id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  slug: string;
  field_type: FieldType;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  placeholder_en: string;
  placeholder_fr: string;
  placeholder_ar: string;
  unit_en: string;
  unit_fr: string;
  unit_ar: string;
  validation_min: string;
  validation_max: string;
  options: OptionFormData[];
}

interface OptionFormData {
  id?: string;
  value_en: string;
  value_fr: string;
  value_ar: string;
  sort_order: number;
  _isNew?: boolean;
}

const EMPTY_FORM: FieldFormData = {
  category_id: '',
  name_en: '',
  name_fr: '',
  name_ar: '',
  slug: '',
  field_type: 'text',
  is_required: false,
  is_filterable: false,
  sort_order: 0,
  placeholder_en: '',
  placeholder_fr: '',
  placeholder_ar: '',
  unit_en: '',
  unit_fr: '',
  unit_ar: '',
  validation_min: '',
  validation_max: '',
  options: [],
};

const FIELD_TYPES: FieldType[] = ['text', 'number', 'select', 'multiselect', 'boolean', 'date'];

// ===================== Component =====================

export default function AdminCategoryFields() {
  const { t, locale } = useTranslation();

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CategoryField | null>(null);
  const [form, setForm] = useState<FieldFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CategoryField | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Success message
  const [successMsg, setSuccessMsg] = useState('');

  // ===================== Data fetching =====================

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data: Category[] = await res.json();
        setCategories(data);
        setFlatCategories(flattenCategories(data));
      }
    } catch {
      // silent
    }
  }, []);

  const fetchFields = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = selectedCategoryId !== 'all' ? `?category_id=${selectedCategoryId}` : '';
      const res = await fetch(`/api/admin/category-fields${params}`);
      if (res.ok) {
        const data: CategoryField[] = await res.json();
        setFields(data);
      } else {
        setError('Failed to fetch fields');
      }
    } catch {
      setError('Failed to fetch fields');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // ===================== Form handlers =====================

  function openCreateDialog() {
    setEditingField(null);
    setForm({
      ...EMPTY_FORM,
      category_id: selectedCategoryId !== 'all' ? selectedCategoryId : '',
    });
    setFormError('');
    setDialogOpen(true);
  }

  function openEditDialog(field: CategoryField) {
    setEditingField(field);
    setForm({
      category_id: field.category_id,
      name_en: field.name_en,
      name_fr: field.name_fr,
      name_ar: field.name_ar,
      slug: field.slug,
      field_type: field.field_type,
      is_required: field.is_required,
      is_filterable: field.is_filterable,
      sort_order: field.sort_order,
      placeholder_en: field.placeholder_en || '',
      placeholder_fr: field.placeholder_fr || '',
      placeholder_ar: field.placeholder_ar || '',
      unit_en: field.unit_en || '',
      unit_fr: field.unit_fr || '',
      unit_ar: field.unit_ar || '',
      validation_min: field.validation_min != null ? String(field.validation_min) : '',
      validation_max: field.validation_max != null ? String(field.validation_max) : '',
      options: (field.options || []).map((o) => ({
        id: o.id,
        value_en: o.value_en,
        value_fr: o.value_fr,
        value_ar: o.value_ar,
        sort_order: o.sort_order,
      })),
    });
    setFormError('');
    setDialogOpen(true);
  }

  async function handleSave() {
    setFormError('');
    if (!form.category_id || !form.name_en.trim() || !form.slug.trim()) {
      setFormError('Category, English name, and slug are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category_id: form.category_id,
        name_ar: form.name_ar.trim() || form.name_en.trim(),
        name_fr: form.name_fr.trim() || form.name_en.trim(),
        name_en: form.name_en.trim(),
        slug: form.slug.trim(),
        field_type: form.field_type,
        is_required: form.is_required,
        is_filterable: form.is_filterable,
        sort_order: Number(form.sort_order) || 0,
        placeholder_ar: form.placeholder_ar.trim() || undefined,
        placeholder_fr: form.placeholder_fr.trim() || undefined,
        placeholder_en: form.placeholder_en.trim() || undefined,
        unit_ar: form.unit_ar.trim() || undefined,
        unit_fr: form.unit_fr.trim() || undefined,
        unit_en: form.unit_en.trim() || undefined,
        validation_min: form.validation_min ? Number(form.validation_min) : undefined,
        validation_max: form.validation_max ? Number(form.validation_max) : undefined,
      };

      let fieldId: string;

      if (editingField) {
        const res = await fetch(`/api/admin/category-fields/${editingField.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFormError((data as { error?: string }).error || 'Failed to update field');
          return;
        }
        fieldId = editingField.id;
        setSuccessMsg(t('admin.field_updated'));
      } else {
        const res = await fetch('/api/admin/category-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFormError((data as { error?: string }).error || 'Failed to create field');
          return;
        }
        const created = await res.json();
        fieldId = created.id;
        setSuccessMsg(t('admin.field_created'));
      }

      // Handle options for select/multiselect
      if (form.field_type === 'select' || form.field_type === 'multiselect') {
        await syncOptions(fieldId, form.options);
      }

      setDialogOpen(false);
      fetchFields();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setFormError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function syncOptions(fieldId: string, options: OptionFormData[]) {
    // Fetch current options to determine deletions
    const res = await fetch(`/api/admin/category-fields/${fieldId}`);
    if (res.ok) {
      const field = (await res.json()) as CategoryField;
      const existingIds = new Set((field.options || []).map((o) => o.id));
      const keepIds = new Set(options.filter((o) => o.id).map((o) => o.id!));

      // Delete removed options
      for (const existingId of existingIds) {
        if (!keepIds.has(existingId)) {
          await fetch(`/api/admin/category-fields/${fieldId}/options/${existingId}`, {
            method: 'DELETE',
          });
        }
      }
    }

    // Create or update options
    for (const opt of options) {
      const optPayload = {
        value_ar: opt.value_ar.trim() || opt.value_en.trim(),
        value_fr: opt.value_fr.trim() || opt.value_en.trim(),
        value_en: opt.value_en.trim(),
        sort_order: Number(opt.sort_order) || 0,
      };

      if (opt.id && !opt._isNew) {
        await fetch(`/api/admin/category-fields/${fieldId}/options/${opt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(optPayload),
        });
      } else {
        await fetch(`/api/admin/category-fields/${fieldId}/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(optPayload),
        });
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/category-fields/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg(t('admin.field_deleted'));
        fetchFields();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  // ===================== Option sub-form handlers =====================

  function addOption() {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { value_en: '', value_fr: '', value_ar: '', sort_order: prev.options.length, _isNew: true },
      ],
    }));
  }

  function removeOption(index: number) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }

  function updateOption(index: number, key: keyof OptionFormData, value: string | number) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, [key]: value } : o)),
    }));
  }

  // ===================== Render helpers =====================

  function fieldTypeBadge(type: FieldType) {
    const colors: Record<FieldType, string> = {
      text: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      number: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      select: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      multiselect: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      boolean: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      date: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    };
    return (
      <Badge variant="secondary" className={colors[type]}>
        {type}
      </Badge>
    );
  }

  function yesNoBadge(value: boolean) {
    return value ? (
      <Badge variant="default" className="bg-green-600">Yes</Badge>
    ) : (
      <Badge variant="outline">No</Badge>
    );
  }

  // ===================== Render =====================

  return (
    <div className="space-y-6">
      {/* Header with filter and create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Label className="shrink-0 text-sm font-medium">{t('categories.title')}</Label>
          <Select
            value={selectedCategoryId}
            onValueChange={(val) => setSelectedCategoryId(val)}
          >
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.all_categories')}</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.parent_id
                    ? `  ${getLocalizedName(cat, locale)}`
                    : getLocalizedName(cat, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="size-4" />
          {t('admin.create_field')}
        </Button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
          <p className="text-sm text-green-700 dark:text-green-300">{successMsg}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && fields.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="mb-3 size-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('admin.no_fields')}</p>
          </CardContent>
        </Card>
      )}

      {/* Fields list - Desktop table */}
      {!loading && fields.length > 0 && (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-start font-medium">Name</th>
                  <th className="px-4 py-3 text-start font-medium">{t('admin.field_slug')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('admin.field_type')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('admin.field_required')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('admin.field_filterable')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('admin.field_sort_order')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('admin.field_options')}</th>
                  <th className="px-4 py-3 text-end font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => {
                  const category = flatCategories.find((c) => c.id === field.category_id);
                  return (
                    <tr key={field.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{getLocalizedName(field, locale)}</p>
                          {category && (
                            <p className="text-xs text-muted-foreground">
                              {getLocalizedName(category, locale)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {field.slug}
                      </td>
                      <td className="px-4 py-3">{fieldTypeBadge(field.field_type)}</td>
                      <td className="px-4 py-3">{yesNoBadge(field.is_required)}</td>
                      <td className="px-4 py-3">{yesNoBadge(field.is_filterable)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{field.sort_order}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(field.field_type === 'select' || field.field_type === 'multiselect')
                          ? (field.options?.length ?? 0)
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(field)}
                            className="h-8 gap-1.5 px-2"
                          >
                            <Pencil className="size-3.5" />
                            <span className="hidden lg:inline">{t('admin.edit')}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(field)}
                            className="h-8 gap-1.5 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="hidden lg:inline">{t('admin.delete_field')}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {fields.map((field) => {
              const category = flatCategories.find((c) => c.id === field.category_id);
              return (
                <Card key={field.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{getLocalizedName(field, locale)}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {field.slug}
                        </p>
                        {category && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {getLocalizedName(category, locale)}
                          </p>
                        )}
                      </div>
                      {fieldTypeBadge(field.field_type)}
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">
                        {t('admin.field_required')}: {field.is_required ? '✓' : '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('admin.field_filterable')}: {field.is_filterable ? '✓' : '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('admin.field_sort_order')}: {field.sort_order}
                      </span>
                      {(field.field_type === 'select' || field.field_type === 'multiselect') && (
                        <span className="text-xs text-muted-foreground">
                          {t('admin.field_options')}: {field.options?.length ?? 0}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(field)}
                        className="h-8 gap-1.5 px-3"
                      >
                        <Pencil className="size-3.5" />
                        {t('admin.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(field)}
                        className="h-8 gap-1.5 px-3 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        {t('admin.delete_field')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ===================== Create/Edit Dialog ===================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingField ? t('admin.edit_field') : t('admin.create_field')}
            </DialogTitle>
            <DialogDescription>
              {editingField
                ? t('admin.edit_field')
                : t('admin.create_field')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Form error */}
            {formError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            {/* Category & Slug row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.categories_tab')}</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(val) => setForm((p) => ({ ...p, category_id: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('categories.title')} />
                  </SelectTrigger>
                  <SelectContent>
                    {flatCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.parent_id
                          ? `  ${getLocalizedName(cat, locale)}`
                          : getLocalizedName(cat, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.field_slug')}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  onBlur={() => {
                    if (!form.slug && form.name_en) {
                      setForm((p) => ({ ...p, slug: slugify(p.name_en) }));
                    }
                  }}
                  placeholder="field-slug"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Names in 3 languages */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('admin.field_name_en')}</Label>
                <Input
                  value={form.name_en}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((p) => ({
                      ...p,
                      name_en: val,
                      slug: editingField ? p.slug : slugify(val),
                    }));
                  }}
                  placeholder="Field name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.field_name_fr')}</Label>
                <Input
                  value={form.name_fr}
                  onChange={(e) => setForm((p) => ({ ...p, name_fr: e.target.value }))}
                  placeholder="Nom du champ"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.field_name_ar')}</Label>
                <Input
                  value={form.name_ar}
                  onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
                  placeholder="اسم الحقل"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Type & Sort Order row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.field_type')}</Label>
                <Select
                  value={form.field_type}
                  onValueChange={(val) =>
                    setForm((p) => ({ ...p, field_type: val as FieldType }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((ft) => (
                      <SelectItem key={ft} value={ft}>
                        {ft.charAt(0).toUpperCase() + ft.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.field_sort_order')}</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Switches row */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_required}
                  onCheckedChange={(val) => setForm((p) => ({ ...p, is_required: val }))}
                />
                <Label className="cursor-pointer" onClick={() => setForm((p) => ({ ...p, is_required: !p.is_required }))}>
                  {t('admin.field_required')}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_filterable}
                  onCheckedChange={(val) => setForm((p) => ({ ...p, is_filterable: val }))}
                />
                <Label className="cursor-pointer" onClick={() => setForm((p) => ({ ...p, is_filterable: !p.is_filterable }))}>
                  {t('admin.field_filterable')}
                </Label>
              </div>
            </div>

            {/* Placeholders in 3 languages */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Placeholder</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  value={form.placeholder_en}
                  onChange={(e) => setForm((p) => ({ ...p, placeholder_en: e.target.value }))}
                  placeholder="EN placeholder"
                />
                <Input
                  value={form.placeholder_fr}
                  onChange={(e) => setForm((p) => ({ ...p, placeholder_fr: e.target.value }))}
                  placeholder="FR placeholder"
                  dir="ltr"
                />
                <Input
                  value={form.placeholder_ar}
                  onChange={(e) => setForm((p) => ({ ...p, placeholder_ar: e.target.value }))}
                  placeholder="AR placeholder"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Units in 3 languages */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Unit</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  value={form.unit_en}
                  onChange={(e) => setForm((p) => ({ ...p, unit_en: e.target.value }))}
                  placeholder="e.g. kg, cm"
                />
                <Input
                  value={form.unit_fr}
                  onChange={(e) => setForm((p) => ({ ...p, unit_fr: e.target.value }))}
                  placeholder="ex. kg, cm"
                  dir="ltr"
                />
                <Input
                  value={form.unit_ar}
                  onChange={(e) => setForm((p) => ({ ...p, unit_ar: e.target.value }))}
                  placeholder="مثال: كغ، سم"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Min/Max validation for number type */}
            {form.field_type === 'number' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={form.validation_min}
                    onChange={(e) => setForm((p) => ({ ...p, validation_min: e.target.value }))}
                    placeholder="No min"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={form.validation_max}
                    onChange={(e) => setForm((p) => ({ ...p, validation_max: e.target.value }))}
                    placeholder="No max"
                  />
                </div>
              </div>
            )}

            {/* Options sub-form for select/multiselect */}
            {(form.field_type === 'select' || form.field_type === 'multiselect') && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{t('admin.field_options')}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    {t('admin.add_option')}
                  </Button>
                </div>

                {form.options.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No options added yet
                  </p>
                )}

                <div className="space-y-3">
                  {form.options.map((opt, idx) => (
                    <div
                      key={opt.id || idx}
                      className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-start"
                    >
                      <div className="flex shrink-0 items-center pt-1 sm:pt-2">
                        <GripVertical className="size-4 text-muted-foreground" />
                      </div>
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-4">
                        <Input
                          value={opt.value_en}
                          onChange={(e) => updateOption(idx, 'value_en', e.target.value)}
                          placeholder="EN"
                          className="text-sm"
                        />
                        <Input
                          value={opt.value_fr}
                          onChange={(e) => updateOption(idx, 'value_fr', e.target.value)}
                          placeholder="FR"
                          className="text-sm"
                          dir="ltr"
                        />
                        <Input
                          value={opt.value_ar}
                          onChange={(e) => updateOption(idx, 'value_ar', e.target.value)}
                          placeholder="AR"
                          className="text-sm"
                          dir="rtl"
                        />
                        <Input
                          type="number"
                          value={opt.sort_order}
                          onChange={(e) => updateOption(idx, 'sort_order', Number(e.target.value) || 0)}
                          placeholder="#"
                          className="w-16 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(idx)}
                        className="mt-0 shrink-0 text-destructive hover:text-destructive sm:mt-1"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingField ? t('admin.edit_field') : t('admin.create_field')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== Delete Confirmation ===================== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.delete_field')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.delete_field_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {t('admin.delete_field')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
