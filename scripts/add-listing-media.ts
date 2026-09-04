/**
 * Script to add placeholder images for all listings
 * This makes the platform look professional with visual content
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Professional placeholder images by category
// Using picsum.photos for realistic placeholder images
const PLACEHOLDER_IMAGES_BY_CATEGORY: Record<string, string[]> = {
  vehicles: [
    'https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=800', // Car
    'https://images.pexels.com/photos/2144207/pexels-photo-2144207.jpeg?auto=compress&cs=tinysrgb&w=800', // Motorcycle
    'https://images.pexels.com/photos/1149151/pexels-photo-1149151.jpeg?auto=compress&cs=tinysrgb&w=800', // Car interior
  ],
  'real-estate': [
    'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800', // House
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800', // Apartment
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800', // Building
  ],
  electronics: [
    'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=800', // Phone
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800', // Laptop
    'https://images.pexels.com/photos/5082579/pexels-photo-5082579.jpeg?auto=compress&cs=tinysrgb&w=800', // Camera
  ],
  'home-garden': [
    'https://images.pexels.com/photos/2766769/pexels-photo-2766769.jpeg?auto=compress&cs=tinysrgb&w=800', // Furniture
    'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=800', // Home
    'https://images.pexels.com/photos/1080722/pexels-photo-1080722.jpeg?auto=compress&cs=tinysrgb&w=800', // Garden
  ],
  'jobs-services': [
    'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800', // Office
    'https://images.pexels.com/photos/5329081/pexels-photo-5329081.jpeg?auto=compress&cs=tinysrgb&w=800', // Service
  ],
  fashion: [
    'https://images.pexels.com/photos/2911545/pexels-photo-2911545.jpeg?auto=compress&cs=tinysrgb&w=800', // Fashion
    'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800', // Clothes
  ],
  'sports-hobbies': [
    'https://images.pexels.com/photos/46798/the-rhomboids-looks-large.jpg?auto=compress&cs=tinysrgb&w=800', // Sports
    'https://images.pexels.com/photos/1554363/pexels-photo-1554363.jpeg?auto=compress&cs=tinysrgb&w=800', // Hobby
  ],
};

// Default images for any category not listed above
const DEFAULT_IMAGES = [
  'https://images.pexels.com/photos/6740102/pexels-photo-6740102.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5839420/pexels-photo-5839420.jpeg?auto=compress&cs=tinysrgb&w=800',
];

function getImagesForCategory(categorySlug: string): string[] {
  return PLACEHOLDER_IMAGES_BY_CATEGORY[categorySlug] || DEFAULT_IMAGES;
}

async function addListingMedia() {
  console.log('🚀 Starting to add media for listings...\n');
  
  // Fetch all active listings with their category
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select(`
      id,
      categoryId,
      category:categories(slug)
    `)
    .eq('status', 'active');

  if (listingsError) {
    console.error('❌ Error fetching listings:', listingsError.message);
    return;
  }

  console.log(`📦 Found ${listings?.length || 0} active listings\n`);

  if (!listings || listings.length === 0) {
    console.log('No listings found');
    return;
  }

  let totalMediaAdded = 0;
  const errors: string[] = [];

  for (const listing of listings) {
    const categorySlug = listing.category?.slug || 'default';
    const images = getImagesForCategory(categorySlug);
    
    // Add 1-3 images per listing
    const numImages = Math.floor(Math.random() * 3) + 1;
    
    const mediaRecords = [];
    
    for (let i = 0; i < Math.min(numImages, images.length); i++) {
      const imageUrl = images[i % images.length];
      const mediaId = crypto.randomUUID();
      
      mediaRecords.push({
        id: mediaId,
        listingId: listing.id,
        url: imageUrl,
        thumbnailUrl: imageUrl, // Same URL for thumbnail (could use different size)
        type: 'image',
        sortOrder: i,
        isPrimary: i === 0, // First image is primary
        altText: `صورة للإعلان ${i + 1}`,
        createdAt: new Date().toISOString(),
      });
    }

    // Insert media records
    const { error: insertError } = await supabase
      .from('listing_media')
      .insert(mediaRecords);

    if (insertError) {
      errors.push(`Listing ${listing.id}: ${insertError.message}`);
    } else {
      totalMediaAdded += mediaRecords.length;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ MEDIA ADDITION COMPLETE');
  console.log('='.repeat(50));
  console.log(`📊 Total listings processed: ${listings.length}`);
  console.log(`🖼️  Total media records added: ${totalMediaAdded}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors (${errors.length}):`);
    errors.slice(0, 5).forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    if (errors.length > 5) {
      console.log(`   ... and ${errors.length - 5} more errors`);
    }
  } else {
    console.log('\n🎉 All media added successfully!');
  }
}

addListingMedia().catch(console.error);
