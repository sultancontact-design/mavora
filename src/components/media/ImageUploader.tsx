'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Camera,
  X,
  Star,
  ChevronUp,
  ChevronDown,
  Loader2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';

interface ImageItem {
  id?: string;
  url: string;
  is_primary: boolean;
  _uploading?: boolean;
  _progress?: number;
}

interface ImageUploaderProps {
  listingId?: string;
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUploader({
  listingId,
  images,
  onImagesChange,
  maxImages = 8,
  disabled = false,
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validate file client-side
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return t('media.invalid_type') || 'Only JPEG, PNG, and WebP images are allowed';
      }
      if (file.size > MAX_SIZE) {
        return t('media.file_too_large') || 'Image must be less than 5MB';
      }
      return null;
    },
    [t]
  );

  // Upload a single file
  const uploadFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      if (images.length >= maxImages) {
        toast.error(t('media.max_images') || `Maximum ${maxImages} images allowed`);
        return;
      }

      // Add placeholder with uploading state
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const placeholder: ImageItem = {
        id: undefined,
        url: URL.createObjectURL(file),
        is_primary: images.length === 0,
        _uploading: true,
        _progress: 0,
      };

      const updatedImages = [...images, placeholder];
      onImagesChange(updatedImages);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Upload failed');
        }

        const { url } = await res.json();

        // Replace placeholder with real URL
        const finalImages = updatedImages.map((img) => {
          if (img.url === placeholder.url) {
            return { ...img, url, _uploading: false, _progress: 100 };
          }
          return img;
        });

        onImagesChange(finalImages);
        toast.success(t('media.upload_success'));
      } catch (err) {
        // Remove the failed upload
        const filtered = updatedImages.filter((img) => img.url !== placeholder.url);
        onImagesChange(filtered);
        toast.error(t('media.upload_failed'));
        console.error('Upload error:', err);
      }
    },
    [images, maxImages, onImagesChange, t, validateFile]
  );

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || !user) {
        if (!user) toast.error(t('favorites.login_required'));
        return;
      }
      Array.from(files).forEach(uploadFile);
    },
    [uploadFile, user, t]
  );

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  // Remove image
  const handleRemove = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      // If removed was primary and there are remaining images, set first as primary
      if (images[index]?.is_primary && updated.length > 0) {
        updated[0] = { ...updated[0], is_primary: true };
      }
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  // Set primary
  const handleSetPrimary = useCallback(
    (index: number) => {
      const updated = images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }));
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  // Move image up/down
  const handleMove = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= images.length) return;

      const updated = [...images];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={
          `flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ` +
          (isDragging
            ? 'border-[#0E9F6E] bg-[#0E9F6E]/5'
            : 'border-border hover:border-[#0E9F6E]/50 hover:bg-muted/50') +
          (disabled ? ' cursor-not-allowed opacity-50' : '')
        }
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-[#0E9F6E]/10">
          <Camera className="size-6 text-[#0E9F6E]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {t('listing.upload_images')}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Upload className="size-3" />
            {t('listing.drag_hint')}
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={img.id || img.url}
              className={
                `group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ` +
                (img.is_primary
                  ? 'border-[#0E9F6E] ring-2 ring-[#0E9F6E]/20'
                  : 'border-border hover:border-muted-foreground/30')
              }
            >
              {/* Image */}
              <img
                src={img.url}
                alt=""
                className="size-full object-cover"
              />

              {/* Uploading overlay */}
              {img._uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="size-6 animate-spin text-white" />
                </div>
              )}

              {/* Primary badge */}
              {img.is_primary && !img._uploading && (
                <div className="absolute start-1.5 top-1.5 flex items-center gap-1 rounded-md bg-[#0E9F6E] px-1.5 py-0.5">
                  <Star className="size-3 fill-white text-white" />
                  <span className="text-[10px] font-semibold text-white">
                    {t('media.set_primary')}
                  </span>
                </div>
              )}

              {/* Action buttons (show on hover) */}
              {!img._uploading && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    {/* Move up */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(index, 'up');
                      }}
                      disabled={index === 0}
                      className="flex size-7 items-center justify-center rounded-md bg-white/90 text-foreground backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    {/* Move down */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMove(index, 'down');
                      }}
                      disabled={index === images.length - 1}
                      className="flex size-7 items-center justify-center rounded-md bg-white/90 text-foreground backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {/* Set primary */}
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(index);
                        }}
                        className="flex size-7 items-center justify-center rounded-md bg-white/90 text-foreground backdrop-blur-sm transition-colors hover:bg-white"
                        aria-label={t('media.set_primary')}
                      >
                        <Star className="size-4" />
                      </button>
                    )}
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      className="flex size-7 items-center justify-center rounded-md bg-destructive/90 text-white backdrop-blur-sm transition-colors hover:bg-destructive"
                      aria-label={t('media.remove')}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image count hint */}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {images.length} / {maxImages}
        </p>
      )}
    </div>
  );
}
