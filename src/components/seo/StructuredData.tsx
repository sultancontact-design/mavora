/**
 * Structured Data Component for Mavora
 * Adds Schema.org JSON-LD for SEO optimization
 * 
 * @components/seo/StructuredData
 */

import React from 'react';

// ============================================================
// Types
// ============================================================

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
    availableLanguage?: string[];
  };
}

interface ListingData {
  name: string;
  description: string;
  image: string | string[];
  url: string;
  price: number;
  priceCurrency: string;
  availability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
  condition: 'https://schema.org/NewCondition' | 'https://schema.org/UsedCondition';
  seller: {
    name: string;
    url: string;
  };
  category: string;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
}

interface WebSiteData {
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

// ============================================================
// Organization Schema (for the whole site)
// ============================================================

export function OrganizationSchema({ data }: { data: OrganizationData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    ...(data.address && {
      address: {
        '@type': 'PostalAddress',
        ...data.address,
      },
    }),
    ...(data.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...data.contactPoint,
      },
    }),
    sameAs: [
      'https://facebook.com/mavorama',
      'https://twitter.com/mavorama',
      'https://instagram.com/mavorama',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// Product/Listing Schema (for individual listings)
// ============================================================

export function ListingSchema({ data }: { data: ListingData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    image: Array.isArray(data.image) ? data.image : [data.image],
    url: data.url,
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.priceCurrency,
      availability: data.availability,
      seller: {
        '@type': 'Person',
        ...data.seller,
      },
    },
    ...(data.condition && { itemCondition: data.condition }),
    category: data.category,
    ...(data.location && {
      availableAtOrFrom: {
        '@type': 'Place',
        name: data.location.name,
        ...(data.location.latitude && {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          },
        }),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// WebSite Schema (for homepage)
// ============================================================

export function WebSiteSchema({ data }: { data: WebSiteData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    description: data.description,
    ...(data.potentialAction && {
      potentialAction: data.potentialAction,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// BreadcrumbList Schema
// ============================================================

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// FAQ Schema (for help/FAQ pages)
// ============================================================

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// LocalBusiness Schema (for Mavora as Moroccan marketplace)
// ============================================================

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://mavora.ma/#organization',
    name: 'مافورة - Mavora',
    alternateName: 'Mavora Marketplace',
    url: 'https://mavora.ma',
    logo: 'https://mavora.ma/icons/icon-512x512.svg',
    image: 'https://mavora.ma/screenshots/home.svg',
    description: 'منصة السوق العربية الأولى في المغرب للشراء والبيع - سوق إلكتروني للإعلانات المبوبة',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'شارع محمد الخامس',
      addressLocality: 'الدار البيضاء',
      addressRegion: 'الدار البيضاء - سطات',
      postalCode: '20000',
      addressCountry: 'MA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.5731,
      longitude: -7.5898,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+212-522-000000',
      contactType: 'customer service',
      availableLanguage: ['Arabic', 'French', 'English'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Morocco',
    },
    knowsLanguage: ['ar', 'fr', 'en'],
    foundingDate: '2024',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: 10,
      maxValue: 50,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// Pre-configured defaults for Mavora
// ============================================================

export const MAVORA_ORG_DATA: OrganizationData = {
  name: 'مافورة - Mavora Marketplace',
  url: 'https://mavora.ma',
  logo: 'https://mavora.ma/icons/icon-512x512.svg',
  description: 'منصة السوق العربية الأولى في المغرب للشراء والبيع - اكتشف أفضل العروض والمنتجات في جميع المدن المغربية',
  address: {
    streetAddress: 'شارع محمد الخامس',
    addressLocality: 'الدار البيضاء',
    addressRegion: 'الدار البيضاء - سطات',
    postalCode: '20000',
    addressCountry: 'MA',
  },
  contactPoint: {
    telephone: '+212-522-000000',
    contactType: 'customer service',
    availableLanguage: ['Arabic', 'French', 'English'],
  },
};

export const MAVORA_WEBSITE_DATA: WebSiteData = {
  name: 'مافورة - Mavora Marketplace',
  url: 'https://mavora.ma',
  description: 'منصة السوق العربية للشراء والبيع في المغرب - إعلانات مبوبة مجانية للإلكترونيات، العقارات، السيارات، والأكثر',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://mavora.ma/listings?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

// Default export
export default OrganizationSchema;
