/**
 * Test script to verify API fixes
 * Tests that the column names are correct (DB uses camelCase) and data can be fetched
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kyanecjjautqmuowbtvy.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_GFdJgkCM6M193R_fwEdLRg_jU4cqoWc';

console.log('=== Mavora API Fix Verification ===\n');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Anon Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('');
console.log('⚠️  IMPORTANT: This database uses CAMELCASE columns (not snake_case)');
console.log('');

async function testCategoriesAPI() {
  console.log('📁 Testing CATEGORIES API (with camelCase columns)...');
  console.log('-'.repeat(50));
  
  try {
    // DB uses camelCase: isActive, sortOrder, parentId
    const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?isActive=eq.true&select=*&order=sortOrder.asc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Categories API SUCCESS: Found ${data.length} categories`);
      if (data.length > 0) {
        console.log('   Sample category:', {
          id: data[0].id,
          name: data[0].name || data[0].nameAr,
          isActive: data[0].isActive,
          sortOrder: data[0].sortOrder
        });
      }
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Categories API FAILED: ${response.status}`);
      console.log('   Error:', errorText.substring(0, 200));
      
      // Check if it's an RLS error
      if (errorText.includes('permission') || errorText.includes('policy') || errorText.includes('row level security')) {
        console.log('\n⚠️  RLS POLICY ISSUE DETECTED!');
        console.log('   The columns are correct but RLS is blocking access.');
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Categories API ERROR:`, error.message);
    return false;
  }
}

async function testListingsAPI() {
  console.log('\n📦 Testing LISTINGS API (with camelCase columns)...');
  console.log('-'.repeat(50));
  
  try {
    // DB uses camelCase: categoryId, createdAt, viewCount, isFeatured
    const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?status=eq.active&select=id,title,price,categoryId,createdAt,viewCount,isFeatured&limit=5&order=createdAt.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Listings API SUCCESS: Found ${data.length} listings`);
      if (data.length > 0) {
        console.log('   Sample listing:', {
          id: data[0].id,
          title: data[0].title?.substring(0, 40),
          price: data[0].price,
          status: 'active'
        });
      }
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Listings API FAILED: ${response.status}`);
      console.log('   Error:', errorText.substring(0, 200));
      
      // Check if it's an RLS error
      if (errorText.includes('permission') || errorText.includes('policy') || errorText.includes('row level security')) {
        console.log('\n⚠️  RLS POLICY ISSUE DETECTED!');
        console.log('   The columns are correct but RLS is blocking access.');
        console.log('   You need to run the RLS fix SQL in Supabase Dashboard:');
        console.log('   https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql');
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Listings API ERROR:`, error.message);
    return false;
  }
}

async function testWithSnakeCase() {
  console.log('\n🔍 Testing with WRONG snake_case columns (should fail)...');
  console.log('-'.repeat(50));
  
  try {
    // This should fail because DB uses camelCase, not snake_case
    const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?is_active=eq.active&select=id,title,category_id,created_at&view_count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      console.log(`✅ Expected FAILURE with snake_case: ${response.status}`);
      console.log('   This confirms DB uses CAMELCASE columns');
      return true;
    } else {
      console.log('⚠️  Unexpected success with snake_case columns');
      return false;
    }
  } catch (error) {
    console.log(`Error testing snake_case:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Testing Supabase API with correct camelCase column names...\n');
  
  const categoriesOK = await testCategoriesAPI();
  const listingsOK = await testListingsAPI();
  const snakeCaseTest = await testWithSnakeCase();
  
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Categories API:     ${categoriesOK ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Listings API:       ${listingsOK ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`snake_case test:    ${snakeCaseTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!categoriesOK || !listingsOK) {
    console.log('\n⚠️  TROUBLESHOOTING:');
    console.log('   1. If you see "RLS" or "permission" errors → Run RLS fix SQL');
    console.log('   2. If you see "column does not exist" → Column name mismatch');
    console.log('   3. Check your ANON_KEY is correct (should start with eyJhbGci...)');
    console.log('\n   SQL Editor: https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql');
    console.log('\n   Quick RLS Fix:');
    console.log('   ALTER TABLE listings ENABLE ROW LEVEL SECURITY;');
    console.log('   CREATE POLICY "public_read_active_listings" ON listings');
    console.log('     FOR SELECT TO anon USING (status = \'active\');');
    console.log('   CREATE POLICY "public_read_categories" ON categories');
    console.log('     FOR SELECT TO anon USING (true);');
  }
}

main().catch(console.error);
