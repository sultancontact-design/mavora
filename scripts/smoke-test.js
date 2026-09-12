// Post-Fix Smoke Test Script
// Run this AFTER setting Vercel env vars and fixing RLS

const https = require('https');

const BASE_URL = 'https://my-project-nu-nine-64.vercel.app';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (e) {
          // HTML response
          resolve({ status: res.statusCode, data: body.substring(0, 500), isHTML: true });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testEndpoint(name, path, expectJSON = true) {
  process.stdout.write(`Testing ${name}... `);
  
  try {
    const result = await makeRequest(path);
    
    if (result.status === 200) {
      if (expectJSON && !result.isHTML) {
        const keys = Object.keys(result.data || {});
        console.log(`✅ OK (${keys.length} keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''})`);
      } else if (result.isHTML) {
        const hasContent = result.data.includes('<html') || result.data.length > 100;
        console.log(`✅ OK (HTML, ${result.data.length} chars)`);
      } else {
        console.log(`✅ OK (status 200)`);
      }
      return { name, status: 'PASS', httpStatus: 200 };
    } else {
      console.log(`❌ FAILED (HTTP ${result.status})`);
      return { name, status: 'FAIL', httpStatus: result.status };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { name, status: 'ERROR', error: error.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('🧪 MAVORA POST-FIX SMOKE TEST');
  console.log('========================================');
  console.log(`\n📍 Target: ${BASE_URL}\n`);

  const tests = [
    { name: 'Homepage', path: '/', expectJSON: false },
    { name: 'Public Stats API', path: '/api/public/stats', expectJSON: true },
    { name: 'Listings API', path: '/api/listings?limit=3', expectJSON: true },
    { name: 'Categories API', path: '/api/categories', expectJSON: true },
    { name: 'Cities API', path: '/api/cities', expectJSON: true },
    { name: 'Listings Page', path: '/listings', expectJSON: false },
    { name: 'Auth Signup Page', path: '/auth/signup', expectJSON: false },
    { name: 'Admin Login Page', path: '/admin-login', expectJSON: false },
    { name: 'Health Check', path: '/api/health', expectJSON: true },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.path, test.expectJSON);
    results.push(result);
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;

  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\n⚠️ Failed tests:');
    results.filter(r => r.status !== 'PASS').forEach(r => {
      console.log(`   - ${r.name}: ${r.error || `HTTP ${r.httpStatus}`}`);
    });
  }

  if (passed === results.length) {
    console.log('\n🎉 ALL TESTS PASSED! The site is working correctly.');
  } else if (passed > results.length / 2) {
    console.log('\n🟡 Most tests passed. Some features may need attention.');
  } else {
    console.log('\n🔴 Many tests failed. Check environment variables and RLS policies.');
  }

  console.log('\n========================================');
  
  return results;
}

main().catch(console.error);
