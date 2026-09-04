// ============================================================
// 🖼️ Optimized Image Component
// Lazy loading, blur placeholder, responsive, WebP/AVIF
// ============================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

// ============================================================
// Types
// ============================================================

interface OptimizedImageProps {
  /** Image source */
  src: string;
  /** Alternative text (required for accessibility) */
  alt: string;
  /** Image width */
  width?: number | string;
  /** Image height */
  height?: number | string;
  /** Aspect ratio (used when width/height not specified) */
  aspectRatio?: string;
  /** Whether to use lazy loading (default: true) */
  lazy?: boolean;
  /** Blur placeholder URL or base64 */
  blurSrc?: string;
  /** Enable blur placeholder effect */
  blurPlaceholder?: boolean;
  /** Object fit for the image */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Border radius */
  radius?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Container additional classes */
  containerClassName?: string;
  /** Click handler */
  onClick?: () => void;
  /** Error fallback (shown when image fails to load) */
  fallback?: React.ReactNode;
  /** Loading component (custom loader) */
  loadingComponent?: React.ReactNode;
  /** Root margin for intersection observer (for lazy loading) */
  rootMargin?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image errors */
  onError?: () => void;
  /** Priority loading (for above-the-fold images) */
  priority?: boolean;
  /** Quality (1-100) */
  quality?: number;
  /** Fill mode (image fills parent) */
  fill?: boolean;
}

// ============================================================
// Main Component
// ============================================================

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  aspectRatio = '16/9',
  lazy = true,
  blurSrc,
  blurPlaceholder = true,
  objectFit = 'cover',
  radius = '0.5rem',
  className,
  containerClassName,
  onClick,
  fallback,
  loadingComponent,
  rootMargin = '200px',
  onLoad,
  onError,
  priority = false,
  quality = 85,
  fill = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const element = imgRef.current;
    if (!element) return;

    // Check if IntersectionObserver is available
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      setIsLoading(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setIsLoading(true);
          observer.unobserve(element);
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [lazy, priority, rootMargin, isInView]);

  // Handle load event
  const handleLoad = useCallback(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle error event
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Calculate dimensions
  const style = !fill
    ? {
        width: typeof width === 'number' ? `${width}px` : width ?? '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        aspectRatio: height ? undefined : aspectRatio,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        overflow: 'hidden',
        position: 'relative' as const,
      }
    : {
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        overflow: 'hidden',
        position: 'relative' as const,
      };

  // Render error state
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'flex items-center justify-center bg-muted',
          containerClassName
        )}
        style={style}
      >
        {fallback || (
          <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
            <svg
              className="size-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
              />
            </svg>
            <span className="text-xs">فشل تحميل الصورة</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative bg-muted',
        onClick && 'cursor-pointer',
        containerClassName
      )}
      style={style}
      onClick={onClick}
    >
      {/* Loading State */}
      {(isLoading || !isInView) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {loadingComponent || (
            <Skeleton
              className="w-full h-full absolute inset-0"
              animate={true}
            />
          )}
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <>
          {/* Blur Placeholder */}
          {blurPlaceholder && isLoading && blurSrc && (
            <Image
              src={blurSrc}
              alt=""
              fill
              className="absolute inset-0 blur-xl scale-110 opacity-50"
              unoptimized
              aria-hidden="true"
            />
          )}

          {/* Main Image */}
          <Image
            src={src}
            alt={alt}
            fill={fill}
            width={fill ? undefined : (typeof width === 'number' ? width : undefined)}
            height={fill ? undefined : (typeof height === 'number' ? height : undefined)}
            quality={quality}
            priority={priority}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              objectFit === 'cover' && 'object-cover',
              objectFit === 'contain' && 'object-contain',
              objectFit === 'fill' && 'object-fill',
              objectFit === 'none' && 'object-none',
              objectFit === 'scale-down' && 'object-scale-down',
              className
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// Avatar Component (wrapper around OptimizedImage)
// ============================================================

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  /** Fallback initial(s) to show when no image */
  fallbackText?: string;
  /** Additional CSS classes */
  className?: string;
  onClick?: () => void;
}

const avatarSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  xxl: 96,
};

export function Avatar({
  src,
  alt,
  size = 'md',
  fallbackText,
  className,
  onClick,
}: AvatarProps) {
  const sizeValue = typeof size === 'string' ? (avatarSizes[size] ?? 40) : size;
  const initials = fallbackText
    ? fallbackText
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  // If no source, show initials
  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-[#0E9F6E]/10 text-[#0E9F6E] font-medium',
          className
        )}
        style={{
          width: sizeValue,
          height: sizeValue,
          fontSize: sizeValue * 0.35,
        }}
        onClick={onClick}
      >
        {initials || '?'}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizeValue}
      height={sizeValue}
      radius="50%"
      lazy={!onClick}
      className={className}
      onClick={onClick}
      fallback={
        <div
          className="flex items-center justify-center rounded-full bg-[#0E9F6E]/10 text-[#0E9F6E] font-medium w-full h-full"
          style={{ fontSize: sizeValue * 0.35 }}
        >
          {initials || '?'}
        </div>
      }
    />
  );
}

// ============================================================
// Thumbnail Grid Component
// ============================================================

interface ThumbnailGridProps {
  images: string[];
  alt: string;
  maxVisible?: number;
  gap?: number;
  radius?: string | number;
  onClick?: (index: number) => void;
  className?: string;
}

export function ThumbnailGrid({
  images,
  alt,
  maxVisible = 4,
  gap = 4,
  radius = '0.375rem',
  onClick,
  className,
}: ThumbnailGridProps) {
  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  return (
    <div
      className={cn('grid grid-cols-2 gap-1', className)}
      style={{ gap }}
    >
      {visibleImages.map((src, index) => (
        <div key={index} className="relative" style={{ aspectRatio: '1' }}>
          <OptimizedImage
            src={src}
            alt={`${alt} ${index + 1}`}
            width="100%"
            height="100%"
            radius={radius}
            lazy={index > 0}
            onClick={() => onClick?.(index)}
          />
          {/* Show remaining count overlay on last visible image */}
          {index === maxVisible - 1 && remainingCount > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-medium rounded-lg cursor-pointer"
              onClick={() => onClick?.(index)}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Export all components
// ============================================================

export default OptimizedImage;
