import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkMedia() {
  // Try without count first
  const { data, error } = await supabase
    .from('listing_media')
    .select('*')
    .limit(3);
  
  console.log('=== Listing Media (no count) ===');
  console.log('Error:', error?.message);
  console.log('Data length:', data?.length);
  console.log('First item:', data?.[0] ? JSON.stringify(data[0]).substring(0, 300) : 'none');
  
  // Now try with count
  const { count } = await supabase
    .from('listing_media')
    .select('*', { count: 'exact', head: true });
  
  console.log('\nTotal media records:', count);
}

checkMedia().catch(console.error);
