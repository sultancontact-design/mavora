import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testQuery() {
  // Test the exact query from the API
  const { data, error, count } = await supabase
    .from('listings')
    .select(`
      *,
      category:categories(id, name, nameAr, nameFr, slug),
      media:listing_media(*)
    `, { count: 'exact' })
    .eq('status', 'active')
    .range(0, 2);
  
  console.log('=== Query Result ===');
  console.log('Error:', error?.message);
  console.log('Count:', count);
  
  if (data && data.length > 0) {
    const listing = data[0];
    console.log('\n=== First Listing ===');
    console.log('ID:', listing.id);
    console.log('Title:', listing.title);
    console.log('Category:', JSON.stringify(listing.category));
    console.log('Media count:', listing.media?.length || 0);
  }
}

testQuery().catch(console.error);
