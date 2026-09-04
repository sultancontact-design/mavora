/**
 * SEO & Metadata Utilities
 * Generates optimized metadata for pages
 * 
 * @module lib/seo
 */

import { Metadata, Viewport } from 'next';

// Site configuration
const SITE_CONFIG = {
  name: 'مافورة - Mavora',
  description: 'منصة السوق العربية للشراء والبيع - اكتشف أفضل العروض والمنتجات في المغرب والعالم العربي',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://my-project-nu-nine-64.vercel.app',
  ogImage: '/og-image.png',
  locale: 'ar_MA',
  type: 'website' as const,
  twitterHandle: '@mavora_ma',
};

// Default viewport configuration
export const DEFAULT_VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
};

/**
 * Generate base metadata for all pages
 */
export function generateBaseMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: {
      default: SITE_CONFIG.name,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: SITE_CONFIG.description,
    keywords: [
      'سوق عربي',
      'شراء وبيع',
      'إعلانات مبوبة',
      'المغرب',
      'سوق مغربي',
      'منتجات عربية',
      'تسوق أونلاين',
      'Mavora',
      'marketplace',
      'Morocco',
    ],
    authors: [{ name: 'Mavora Team', url: SITE_CONFIG.url }],
    creator: 'Mavora',
    publisher: 'Mavora',
    
    // Open Graph
    openGraph: {
      type: SITE_CONFIG.type,
      locale: SITE_CONFIG.locale,
      alternateLocale: ['en_US', 'fr_FR'],
      url: SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      title: SITE_CONFIG.name,
      description: SITE_CONFIG.description,
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: SITE_CONFIG.name,
        },
      ],
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: SITE_CONFIG.name,
      description: SITE_CONFIG.description,
      images: [SITE_CONFIG.ogImage],
      creator: SITE_CONFIG.twitterHandle,
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Verification
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      other: {
        'baidu-verify': process.env.BAIDU_VERIFICATION || '',
      },
    },
    
    // Alternates
    alternates: {
      canonical: '/',
      languages: {
        'ar-MA': '/ar',
        'en-US': '/en',
        'fr-FR': '/fr',
      },
    },
    
    ...overrides,
  };
}

/**
 * Generate metadata for listing/product pages
 */
export function generateListingMetadata(listing: {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  id: string;
}): Metadata {
  const title = `${listing.title} - ${listing.category}`;
  const price = formatPrice(listing.price, listing.currency);
  
  return generateBaseMetadata({
    title,
    description: listing.description.substring(0, 160),
    openGraph: {
      title,
      description: `${listing.description.substring(0, 150)}... ${price}`,
      type: 'product',
      images: listing.images.map((img, idx) => ({
        url: img,
        width: idx === 0 ? 800 : 400,
        height: idx === 0 ? 600 : 300,
        alt: listing.title,
      })),
    },
    other: {
      'product:price:amount': String(listing.price),
      'product:price:currency': listing.currency,
      'product:availability': 'in stock',
    },
  });
}

/**
 * Generate metadata for category pages
 */
export function generateCategoryMetadata(category: {
  name: string;
  slug: string;
  description?: string;
  count?: number;
}): Metadata {
  const title = `${category.name} - إعلانات مبوبة`;
  const description = category.description || 
    `اكتشف ${category.count || ''} إعلان في قسم ${category.name} على منصة مافورة`;
  
  return generateBaseMetadata({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  });
}

/**
 * Generate metadata for profile/seller pages
 */
export function generateProfileMetadata(user: {
  name: string;
  bio?: string;
  role?: string;
  avatarUrl?: string;
}): Metadata {
  const isSeller = user.role === 'seller';
  const title = `${user.name} ${isSeller ? '- بائع' : '- مستخدم'}`;
  const description = user.bio || `ملف ${user.name} الشخصي على منصة مافورة`;
  
  return generateBaseMetadata({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      ...(user.avatarUrl && {
        images: [{ url: user.avatarUrl, alt: user.name }],
      }),
    },
  });
}

/**
 * Format price for display
 */
function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency: currency || 'MAD',
  }).format(amount);
}

/**
 * Generate JSON-LD structured data for listings
 */
export function generateListingSchema(listing: {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  seller: {
    name: string;
    id: string;
  };
  location?: string;
  condition?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.images,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.currency || 'MAD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: listing.seller.name,
      },
    },
    category: listing.category,
    ...(listing.condition && {
      itemCondition: `https://schema.org/${listing.condition}Condition`,
    }),
  };
}

/**
 * Generate JSON-LD for organization
 */
export function generateOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    description: SITE_CONFIG.description,
    sameAs: [
      'https://twitter.com/mavora_ma',
      'https://facebook.com/mavora.ma',
      'https://instagram.com/mavora.ma',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Arabic', 'English', 'French'],
    },
  };
}

/**
 * Generate JSON-LD for breadcrumb navigation
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}
