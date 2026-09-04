import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkCategories() {
  // Try different table names
  const tables = ['categories', 'category', 'listing_categories'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(3);
    
    console.log(`=== Table: ${table} ===`);
    console.log('Error:', error?.message || 'None');
    console.log('Data:', data ? JSON.stringify(data).substring(0, 500) : 'null');
    console.log('');
  }

  // Check what tables exist via a different approach
  const { data: listing } = await supabase
    .from('listings')
    .select('categoryId')
    .limit(1)
    .single();
  
  console.log('\n=== Sample categoryId ===');
  console.log(listing);
}

checkCategories().catch(console.error);
