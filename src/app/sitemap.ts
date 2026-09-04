import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mavora.ma';

// -------------------------------------------
// Types
// -------------------------------------------

interface CategoryRow {
  id: string;
  slug: string;
  slug_en: string | null;
  slug_ar: string | null;
  slug_fr: string | null;
  is_active: boolean;
  updated_at: string;
}

interface ListingRow {
  id: string;
  slug: string | null;
  title: string;
  status: string;
  updated_at: string;
}

interface CountryRow {
  id: string;
  code: string;
  is_active: boolean;
}

interface CityRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

// -------------------------------------------
// Static Pages Configuration
// -------------------------------------------

const STATIC_PAGES: Array<{
  url: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}> = [
  // Main Pages
  { url: '', priority: 1.0, changeFrequency: 'daily' },
  { url: '/listings', priority: 0.9, changeFrequency: 'daily' },
  
  // Auth Pages (lower priority, noindex usually)
  { url: '/auth/login', priority: 0.3, changeFrequency: 'monthly' },
  { url: '/auth/signup', priority: 0.3, changeFrequency: 'monthly' },
  
  // User Pages
  { url: '/profile', priority: 0.5, changeFrequency: 'weekly' },
  { url: '/favorites', priority: 0.5, changeFrequency: 'weekly' },
  { url: '/messages', priority: 0.6, changeFrequency: 'daily' },
  { url: '/wallet', priority: 0.5, changeFrequency: 'weekly' },
  { url: '/seller/dashboard', priority: 0.5, changeFrequency: 'daily' },
  
  // Content Pages
  { url: '/about', priority: 0.4, changeFrequency: 'monthly' },
  { url: '/contact', priority: 0.4, changeFrequency: 'monthly' },
  { url: '/help', priority: 0.5, changeFrequency: 'monthly' },
  { url: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { url: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  
  // Action Pages
  { url: '/listings/create', priority: 0.6, changeFrequency: 'monthly' },
];

// -------------------------------------------
// Helper Functions
// -------------------------------------------

function generateSitemapEntry(
  path: string,
  options: {
    lastModified?: Date;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }
): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${path}`,
    lastModified: options.lastModified || new Date(),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  };
}

function formatDate(dateString: string): Date {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
}

// -------------------------------------------
// Main Sitemap Generator
// -------------------------------------------

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  
  // -------------------------------------------
  // 1. Static Pages
  // -------------------------------------------
  for (const page of STATIC_PAGES) {
    entries.push(generateSitemapEntry(page.url, {
      priority: page.priority,
      changeFrequency: page.changeFrequency,
    }));
  }
  
  // -------------------------------------------
  // 2. Dynamic Entries from Database
  // -------------------------------------------
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found, returning static sitemap only');
    return entries;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // -------------------------------------------
    // Categories
    // -------------------------------------------
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug, slug_en, slug_ar, slug_fr, is_active, updated_at')
      .eq('is_active', true)
      .is('parent_id', null);
    
    if (categories && categories.length > 0) {
      for (const cat of categories as CategoryRow[]) {
        const slug = cat.slug || cat.slug_en || cat.slug_ar || cat.slug_fr || cat.id;
        entries.push(generateSitemapEntry(`/category/${slug}`, {
          lastModified: formatDate(cat.updated_at),
          priority: 0.8,
          changeFrequency: 'weekly',
        }));
      }
      
      // Fetch subcategories
      for (const parent of categories as CategoryRow[]) {
        const parentSlug = parent.slug || parent.slug_en || parent.slug_ar || parent.id;
        
        const { data: subcategories } = await supabase
          .from('categories')
          .select('id, slug, slug_en, slug_ar, slug_fr, updated_at')
          .eq('is_active', true)
          .eq('parent_id', parent.id);
        
        if (subcategories) {
          for (const sub of subcategories as CategoryRow[]) {
            const subSlug = sub.slug || sub.slug_en || sub.slug_ar || sub.id;
            entries.push(generateSitemapEntry(`/category/${parentSlug}/${subSlug}`, {
              lastModified: formatDate(sub.updated_at),
              priority: 0.7,
              changeFrequency: 'weekly',
            }));
          }
        }
      }
    }
    
    // -------------------------------------------
    // Active Listings (limited to most recent/relevant)
    // -------------------------------------------
    const { data: listings } = await supabase
      .from('listings')
      .select('id, slug, title, status, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1000); // Google recommends max 50,000 URLs per sitemap
    
    if (listings && listings.length > 0) {
      for (const listing of listings as ListingRow[]) {
        // Use slug or fall back to ID
        const listingPath = listing.slug 
          ? `/listings/${listing.slug}` 
          : `/listings/${listing.id}`;
        
        entries.push(generateSitemapEntry(listingPath, {
          lastModified: formatDate(listing.updated_at),
          priority: 0.6,
          changeFrequency: 'daily',
        }));
      }
    }
    
    // -------------------------------------------
    // Cities
    // -------------------------------------------
    const { data: cities } = await supabase
      .from('cities')
      .select('id, name, slug, is_active')
      .eq('is_active', true);
    
    if (cities && cities.length > 0) {
      for (const city of cities as CityRow[]) {
        entries.push(generateSitemapEntry(`/city/${city.slug}`, {
          priority: 0.7,
          changeFrequency: 'weekly',
        }));
      }
    }
    
    // -------------------------------------------
    // Countries
    // -------------------------------------------
    const { data: countries } = await supabase
      .from('countries')
      .select('id, code, is_active')
      .eq('is_active', true);
    
    if (countries && countries.length > 0) {
      for (const country of countries as CountryRow[]) {
        entries.push(generateSitemapEntry(`/country/${country.code.toLowerCase()}`, {
          priority: 0.6,
          changeFrequency: 'monthly',
        }));
      }
    }
    
  } catch (error) {
    console.error('❌ Error generating dynamic sitemap entries:', error);
    // Return static entries even if DB fails
  }
  
  return entries;
}
