/**
 * Check actual column names in the listings table
 */

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GFdJgkCM6M193R_fwEdLRg_jU4cqoWc';

async function checkListingsColumns() {
  console.log('🔍 Checking actual column names in listings table...\n');
  
  // Try to get one row to see the column structure
  const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=*&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    if (data && data.length > 0) {
      console.log('✅ Found a listing row! Column names:');
      console.log('-'.repeat(50));
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`   - ${col}`));
      console.log('-'.repeat(50));
      console.log('\nSample data:');
      console.log(JSON.stringify(data[0], null, 2).substring(0, 1000));
    } else {
      console.log('⚠️  No listings found (table might be empty or RLS blocked)');
    }
  } else {
    const errorText = await response.text();
    console.log(`❌ Error: ${response.status}`);
    console.log(errorText);
    
    // If RLS blocks, try with service role or check error
    if (response.status === 403 || response.status === 406) {
      console.log('\n⚠️  RLS might be blocking. Trying to identify columns from error...');
    }
  }
}

// Test specific column names
async function testSpecificColumns() {
  console.log('\n\n🧪 Testing specific column name variations for "featured":\n');
  
  const columnsToTest = [
    'isFeatured',
    'is_featured', 
    'featured',
    'isfeatured',
    'Featured'
  ];
  
  for (const col of columnsToTest) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=id,${col}&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        console.log(`✅ "${col}" - EXISTS`);
      } else {
        const errorText = await response.text();
        // Extract just the error message
        let errorMsg = errorText;
        try {
          const errJson = JSON.parse(errorText);
          errorMsg = errJson.message || errorText;
        } catch {}
        console.log(`❌ "${col}" - ${errorMsg.substring(0, 60)}`);
      }
    } catch (e) {
      console.log(`❌ "${col}" - Error: ${e.message}`);
    }
  }
}

// Check all tables structure
async function checkTableStructure() {
  console.log('\n\n📊 Checking categories table structure for reference:\n');
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    if (data && data.length > 0) {
      console.log('Categories table columns:');
      Object.keys(data[0]).forEach(col => console.log(`   - ${col}`));
    }
  }
}

async function main() {
  await checkListingsColumns();
  await testSpecificColumns();
  await checkTableStructure();
  
  console.log('\n\n' + '='.repeat(60));
  console.log('NEXT STEPS');
  console.log('='.repeat(60));
  console.log('Once we know the correct column name, update:');
  console.log('  - src/app/api/listings/route.ts (line ~77 for featured filter)');
  console.log('  - Any other files that reference this column');
}

main().catch(console.error);
