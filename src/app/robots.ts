import type { MetadataRoute } from 'next';

/**
 * Robots.txt Generator for Mavora
 * Generates dynamic robots.txt with proper rules
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mavora.ma';
  
  return {
    rules: [
      // Allow all crawlers
      {
        userAgent: '*',
        allow: '/',
        // Disallow admin and private areas
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/_next/',
          '/static/',
        ],
      },
      
      // Special rules for Googlebot
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      
      // Special rules for Bingbot
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    
    // Sitemap location
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
