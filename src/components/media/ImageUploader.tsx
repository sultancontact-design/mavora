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
  ZoomIn,
  Image as ImageIcon,
  AlertCircle,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';

interface ImageItem {
  id?: string;
  url: string;
  path?: string;
  is_primary: boolean;
  _uploading?: boolean;
  _progress?: number;
  _error?: string;
  _optimized?: boolean;
  _size?: number;
  _originalSize?: number;
  _compressionRatio?: number;
  _thumbnailUrl?: string;
  _variants?: Record<string, string>;
  _dimensions?: { width: number; height: number };
  _provider?: string;
}

interface ImageUploaderProps {
  listingId?: string;
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
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
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Validate file client-side
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return t('media.invalid_type') || 'Only JPEG, PNG, WebP, and GIF images are allowed';
      }
      if (file.size > MAX_SIZE) {
        return t('media.file_too_large') || `Image must be less than ${MAX_SIZE / (1024 * 1024)}MB`;
      }
      if (file.size < 1024) {
        return t('media.file_too_small') || 'File seems to be corrupted';
      }
      return null;
    },
    [t]
  );

  // Simulate progress for better UX
  const simulateProgress = useCallback((
    onUpdate: (progress: number) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      
      if (progress >= 95) {
        clearInterval(interval);
        onUpdate(95);
        setTimeout(() => {
          onUpdate(100);
          onComplete();
        }, 300);
      } else {
        onUpdate(Math.min(progress, 95));
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Upload a single file with advanced features
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
        _size: file.size,
        _originalSize: file.size,
      };

      const updatedImages = [...images, placeholder];
      onImagesChange(updatedImages);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (listingId) {
          formData.append('listingId', listingId);
        }

        // Start progress simulation
        const cleanupProgress = simulateProgress(
          (progress) => {
            const currentImages = [...updatedImages];
            const imgIndex = currentImages.findIndex(img => img.url === placeholder.url);
            if (imgIndex !== -1) {
              currentImages[imgIndex] = { ...currentImages[imgIndex], _progress: progress };
              onImagesChange(currentImages);
            }
          },
          () => {},
          (errorMsg) => {
            const filtered = updatedImages.filter((img) => img.url !== placeholder.url);
            onImagesChange(filtered);
            toast.error(errorMsg);
          }
        );

        // Actual upload to new API
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        cleanupProgress();

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Upload failed');
        }

        const data = await res.json();

        // Replace placeholder with real data
        const finalImages = updatedImages.map((img) => {
          if (img.url === placeholder.url) {
            return {
              ...img,
              id: data.path,
              url: data.thumbnailUrl || data.url, // Use thumbnail for grid view
              path: data.path,
              _uploading: false,
              _progress: 100,
              _optimized: data.optimized,
              _size: data.size,
              _originalSize: data.originalSize,
              _compressionRatio: data.compressionRatio,
              _thumbnailUrl: data.thumbnailUrl,
              _variants: data.variants,
              _dimensions: data.dimensions,
              _provider: data.provider,
            };
          }
          return img;
        });

        onImagesChange(finalImages);
        
        // Show success message with details
        if (data.optimized && data.compressionRatio > 0) {
          toast.success(t('media.upload_optimized') || 'Image uploaded and optimized!', {
            description: `${data.compressionRatio}% smaller • ${data.provider}`,
            duration: 4000,
          });
        } else {
          toast.success(t('media.upload_success') || 'Image uploaded successfully!');
        }
      } catch (err) {
        // Remove the failed upload
        const filtered = updatedImages.filter((img) => img.url !== placeholder.url);
        onImagesChange(filtered);
        toast.error(t('media.upload_failed') || 'Upload failed');
        console.error('Upload error:', err);
      }
    },
    [images, maxImages, onImagesChange, t, validateFile, simulateProgress, listingId]
  );

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || !user) {
        if (!user) toast.error(t('favorites.login_required'));
        return;
      }
      
      const filesToProcess = Array.from(files).slice(0, maxImages - images.length);
      
      if (filesToProcess.length < files.length) {
        toast.warning(t('media.too_many_files') || `Only ${maxImages - images.length} more images allowed`);
      }

      filesToProcess.forEach(uploadFile);
    },
    [uploadFile, user, t, maxImages, images.length]
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
    async (index: number) => {
      const imgToRemove = images[index];
      
      // If uploaded to server, also delete from storage
      if (imgToRemove?.path && !imgToRemove._uploading) {
        try {
          await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: imgToRemove.path }),
          });
        } catch (err) {
          console.warn('Failed to delete from storage:', err);
        }
      }

      const updated = images.filter((_, i) => i !== index);
      
      // If removed was primary and there are remaining images, set first as primary
      if (imgToRemove?.is_primary && updated.length > 0) {
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

  // Format file size
  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) fileInputRef.current?.click();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 sm:p-8 transition-all ${
          isDragging
            ? 'border-[#0E9F6E] bg-[#0E9F6E]/5 scale-[1.02]'
            : 'border-border hover:border-[#0E9F6E]/50 hover:bg-muted/50'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-[#0E9F6E]/10 transition-transform group-hover:scale-110">
          <Camera className="size-6 text-[#0E9F6E]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {t('listing.upload_images') || 'Upload Images'}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Upload className="size-3" />
            {t('listing.drag_hint') || 'Drag & drop or click to browse'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, WebP • Max {(MAX_SIZE / (1024 * 1024)).toFixed(0)}MB each
          </p>
        </div>
        
        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Shield className="size-3" />
            Secured
          </Badge>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Layers className="size-3" />
            Auto-Optimized
          </Badge>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      {/* Image grid */}
      {images.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, index) => (
              <div
                key={img.id || img.url}
                className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                  img.is_primary
                    ? 'border-[#0E9F6E] ring-2 ring-[#0E9F6E]/20'
                    : 'border-border hover:border-muted-foreground/30'
                } ${img._error ? 'border-destructive' : ''}`}
              >
                {/* Image */}
                <img
                  src={img.url}
                  alt=""
                  className="size-full object-cover"
                  onClick={() => !img._uploading && setPreviewImage(img)}
                />

                {/* Uploading overlay */}
                {img._uploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Loader2 className="size-8 animate-spin text-white mb-2" />
                    <span className="text-xs text-white">{img._progress || 0}%</span>
                    {img._progress !== undefined && img._progress > 0 && (
                      <div className="w-16 mt-2">
                        <Progress value={img._progress} className="h-1" />
                      </div>
                    )}
                  </div>
                )}

                {/* Error overlay */}
                {img._error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20">
                    <AlertCircle className="size-8 text-red-500 mb-1" />
                    <span className="text-xs text-red-600 text-center px-2">Upload failed</span>
                  </div>
                )}

                {/* Primary badge */}
                {img.is_primary && !img._uploading && (
                  <div className="absolute start-1.5 top-1.5 flex items-center gap-1 rounded-md bg-[#0E9F6E] px-1.5 py-0.5">
                    <Star className="size-3 fill-white text-white" />
                    <span className="text-[10px] font-semibold text-white">
                      {t('media.primary') || 'Primary'}
                    </span>
                  </div>
                )}

                {/* Optimized badge */}
                {img._optimized && !img._uploading && (
                  <div 
                    className="absolute end-1.5 top-1.5 cursor-pointer rounded-md bg-blue-500 px-1.5 py-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(showDetails === img.id ? null : img.id);
                    }}
                  >
                    <span className="text-[10px] font-semibold text-white">
                      {img._compressionRatio ? `-${img._compressionRatio}%` : 'Optimized'}
                    </span>
                  </div>
                )}

                {/* Provider badge */}
                {img._provider && !img._uploading && (
                  <div className="absolute end-1.5 bottom-12 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="text-[8px] px-1 py-0 bg-background/80">
                      {img._provider}
                    </Badge>
                  </div>
                )}

                {/* Details popup */}
                {showDetails === img.id && (
                  <div className="absolute inset-x-1.5 top-10 z-10 rounded-lg bg-background/95 p-2 shadow-lg backdrop-blur-sm text-[10px] space-y-1">
                    <p>Size: {formatSize(img._size)}</p>
                    {img._originalSize && img._size && (
                      <p>Saved: {formatSize(img._originalSize - img._size)}</p>
                    )}
                    {img._dimensions && (
                      <p>{img._dimensions.width}×{img._dimensions.height}</p>
                    )}
                    {img._variants && Object.keys(img._variants).length > 0 && (
                      <p>Variants: {Object.keys(img._variants).join(', ')}</p>
                    )}
                  </div>
                )}

                {/* Action buttons (show on hover) */}
                {!img._uploading && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex gap-1">
                      {/* Preview button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                        className="flex size-7 items-center justify-center rounded-md bg-white/90 text-foreground backdrop-blur-sm transition-colors hover:bg-white"
                        aria-label="Preview"
                      >
                        <ZoomIn className="size-4" />
                      </button>
                      
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

          {/* Image count and total size */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {images.length} / {maxImages} {t('media.images') || 'images'}
            </span>
            <div className="flex items-center gap-3">
              {images.some(img => img._size) && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="size-3" />
                  {formatSize(images.reduce((sum, img) => sum + (img._size || 0), 0))}
                </span>
              )}
              {images.some(img => img._optimized) && (
                <span className="flex items-center gap-1 text-blue-500">
                  <CheckCircle2 className="size-3" />
                  Optimized
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('media.image_preview') || 'Image Preview'}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-center rounded-lg bg-muted overflow-hidden">
                <img
                  src={previewImage.url}
                  alt=""
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>
                    {previewImage.is_primary && (
                      <span className="inline-flex items-center gap-1 mr-3 text-[#0E9F6E]">
                        <Star className="size-4 fill-current" />
                        {t('media.primary_image') || 'Primary Image'}
                      </span>
                    )}
                    {formatSize(previewImage._size)}
                  </span>
                  {previewImage._dimensions && (
                    <span>{previewImage._dimensions.width}×{previewImage._dimensions.height}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {previewImage._optimized && (
                    <span className="text-blue-500">
                      ✓ {t('media.optimized') || 'Optimized'} 
                      {previewImage._compressionRatio && ` (-${previewImage._compressionRatio}%)`}
                    </span>
                  )}
                  {previewImage._provider && (
                    <Badge variant="outline" className="text-xs">
                      {previewImage._provider}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Variants preview */}
              {previewImage._variants && Object.keys(previewImage._variants).length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium mb-2">Available Variants:</p>
                  <div className="flex gap-2">
                    {Object.entries(previewImage._variants).map(([size, path]) => (
                      <div key={size} className="text-xs bg-muted px-2 py-1 rounded">
                        <span className="capitalize">{size}</span>: <code className="text-[10px]">{path.split('/').pop()}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
