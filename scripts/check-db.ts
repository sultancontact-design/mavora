import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkDB() {
  // Check total listings
  const { data: allListings, error: listError } = await supabase
    .from('listings')
    .select('id, title, status, createdAt')
    .limit(5);
  
  console.log('=== Sample Listings ===');
  console.log('Error:', listError?.message);
  console.log('Data:', JSON.stringify(allListings, null, 2));

  // Count by status
  const { count: activeCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  const { count: totalCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n=== Counts ===');
  console.log('Total listings:', totalCount);
  console.log('Active listings:', activeCount);

  // Check categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ar, slug')
    .limit(10);
  
  console.log('\n=== Categories ===');
  console.log(JSON.stringify(categories, null, 2));
}

checkDB().catch(console.error);
