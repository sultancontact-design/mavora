// Verify Supabase Database Schema and RLS Policies
const https = require('https');

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3cidHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTgzNjIsImV4cCI6MjEwMzg3NDM2Mn0.1A7BCO0f2BQp8QS8YiCKBfqkS-8v4cgCmTIxP5hHZEY';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
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

async function checkTable(tableName, description) {
  console.log(`\n📋 Checking ${description} (${tableName})...`);
  
  try {
    // Try to select from the table with limit 1
    const result = await makeRequest(`/rest/v1/${tableName}?limit=1&select=*`);
    
    if (result.status === 200) {
      const count = Array.isArray(result.data) ? result.data.length : 0;
      console.log(`   ✅ Table exists and is accessible (returned ${count} rows)`);
      
      // Get full count
      const countResult = await makeRequest(`/rest/v1/${tableName}?select=id`, {
        headers: { 'Prefer': 'count=exact', 'Range': '0-0' }
      });
      if (countResult.headers) {
        const totalCount = countResult.headers['content-range']?.split('/')[1] || 'unknown';
        console.log(`   📊 Total records: ${totalCount}`);
      }
      
      return { table: tableName, accessible: true, status: 'OK' };
    } else if (result.status === 401 || result.status === 403) {
      console.log(`   🔒 Table exists but access denied (RLS may block anonymous)`);
      return { table: tableName, accessible: false, status: 'BLOCKED_BY_RLS' };
    } else if (result.status === 404) {
      console.log(`   ❌ Table NOT FOUND (404)`);
      return { table: tableName, accessible: false, status: 'NOT_FOUND' };
    } else {
      console.log(`   ⚠️ Unexpected status: ${result.status}`);
      return { table: tableName, accessible: false, status: `ERROR_${result.status}` };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { table: tableName, accessible: false, status: 'ERROR' };
  }
}

async function checkRLSPolicies() {
  console.log('\n\n========================================');
  console.log('🔐 CHECKING RLS POLICIES');
  console.log('========================================');
  
  // Try to query pg_policies - this requires service role, so we test with anon
  const tablesToCheck = [
    { name: 'listings', desc: 'Listings/Ads' },
    { name: 'profiles', desc: 'User Profiles' },
    { name: 'categories', desc: 'Categories' },
    { name: 'messages', desc: 'Messages' },
    { name: 'transactions', desc: 'Transactions/Payments' },
    { name: 'conversations', desc: 'Conversations' },
    { name: 'favorites', desc: 'Favorites' },
    { name: 'reviews', desc: 'Reviews' },
    { name: 'notifications', desc: 'Notifications' },
    { name: 'cities', desc: 'Cities' }
  ];
  
  const results = [];
  
  for (const table of tablesToCheck) {
    const result = await checkTable(table.name, table.desc);
    results.push(result);
  }
  
  return results;
}

async function main() {
  console.log('========================================');
  console.log('🔍 Supabase Database Schema Verification');
  console.log('========================================');
  console.log(`\n📍 Project: ${SUPABASE_URL}`);
  console.log(`🔑 Using: ANON_KEY (public access level)\n`);

  const results = await checkRLSPolicies();

  console.log('\n\n========================================');
  console.log('📊 SUMMARY REPORT');
  console.log('========================================');
  
  let okCount = 0;
  let blockedCount = 0;
  let notFoundCount = 0;
  
  for (const r of results) {
    if (r.status === 'OK') okCount++;
    else if (r.status === 'BLOCKED_BY_RLS') blockedCount++;
    else notFoundCount++;
  }
  
  console.log(`\n✅ Accessible tables: ${okCount}`);
  console.log(`🔒 Blocked by RLS: ${blockedCount}`);
  console.log(`❌ Not found: ${notFoundCount}`);
  
  console.log('\n📝 RECOMMENDATIONS:');
  if (blockedCount > 0) {
    console.log('\n⚠️ Some tables are blocked by RLS for anonymous users.');
    console.log('To fix this, run in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql\n');
    
    console.log('-- Enable public SELECT on listings:');
    console.log("CREATE POLICY \"Allow public select\" ON listings FOR SELECT USING (true);");
    console.log('\n-- Enable public SELECT on categories:');
    console.log("CREATE POLICY \"Allow public select\" ON categories FOR SELECT USING (true);");
    console.log('\n-- Enable public SELECT on profiles:');
    console.log("CREATE POLICY \"Allow public select\" ON profiles FOR SELECT USING (true);");
    console.log('\n-- Enable public SELECT on cities:');
    console.log("CREATE POLICY \"Allow public select\" ON cities FOR SELECT USING (true);");
  }
  
  if (okCount === results.length) {
    console.log('\n✅ All critical tables are publicly accessible!');
    console.log('The site should work correctly once env vars are set in Vercel.');
  }

  // Return summary as JSON for programmatic use
  return results;
}

main().catch(console.error);
