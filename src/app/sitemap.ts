import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mavora.ma';

interface CategoryRow {
  id: string;
  slug_en: string | null;
  slug_ar: string | null;
  slug_fr: string | null;
  is_active: boolean;
}

interface CountryRow {
  id: string;
  code: string;
  is_active: boolean;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Try to fetch dynamic entries from Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return staticEntries;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const dynamicEntries: MetadataRoute.Sitemap = [];

    // Fetch active categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug_en, slug_ar, slug_fr, is_active')
      .eq('is_active', true)
      .is('parent_id', null);

    if (categories && categories.length > 0) {
      for (const cat of categories as CategoryRow[]) {
        const slug = cat.slug_en || cat.slug_ar || cat.slug_fr || cat.id;
        dynamicEntries.push({
          url: `${siteUrl}/category/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Fetch active countries
    const { data: countries } = await supabase
      .from('countries')
      .select('id, code, is_active')
      .eq('is_active', true);

    if (countries && countries.length > 0) {
      for (const country of countries as CountryRow[]) {
        dynamicEntries.push({
          url: `${siteUrl}/country/${country.code.toLowerCase()}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    return [...staticEntries, ...dynamicEntries];
  } catch {
    // DB unavailable, return basic sitemap
    return staticEntries;
  }
}
