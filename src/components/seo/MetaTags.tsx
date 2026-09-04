/**
 * SEO Meta Tags Component for Mavora
 * Manages page-specific meta tags for better SEO
 * 
 * @components/seo/MetaTags
 */

import React from 'react';

// ============================================================
// Types
// ============================================================

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

interface OpenGraphData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  siteName?: string;
}

interface TwitterCardData {
  card?: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  image?: string;
  creator?: string;
}

interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  og?: OpenGraphData;
  twitter?: TwitterCardData;
  noIndex?: boolean;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  image?: string;
  structuredData?: React.ReactNode;
}

// ============================================================
// Main Component
// ============================================================

export default function MetaTags({
  title,
  description,
  keywords = [],
  canonicalUrl,
  og,
  twitter,
  noIndex = false,
  publishedAt,
  modifiedAt,
  author,
  image,
  structuredData,
}: MetaTagsProps) {
  // Default OG data from props
  const openGraph: OpenGraphData = og || {
    title,
    description,
    type: 'website',
    locale: 'ar_MA',
    siteName: 'مافورة - Mavora',
    ...(image && { image }),
  };

  // Default Twitter data
  const twitterCard: TwitterCardData = twitter || {
    card: 'summary_large_image',
    title,
    description,
    ...(image && { image }),
    creator: '@mavorama',
  };

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{title} | مافورة</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {author && <meta name="author" content={author} />}
      
      {noIndex && (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </>
      )}
      
      {/* Canonical URL */}
      {canonicalUrl && (
        <link rel="canonical" href={canonicalUrl} />
      )}
      
      {/* Dates */}
      {publishedAt && (
        <meta name="article:published_time" content={publishedAt} />
      )}
      {modifiedAt && (
        <meta name="article:modified_time" content={modifiedAt} />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={openGraph.title} />
      <meta property="og:description" content={openGraph.description} />
      <meta property="og:type" content={openGraph.type || 'website'} />
      <meta property="og:locale" content={openGraph.locale || 'ar_MA'} />
      <meta property="og:site_name" content={openGraph.siteName || 'مافورة - Mavora'} />
      
      {openGraph.url && (
        <meta property="og:url" content={openGraph.url} />
      )}
      {openGraph.image && (
        <meta property="og:image" content={openGraph.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={title} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard.card || 'summary_large_image'} />
      <meta name="twitter:title" content={twitterCard.title} />
      <meta name="twitter:description" content={twitterCard.description} />
      
      {twitterCard.creator && (
        <meta name="twitter:creator" content={twitterCard.creator} />
      )}
      {twitterCard.image && (
        <meta name="twitter:image" content={twitterCard.image} />
      )}
      
      {/* Additional SEO Meta */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      
      {/* Geographic Meta for Morocco */}
      <meta name="geo.region" content="MA" />
      <meta name="geo.placename" content="Morocco" />
      
      {/* Structured Data */}
      {structuredData}
    </>
  );
}

// ============================================================
// Pre-built configurations
// ============================================================

export function HomePageMeta() {
  return (
    <MetaTags
      title="مافورة - منصة السوق العربية في المغرب"
      description="اشترِ وبيع في أكبر سوق إلكتروني مغربي. إعلانات مبوبة مجانية للإلكترونيات، العقارات، السيارات، الأزياء، الوظائف والمزيد في جميع المدن المغربية."
      keywords={[
        'سوق مغربي',
        'إعلانات مبوبة مغرب',
        'شراء وبيع المغرب',
        'سوق إلكتروني مغرب',
        'مافورة',
        'Mavora',
        'إعلانات مجانية',
        'الدار البيضاء',
        'الرباط',
        'مراكش',
        'فاس',
        'طنجة',
      ]}
      canonicalUrl="https://mavora.ma"
      image="https://mavora.ma/screenshots/home.svg"
      structuredData={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'مافورة - Mavora Marketplace',
                url: 'https://mavora.ma',
                description: 'منصة السوق العربية للشراء والبيع في المغرب',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://mavora.ma/listings?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              })
            }}
          />
        </>
      }
    />
  );
}

export function ListingPageMeta({ listing }: {
  listing: {
    title: string;
    description: string;
    price: number;
    currency: string;
    city: string;
    category: string;
    image?: string;
    sellerName: string;
  };
}) {
  return (
    <MetaTags
      title={`${listing.title} - ${listing.price} ${listing.currency}`}
      description={listing.description.substring(0, 160)}
      keywords={[
        listing.title,
        listing.category,
        listing.city,
        'مغرب',
        'سوق',
        'إعلان',
        'مافورة',
      ]}
      canonicalUrl={`https://mavora.ma/listings/${listing.id}`}
      og={{
        title: `${listing.title} - ${listing.price} ${listing.currency}`,
        description: listing.description.substring(0, 200),
        type: 'product',
        image: listing.image,
      }}
      image={listing.image}
      structuredData={
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: listing.title,
              description: listing.description,
              image: listing.image,
              offers: {
                '@type': 'Offer',
                price: listing.price,
                priceCurrency: listing.currency,
                availability: 'https://schema.org/InStock',
                seller: {
                  '@type': 'Person',
                  name: listing.sellerName,
                },
              },
            })
          }}
        />
      }
    />
  );
}

export function CategoryPageMeta({ category }: {
  category: {
    name: string;
    slug: string;
    description?: string;
    count?: number;
  };
}) {
  return (
    <MetaTags
      title={`${category.name} - إعلانات مبوبة في المغرب`}
      description={category?.description || `تصفح أفضل إعلانات ${category.name} في جميع المدن المغربية. ${category.count || ''} إعلان متاح.`}
      keywords={[
        category.name,
        'مغرب',
        'إعلانات مبوبة',
        'شراء',
        'بيع',
        'مافورة',
      ]}
      canonicalUrl={`https://mavora.ma/category/${category.slug}`}
      og={{
        title: `${category.name} - مافورة`,
        type: 'website',
      }}
    />
  );
}
