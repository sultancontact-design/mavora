// EXECUTE RLS FIX VIA SUPABASE REST API - USING SERVICE ROLE
const https = require('https');

// Service Role Key has admin privileges - can bypass RLS
const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3cidHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

// SQL statements to execute
const RLS_FIXES = [
  // 1. Listings - Public SELECT for active listings
  {
    name: 'listings_public_select',
    sql: `DROP POLICY IF EXISTS "public_read_listings" ON listings; CREATE POLICY "public_read_listings" ON listings FOR SELECT TO anon USING (status = 'active');`
  },
  // 2. Categories - Full public SELECT  
  {
    name: 'categories_public_select',
    sql: `DROP POLICY IF EXISTS "public_read_categories" ON categories; CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon USING (true);`
  },
  // 3. Profiles - Public SELECT
  {
    name: 'profiles_public_select', 
    sql: `DROP POLICY IF EXISTS "public_read_profiles" ON profiles; CREATE POLICY "public_read_profiles" ON profiles FOR SELECT TO anon USING (true);`
  },
  // 4. Cities - Public SELECT
  {
    name: 'cities_public_select',
    sql: `DROP POLICY IF EXISTS "public_read_cities" ON cities; CREATE POLICY "public_read_cities" ON cities FOR SELECT TO anon USING (true);`
  },
  // 5. Reviews - Public SELECT
  {
    name: 'reviews_public_select',
    sql: `DROP POLICY IF EXISTS "public_read_reviews" ON reviews; CREATE POLICY "public_read_reviews" ON reviews FOR SELECT TO anon USING (true);`
  }
];

async function executeSQL(sql, description) {
  console.log(`\n🔧 Executing: ${description}...`);
  
  try {
    // Try RPC endpoint first (may not work)
    // Then try direct SQL execution endpoint
    const result = await makeRequest('/rest/v1/rpc/exec_sql', {
      method: 'POST',
      body: { sql_query: sql }
    });
    
    console.log(`   Status: ${result.status}`);
    if (result.status === 200 || result.status === 201) {
      console.log(`   ✅ SUCCESS`);
      return true;
    } else if (result.status === 404) {
      console.log(`   ⚠️ RPC not found, trying alternative...`);
      return false;
    } else {
      console.log(`   Response: ${JSON.stringify(result.data).substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testPublicAccess() {
  console.log('\n\n📊 TESTING PUBLIC ACCESS AFTER RLS FIX...\n');
  
  const tables = ['listings', 'categories', 'profiles', 'cities'];
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3cidHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTgzNjIsImV4cCI6MjEwMzg3NDM2Mn0.1A7BCO0f2BQp8QS8YiCKBfqkS-8v4cgCmTIxP5hHZEY';
  
  for (const table of tables) {
    process.stdout.write(`   Testing ${table}... `);
    
    try {
      const res = await new Promise((resolve, reject) => {
        const url = new URL(`/rest/v1/${table}?limit=1`, SUPABASE_URL);
        https.get({
          hostname: url.hostname,
          path: url.pathname + url.search,
          headers: { 
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
          }
        }, (res) => {
          let body = '';
          res.on('data', c => body += c);
          res.on('end', () => resolve({ status: res.statusCode, body }));
        }).on('error', reject);
      });
      
      if (res.status === 200) {
        console.log('✅ PUBLIC ACCESS WORKING!');
      } else if (res.status === 403 || res.status === 401) {
        console.log(`🔒 Still blocked (${res.status})`);
      } else {
        console.log(`⚠️ Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}

async function main() {
  console.log('==========================================');
  console.log('🚀 EXECUTING RLS FIXES VIA SUPABASE API');
  console.log('==========================================');
  console.log(`\n📍 Project: ${SUPABASE_URL}`);
  console.log(`🔑 Using: SERVICE_ROLE_KEY (admin privileges)\n`);

  // Try to execute SQL via Supabase Management API
  console.log('Attempting to apply RLS policies...\n');

  // Method 1: Try REST API
  for (const fix of RLS_FIXES) {
    await executeSQL(fix.sql, fix.name);
  }

  // Test public access
  await testPublicAccess();

  console.log('\n\n==========================================');
  console.log('📋 NEXT STEPS IF AUTOMATIC FIX FAILED:');
  console.log('==========================================');
  console.log(`
If the automatic fix didn't work, manually run this SQL:

URL: https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql

SQL:
-----
-- Enable RLS on tables (if not already enabled)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create public read policies
CREATE POLICY "public_read_listings" ON listings FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_cities" ON cities FOR SELECT TO anon USING (true);

-- Verify
SELECT * FROM listings LIMIT 1;
SELECT * FROM categories LIMIT 1;
`);
}

main().catch(console.error);
