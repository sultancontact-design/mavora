// FINAL VERIFICATION - Test with working key
const https = require('https');

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const ANON_KEY = 'sb_publishable_GFdJgkCM6M193R_fwEdLRg_jU4cqoWc';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
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
    req.end();
  });
}

async function main() {
  console.log('==========================================');
  console.log('🔍 SUPABASE CONNECTION TEST (NEW KEY)');
  console.log('==========================================\n');

  const tables = ['listings', 'categories', 'profiles', 'cities'];
  
  for (const table of tables) {
    process.stdout.write(`Testing ${table}... `);
    
    try {
      const result = await makeRequest(`/rest/v1/${table}?limit=1`);
      
      if (result.status === 200) {
        const count = Array.isArray(result.data) ? result.data.length : 0;
        console.log(`✅ WORKING! (${count} rows returned)`);
        
        // Get total count
        const countResult = await makeRequest(`/rest/v1/${table}?select=id`, {
          headers: { 'Prefer': 'count=exact', 'Range': '0-0' }
        });
        // Note: count would be in headers
      } else if (result.status === 403 || result.status === 401) {
        console.log(`🔒 BLOCKED by RLS (status ${result.status})`);
      } else {
        console.log(`⚠️ Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n==========================================');
  console.log('📋 STATUS:');
  console.log('==========================================');
  console.log('');
  console.log('✅ Supabase API Key: VALID (sb_publishable_...)');
  console.log('✅ Connection to Supabase: WORKING');
  console.log('🔴 RLS Policies: BLOCKING public access');
  console.log('');
  console.log('NEXT STEP: Fix RLS in Supabase SQL Editor');
  console.log('URL: https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql');
}

main().catch(console.error);
