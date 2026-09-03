'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, FileText, MapPin, Tag, Type, ImageIcon, Eye, VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import type { Category, Country, City, Currency, Locale, ListingStatus } from '@/lib/types';
import ImageUploader from '@/components/media/ImageUploader';
import ListingPreview from '@/components/listing/ListingPreview';
import DynamicFieldsForm from '@/components/listing/DynamicFieldsForm';

// ─── Schema ────────────────────────────────────────────────────────

const VIDEO_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)/;

const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(5000),
  category_id: z.string().min(1),
  subcategory_id: z.string().optional(),
  country_id: z.string().min(1),
  city_id: z.string().min(1),
  price: z.string().optional(),
  currency_id: z.string().optional(),
  video_url: z.string().optional().refine(
    (val) => !val || VIDEO_URL_REGEX.test(val),
    () => ({ message: 'invalid_video_url' })
  ),
});

type FormData = z.infer<typeof createListingSchema>;

// ─── Helpers ───────────────────────────────────────────────────────

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

// ─── Edit Status Options ────────────────────────────────────────────

const EDIT_STATUS_OPTIONS: { value: ListingStatus; labelKey: string }[] = [
  { value: 'active', labelKey: 'listing.status_active' },
  { value: 'draft', labelKey: 'listing.status_draft' },
  { value: 'archived', labelKey: 'listing.status_archived' },
  { value: 'sold', labelKey: 'listing.status_sold' },
  { value: 'reserved', labelKey: 'listing.status_reserved' },
];

// ─── Video Embed Helper ─────────────────────────────────────────

function getVideoEmbedUrl(url: string): string | null {
  // YouTube: youtube.com/watch?v=ID
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  // Vimeo: vimeo.com/ID
  match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return null;
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = getVideoEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <iframe
      src={embedUrl}
      className="size-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="Video preview"
    />
  );
}

// ─── Component ──────────────────────────────────────────────────────

export default function CreateListingForm() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { navigateHome, navigateDetail, editingListingId, clearEditingListing } = useNavigationStore();
  const isEditMode = !!editingListingId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAs, setSubmittingAs] = useState<'active' | 'draft' | null>(null);
  const [editStatus, setEditStatus] = useState<ListingStatus>('active');
  const [showPreview, setShowPreview] = useState(false);

  // ── Dynamic fields state ──
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});

  // ── Images state ──
  const [images, setImages] = useState<Array<{ id?: string; url: string; is_primary: boolean }>>([]);

  // ── Fetch dropdown data ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [listingLoading, setListingLoading] = useState(isEditMode);

  // ── Form ──
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: '',
      description: '',
      category_id: '',
      subcategory_id: '',
      country_id: '',
      city_id: '',
      price: '',
      currency_id: '',
      video_url: '',
    },
  });

  const watchedCountry = watch('country_id');
  const watchedCategory = watch('category_id');
  const watchedDescription = watch('description') ?? '';
  const allFormValues = watch();

  // ── Fetch initial data (dropdowns) ──
  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, countryRes, currencyRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/countries'),
          fetch('/api/currencies'),
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (countryRes.ok) setCountries(await countryRes.json());
        if (currencyRes.ok) setCurrencies(await currencyRes.json());
      } catch {
        // silent
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Fetch existing listing in edit mode ──
  useEffect(() => {
    if (!editingListingId) return;

    async function fetchListing() {
      setListingLoading(true);
      try {
        const res = await fetch(`/api/listings/${editingListingId}?edit=1`);
        if (!res.ok) {
          toast.error(t('common.error'));
          navigateHome();
          return;
        }
        const data = await res.json();

        // Set edit status
        setEditStatus(data.status || 'active');

        // Pre-fill form fields
        // Determine parent category and subcategory
        let parentCategoryId = data.category_id;
        let subcategoryId = '';

        if (data.category) {
          const cat = data.category;
          if (cat.parent_id && cat.parent_id !== cat.id) {
            // This is a subcategory, find the parent
            subcategoryId = cat.id;
            parentCategoryId = cat.parent_id;
          }
        }

        reset({
          title: data.title || '',
          description: data.description || '',
          category_id: parentCategoryId,
          subcategory_id: subcategoryId,
          country_id: data.country_id || '',
          city_id: data.city_id || '',
          price: data.price != null ? String(data.price) : '',
          currency_id: data.currency_id || '',
          video_url: data.video_url || '',
        });

        // Pre-fill images from existing media
        if (data.media && Array.isArray(data.media)) {
          setImages(
            data.media.map((m: { id: string; url: string; is_primary: boolean }) => ({
              id: m.id,
              url: m.url,
              is_primary: m.is_primary,
            }))
          );
        }

        // Pre-fill dynamic field values
        try {
          const fieldsRes = await fetch(`/api/listings/${editingListingId}/fields`);
          if (fieldsRes.ok) {
            const fieldsData = await fieldsRes.json();
            if (Array.isArray(fieldsData)) {
              const prefill: Record<string, string> = {};
              fieldsData.forEach((fv: { field_id: string; value: string }) => {
                prefill[fv.field_id] = fv.value;
              });
              setDynamicFieldValues(prefill);
            }
          }
        } catch {
          // Silent — dynamic fields are optional
        }
      } catch {
        toast.error(t('common.error'));
        navigateHome();
      } finally {
        setListingLoading(false);
      }
    }
    fetchListing();
  }, [editingListingId, t, reset, navigateHome]);

  // ── Fetch cities when country changes ──
  useEffect(() => {
    if (!watchedCountry) {
      setCities([]);
      setValue('city_id', '');
      return;
    }

    let cancelled = false;
    fetch(`/api/cities?country_id=${watchedCountry}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) {
          setCities(data);
          // Only reset city if we're not in the middle of pre-filling for edit mode
          if (!listingLoading) {
            setValue('city_id', '');
          }
        }
      })
      .catch(() => { if (!cancelled) setCities([]); });
    return () => { cancelled = true; };
  }, [watchedCountry, setValue, listingLoading]);

  // ── Set default currency when country changes ──
  useEffect(() => {
    if (!watchedCountry) return;
    const selectedCountry = countries.find((c) => c.id === watchedCountry);
    if (selectedCountry?.currency_code) {
      const currency = currencies.find((c) => c.code === selectedCountry.currency_code);
      if (currency) {
        setValue('currency_id', currency.id);
      }
    }
  }, [watchedCountry, countries, currencies, setValue]);

  // ── Reset subcategory when parent category changes ──
  useEffect(() => {
    if (!listingLoading) {
      setValue('subcategory_id', '');
    }
  }, [watchedCategory, setValue, listingLoading]);

  // ── Get subcategories ──
  const selectedParentCategory = categories.find((c) => c.id === watchedCategory);
  const subcategories = selectedParentCategory?.children ?? [];

  // ── Derived preview data ──
  const previewCategory = allFormValues.subcategory_id
    ? subcategories.find((c) => c.id === allFormValues.subcategory_id)
    : null;
  const previewParentCategory = selectedParentCategory ?? null;
  const previewCountry = countries.find((c) => c.id === allFormValues.country_id) ?? null;
  const previewCity = cities.find((c) => c.id === allFormValues.city_id) ?? null;
  const previewCurrency = currencies.find((c) => c.id === allFormValues.currency_id) ?? null;

  // ── Preview handler ──
  const handlePreview = useCallback(() => {
    // Validate the form before showing preview
    handleSubmit(() => {
      setShowPreview(true);
    })();
  }, [handleSubmit]);

  // ── Submit handler ──
  const onSubmit = useCallback(
    async (data: FormData, status: 'active' | 'draft') => {
      setIsSubmitting(true);
      setSubmittingAs(status);

      try {
        // Use subcategory if selected, otherwise parent
        const finalCategoryId = data.subcategory_id || data.category_id;

        const body = {
          title: data.title,
          description: data.description,
          category_id: finalCategoryId,
          country_id: data.country_id,
          city_id: data.city_id,
          price: data.price ? Number(data.price) : null,
          currency_id: data.currency_id || null,
          video_url: data.video_url?.trim() || null,
          status,
        };

        if (isEditMode && editingListingId) {
          // ── Edit mode: PATCH ──
          const editBody = {
            ...body,
            status: editStatus,
          };

          const res = await fetch(`/api/listings/${editingListingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editBody),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to update listing');
          }

          // Upload new images (only those without an existing DB id)
          const newImages = images.filter((img) => !img.id && !img._uploading);
          for (let i = 0; i < newImages.length; i++) {
            const img = newImages[i];
            try {
              await fetch(`/api/listings/${editingListingId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: img.url,
                  type: 'image',
                  sort_order: images.indexOf(img),
                  is_primary: img.is_primary,
                }),
              });
            } catch {
              // Continue with other images
            }
          }

          // Save dynamic field values
          const fieldEntries = Object.entries(dynamicFieldValues).filter(([, v]) => v);
          if (fieldEntries.length > 0) {
            try {
              await fetch(`/api/listings/${editingListingId}/fields`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: fieldEntries.map(([field_id, val]) => ({ field_id, value: val })),
                }),
              });
            } catch {
              // Non-critical — listing was saved
            }
          }

          setImages([]);
          clearEditingListing();
          toast.success(t('listing.edit_success'));
          navigateDetail(editingListingId);
        } else {
          // ── Create mode: POST ──
          const res = await fetch('/api/listings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to create listing');
          }

          const createdListing = await res.json();

          // Save dynamic field values
          const fieldEntries = Object.entries(dynamicFieldValues).filter(([, v]) => v);
          if (fieldEntries.length > 0) {
            try {
              await fetch(`/api/listings/${createdListing.id}/fields`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: fieldEntries.map(([field_id, val]) => ({ field_id, value: val })),
                }),
              });
            } catch {
              // Non-critical — listing was created
            }
          }

          // Upload images and create media records
          const validImages = images.filter((img) => !img._uploading);
          for (let i = 0; i < validImages.length; i++) {
            const img = validImages[i];
            try {
              await fetch(`/api/listings/${createdListing.id}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: img.url,
                  type: 'image',
                  sort_order: i,
                  is_primary: img.is_primary,
                }),
              });
            } catch {
              // Continue with other images even if one fails
            }
          }

          setImages([]);
          if (status === 'active') {
            toast.success(t('create.success_published'));
            reset();
            navigateDetail(createdListing.id);
          } else {
            toast.success(t('create.success_draft'));
            reset();
            navigateHome();
          }
        }
      } catch (error) {
        toast.error(t('create.error_title'));
        console.error(isEditMode ? 'Edit listing error:' : 'Create listing error:', error);
      } finally {
        setIsSubmitting(false);
        setSubmittingAs(null);
      }
    },
    [isEditMode, editingListingId, editStatus, images, dynamicFieldValues, t, reset, navigateHome, navigateDetail, clearEditingListing]
  );

  const handlePublish = handleSubmit((data) => onSubmit(data, 'active'));
  const handleDraft = handleSubmit((data) => onSubmit(data, 'draft'));

  // ── Back button handler: clear editing state ──
  const handleBack = useCallback(() => {
    if (isEditMode) {
      clearEditingListing();
    }
    navigateHome();
  }, [isEditMode, clearEditingListing, navigateHome]);

  // ── Cancel button handler: go back to the detail view if editing ──
  const handleCancel = useCallback(() => {
    if (isEditMode && editingListingId) {
      clearEditingListing();
      navigateDetail(editingListingId);
    } else {
      navigateHome();
    }
  }, [isEditMode, editingListingId, clearEditingListing, navigateHome, navigateDetail]);

  // ── Not logged in guard ──
  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">{t('create.login_required')}</p>
        </div>
      </div>
    );
  }

  // ── Loading skeleton (initial data or editing listing) ──
  if (dataLoading || listingLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2 h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: isEditMode ? 4 : 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6">
              <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="space-y-3">
                <div className="h-10 animate-pulse rounded bg-muted" />
                <div className="h-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back + Header */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={handleBack}
      >
        <ArrowLeft className="size-4" />
        {t('common.back')}
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {isEditMode ? t('listing.edit_title') : t('create.title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEditMode ? t('listing.edit_title') : t('create.subtitle')}
        </p>
      </div>

      <form className="space-y-6">
        {/* ── Status Section (edit mode only) ── */}
        {isEditMode && (
          <Card className="overflow-hidden border-border">
            <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Tag className="size-5 text-[#0E9F6E]" />
                {t('listing.status_label')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Select
                value={editStatus}
                onValueChange={(val) => setEditStatus(val as ListingStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDIT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* ── Details Section ── */}
        <Card className="overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <FileText className="size-5 text-[#0E9F6E]" />
              {t('create.section_details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                {t('create.title_label')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Type className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="title"
                  placeholder={t('create.title_placeholder')}
                  className="ps-10"
                  {...register('title')}
                />
              </div>
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {t('create.description_label')} <span className="text-destructive">*</span>
                <span className="ms-2 text-xs text-muted-foreground">
                  {watchedDescription.length} / 5000 {t('create.characters_count')}
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder={t('create.description_placeholder')}
                rows={6}
                className="resize-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('create.category_label')} <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('create.category_placeholder')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {getLocalizedName(cat, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p className="text-xs text-destructive">
                  {t('create.category_label')}
                </p>
              )}
            </div>

            {/* Subcategory (only when parent has children) */}
            {subcategories.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('create.subcategory_label')}
                </Label>
                <Controller
                  name="subcategory_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('create.subcategory_placeholder')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {getLocalizedName(sub, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Dynamic Fields Section ── */}
        <DynamicFieldsForm
          categoryId={allFormValues.subcategory_id || allFormValues.category_id}
          value={dynamicFieldValues}
          onChange={(fieldId, val) =>
            setDynamicFieldValues((prev) => ({ ...prev, [fieldId]: val }))
          }
          disabled={isSubmitting}
        />

        {/* ── Video Section ── */}
        <Card className="overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <VideoIcon className="size-5 text-[#0E9F6E]" />
              {t('listing.video_url')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="video_url" className="text-sm font-medium">
                {t('listing.video_url')}
              </Label>
              <Input
                id="video_url"
                placeholder={t('listing.video_url_placeholder')}
                {...register('video_url')}
              />
              <p className="text-xs text-muted-foreground">
                {t('listing.video_url_help')}
              </p>
              {errors.video_url && (
                <p className="text-xs text-destructive">
                  {t('listing.invalid_video_url')}
                </p>
              )}
            </div>
            {allFormValues.video_url && VIDEO_URL_REGEX.test(allFormValues.video_url) && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t('listing.video_preview')}
                </p>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                  <VideoEmbed url={allFormValues.video_url} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Images Section ── */}
        <Card className="overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <ImageIcon className="size-5 text-[#0E9F6E]" />
              {t('listing.upload_images')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {t('listing.upload_images_hint')}
            </p>
            <ImageUploader
              listingId={editingListingId ?? undefined}
              images={images}
              onImagesChange={setImages}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* ── Location Section ── */}
        <Card className="overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <MapPin className="size-5 text-[#0E9F6E]" />
              {t('create.section_location')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {/* Country */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('create.country_label')} <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="country_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('create.country_placeholder')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.flag_emoji} {getLocalizedName(country, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.country_id && (
                <p className="text-xs text-destructive">
                  {t('create.country_label')}
                </p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('create.city_label')} <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="city_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!watchedCountry}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('create.city_placeholder')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {getLocalizedName(city, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.city_id && (
                <p className="text-xs text-destructive">
                  {t('create.city_label')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Pricing Section ── */}
        <Card className="overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Tag className="size-5 text-[#0E9F6E]" />
              {t('create.section_pricing')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {/* Price & Currency on same row on desktop */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  {t('create.price_label')}
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('create.price_placeholder')}
                  {...register('price')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('create.price_optional')}
                </p>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('create.currency_label')}
                </Label>
                <Controller
                  name="currency_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('create.currency_placeholder')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {currencies.map((curr) => (
                          <SelectItem key={curr.id} value={curr.id}>
                            {curr.symbol} — {getLocalizedName(curr, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="order-1 sm:order-none"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('create.cancel')}
          </Button>
          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              className="border-[#F2B84B] text-[#F2B84B] hover:bg-[#F2B84B]/10"
              onClick={handlePreview}
              disabled={isSubmitting}
            >
              <Eye className="me-2 size-4" />
              {t('listing.preview')}
            </Button>
          )}
          {isEditMode ? (
            <Button
              type="button"
              className="bg-[#0E9F6E] text-white hover:bg-[#0E9F6E]/90"
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : null}
              {isSubmitting
                ? t('listing.editing')
                : t('listing.edit_title')}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="border-[#0E9F6E] text-[#0E9F6E] hover:bg-[#0E9F6E]/10"
                onClick={handleDraft}
                disabled={isSubmitting}
              >
                {isSubmitting && submittingAs === 'draft' ? (
                  <Loader2 className="me-2 size-4 animate-spin" />
                ) : null}
                {isSubmitting && submittingAs === 'draft'
                  ? t('create.saving')
                  : t('create.save_draft')}
              </Button>
              <Button
                type="button"
                className="bg-[#0E9F6E] text-white hover:bg-[#0E9F6E]/90"
                onClick={handlePublish}
                disabled={isSubmitting}
              >
                {isSubmitting && submittingAs === 'active' ? (
                  <Loader2 className="me-2 size-4 animate-spin" />
                ) : null}
                {isSubmitting && submittingAs === 'active'
                  ? t('create.publishing')
                  : t('create.publish')}
              </Button>
            </>
          )}
        </div>
      </form>

      {/* ── Preview View ── */}
      {showPreview && (
        <ListingPreview
          title={allFormValues.title}
          description={allFormValues.description}
          category={previewCategory}
          parentCategory={previewParentCategory}
          country={previewCountry}
          city={previewCity}
          price={allFormValues.price}
          currency={previewCurrency}
          images={images}
          onEdit={() => setShowPreview(false)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
