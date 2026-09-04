/**
 * Mavora - Image Optimization Utilities
 * Arabic Marketplace Platform (Morocco)
 * 
 * Image handling with:
 * - Next.js Image component wrappers
 * - Lazy loading strategies
 * - Placeholder generation
 * - Image validation
 * - CDN URL generation
 */

// =============================================================================
// Types / الأنواع
// =============================================================================

export interface ImageOptions {
  /** Image source (URL or path) */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Fill container instead of fixed size */
  fill?: boolean;
  /** Image quality (1-100) */
  quality?: number;
  /** Priority loading (above the fold) */
  priority?: boolean;
  /** Placeholder type */
  placeholder?: 'blur' | 'empty' | 'gradient';
  /** Blur data URL or gradient colors */
  blurDataURL?: string;
  /** CSS class name */
  className?: string;
  /** onClick handler */
  onClick?: () => void;
  /** Object fit */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Custom styles */
  style?: React.CSSProperties;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  format?: string;
}

// =============================================================================
// Supported Formats / الصيغ المدعومة
// =============================================================================

const SUPPORTED_FORMATS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSIONS = { width: 4000, height: 4000 };

// =============================================================================
// Image Validation / التحقق من الصور
// =============================================================================

/**
 * Validate image file before upload
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  // Check file type
  if (!file.type || !SUPPORTED_FORMATS.has(file.type)) {
    return {
      valid: false,
      error: 'صيغة الملف غير مدعومة. الصيغ المقبولة: JPG, PNG, WebP, AVIF, GIF',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      fileSize: file.size,
    };
  }

  // Get dimensions
  const dimensions = await getImageDimensions(file);
  
  if (!dimensions) {
    return {
      valid: false,
      error: 'فشل في قراءة أبعاد الصورة',
    };
  }

  // Check dimensions
  if (dimensions.width > MAX_DIMENSIONS.width || dimensions.height > MAX_DIMENSIONS.height) {
    return {
      valid: false,
      error: `أبعاد الصورة كبيرة جداً. الحد الأقصى ${MAX_DIMENSIONS.width}×${MAX_DIMENSIONS.height} بكسل`,
      dimensions,
    };
  }

  return {
    valid: true,
    fileSize: file.size,
    dimensions,
    format: file.type,
  };
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  });
}

/**
 * Validate image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const imagePath = urlObj.pathname.toLowerCase();
    
    // Check for image extensions or common CDNs
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => imagePath.endsWith(ext));
    
    // Allow known image services
    const allowedHosts = [
      'images.unsplash.com',
      'picsum.photos',
      'placehold.co',
      'via.placeholder.com',
      'cloudinary.com',
      'storage.googleapis.com',
      'supabase.co',
      'mavora.ma',
    ];
    
    return hasImageExtension || allowedHosts.some(host => urlObj.host.includes(host));
  } catch {
    return false;
  }
}

// =============================================================================
// Placeholder Generation / توليد العناصر النائبة
// =============================================================================

/**
 * Generate a simple SVG placeholder
 */
export function generatePlaceholderSVG(
  width: number, 
  height: number, 
  options?: {
    text?: string;
    bgColor?: string;
    textColor?: string;
  }
): string {
  const {
    text = `${width}×${height}`,
    bgColor = '#E5E7EB',
    textColor = '#9CA3AF',
  } = options || {};

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          font-family="system-ui, sans-serif" font-size="14" fill="${textColor}">
      ${text}
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generate a gradient placeholder (for blur effect)
 */
export function generateGradientPlaceholder(
  width: number = 100,
  height: number = 100,
  colors: [string, string] = ['#F3F4F6', '#E5E7EB']
): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generate blur data URL from color
 */
export function generateBlurDataURL(color: string = '#E5E7EB'): string {
  // Simple solid color as base64
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// =============================================================================
// CDN URL Generation / إنشاء روابط CDN
// =============================================================================

interface CDNOptions {
  /** Base CDN URL */
  baseUrl?: string;
  /** Image quality (1-100) */
  quality?: number;
  /** Output format */
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  /** Resize width */
  width?: number;
  /** Resize height */
  height?: string;
  /** Crop mode */
  crop?: 'fill' | 'limit' | 'pad' | 'scale';
  /** Enable progressive loading */
  progressive?: boolean;
}

/**
 * Generate optimized CDN URL (for Cloudinary-like services)
 */
export function getCDNUrl(src: string, options: CDNOptions = {}): string {
  const {
    baseUrl = process.env.NEXT_PUBLIC_CDN_URL || '',
    quality = 80,
    format = 'auto',
    width,
    height,
    crop = 'limit',
  } = options;

  // If no CDN configured, return original
  if (!baseUrl) return src;

  // If already a CDN URL, return as-is
  if (src.includes(baseUrl)) return src;

  // Build transformation parameters
  const params: string[] = [];
  
  if (width) params.push(`w_${width}`);
  if (height) params.push(`h_${height}`);
  if (crop !== 'limit') params.push(`c_${crop}`);
  params.push(`q_${quality}`);
  if (format !== 'auto') params.push(`f_${format}`);

  // Generate CDN URL (Cloudinary-style)
  const transformation = params.join(',');
  const publicId = src.includes('http') ? encodeURI(src) : src.replace(/^\//, '');
  
  return `${baseUrl}/${transformation}/${publicId}`;
}

/**
 * Generate responsive image srcSet
 */
export function generateSrcSet(
  src: string,
  sizes: number[] = [320, 480, 640, 768, 1024, 1280, 1536],
  options?: Omit<CDNOptions, 'width'>
): string {
  return sizes
    .map(size => {
      const url = getCDNUrl(src, { ...options, width: size });
      return `${url} ${size}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints?: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string {
  const {
    mobile = '100vw',
    tablet = '100vw',
    desktop = '100vw',
  } = breakpoints || {};

  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${desktop}`;
}

// =============================================================================
// Image Component Wrappers / غلافات مكونات الصور
// =============================================================================

/**
 * Props for OptimizedImage component
 */
export interface OptimizedImageProps extends ImageOptions {
  /** Show zoom on hover */
  zoomOnHover?: boolean;
  /** Show loading skeleton */
  showSkeleton?: boolean;
  /** Fallback image if load fails */
  fallbackSrc?: string;
  /** Error message for accessibility */
  errorMessage?: string;
  /** Rounded corners */
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Aspect ratio (e.g., '16/9', '4/3', '1/1') */
  aspectRatio?: string;
}

/**
 * Get border radius class
 */
function getRoundedClass(rounded?: boolean | string): string {
  if (!rounded) return '';
  if (rounded === true) return 'rounded-lg';
  if (typeof rounded === 'string') {
    const map: Record<string, string> = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };
    return map[rounded] || '';
  }
  return '';
}

// =============================================================================
// Listing Image Helpers / مساعدات صور الإعلانات
// =============================================================================

/**
 * Get listing image URL with fallback
 */
export function getListingImageUrl(
  imageUrl: string | null | undefined,
  options?: {
    fallbackText?: string;
    width?: number;
    height?: number;
  }
): string {
  const { fallbackText = 'لا توجد صورة', width = 800, height = 600 } = options || {};

  if (imageUrl && isValidImageUrl(imageUrl)) {
    return getCDNUrl(imageUrl, { width, height });
  }

  // Return placeholder
  return generatePlaceholderSVG(width, height, { text: fallbackText });
}

/**
 * Get thumbnail URL
 */
export function getThumbnailUrl(
  imageUrl: string | null | undefined,
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const sizes = {
    sm: { width: 150, height: 150 },
    md: { width: 300, height: 300 },
    lg: { width: 500, height: 500 },
  };

  const { width, height } = sizes[size];
  return getListingImageUrl(imageUrl, { width, height });
}

/**
 * Get avatar URL with fallback to initials
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  name: string,
  size: number = 100
): string {
  if (avatarUrl && isValidImageUrl(avatarUrl)) {
    return getCDNUrl(avatarUrl, { width: size, height: size });
  }

  // Generate initials avatar
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colors = [
    ['#EF4444', '#FFFFFF'], // red
    ['#F59E0B', '#FFFFFF'], // amber
    ['#10B981', '#FFFFFF'], // green
    ['#3B82F6', '#FFFFFF'], // blue
    ['#8B5CF6', '#FFFFFF'], // violet
    ['#EC4899', '#FFFFFF'], // pink
  ];
  
  const colorIndex = name.charCodeAt(0) % colors.length;
  const [bgColor, textColor] = colors[colorIndex];

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="50%" fill="${bgColor}"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
          font-family="system-ui, sans-serif" font-size="${size * 0.4}" font-weight="600" fill="${textColor}">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// =============================================================================
// Export Default / التصدير الافتراضي
// =============================================================================

export default {
  validateImage,
  isValidImageUrl,
  generatePlaceholderSVG,
  generateGradientPlaceholder,
  generateBlurDataURL,
  getCDNUrl,
  generateSrcSet,
  generateSizes,
  getListingImageUrl,
  getThumbnailUrl,
  getAvatarUrl,
};
