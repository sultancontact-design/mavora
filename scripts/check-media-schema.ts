import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSchema() {
  // Try inserting a test record with minimal fields
  const testId = crypto.randomUUID();
  
  // First get a listing ID
  const { data: listings } = await supabase
    .from('listings')
    .select('id')
    .limit(1);
    
  if (!listings || listings.length === 0) {
    console.log('No listings found');
    return;
  }

  // Try insert with basic fields
  const { data, error } = await supabase
    .from('listing_media')
    .insert({
      id: testId,
      listingId: listings[0].id,
      url: 'https://example.com/test.jpg',
      type: 'image',
    })
    .select()
    .single();
  
  console.log('Insert result:');
  console.log('Error:', error?.message);
  console.log('Data:', data ? JSON.stringify(data, null, 2) : 'null');
  
  // Clean up test record if inserted
  if (data) {
    await supabase.from('listing_media').delete().eq('id', testId);
  }
}

checkSchema().catch(console.error);
