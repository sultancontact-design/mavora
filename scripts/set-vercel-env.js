// Set Environment Variables in Vercel via API
const https = require('https');

const VERCEL_TOKEN = 'vcn_5h7MJVNceWigVcgu3Rf2mbpuN9pnKSP2xLU6DVnh6yv6fbg6XB3ElhMg';
const PROJECT_ID = 'prj_WVEai5zrNOgAyXJCAcnGc20k9iJe';

// Environment variables to set
const ENV_VARS = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://kyanecjjautqmuowbtvy.supabase.co',
    type: 'public'  // NEXT_PUBLIC_ vars must be public
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3cidHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTgzNjIsImV4cCI6MjEwMzg3NDM2Mn0.1A7BCO0f2BQp8QS8YiCKBfqkS-8v4cgCmTIxP5hHZEY',
    type: 'public'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3cidHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0',
    type: 'secret'
  },
  {
    key: 'JWT_SECRET',
    value: 'mavora-super-secret-jwt-key-2024-production-minimum-32-chars!',
    type: 'secret'
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    value: 'https://my-project-nu-nine-64.vercel.app',
    type: 'public'
  }
];

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': postData ? Buffer.byteLength(postData) : 0
      }
    };

    const req = https.request(options, (res) => {
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
    if (postData) req.write(postData);
    req.end();
  });
}

async function setEnvVar(key, value, type) {
  console.log(`\n📝 Setting ${key}...`);
  
  try {
    // Create or update environment variable
    const result = await makeRequest(
      `/v9/projects/${PROJECT_ID}/env`,
      'POST',
      { key, value, target: ['production', 'preview', 'development'], type }
    );
    
    if (result.status === 200 || result.status === 201) {
      console.log(`   ✅ ${key} set successfully`);
      return true;
    } else {
      console.log(`   ⚠️ ${key}: Status ${result.status}`);
      console.log(`   Response:`, JSON.stringify(result.data).substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error setting ${key}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('🚀 Setting Mavora Environment Variables');
  console.log('========================================');
  console.log(`\n📋 Project ID: ${PROJECT_ID}`);
  console.log(`📦 Total variables to set: ${ENV_VARS.length}\n`);

  let successCount = 0;
  
  for (const envVar of ENV_VARS) {
    const success = await setEnvVar(envVar.key, envVar.value, envVar.type);
    if (success) successCount++;
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n========================================');
  console.log(`📊 Result: ${successCount}/${ENV_VARS.length} variables set successfully`);
  console.log('========================================');

  if (successCount === ENV_VARS.length) {
    console.log('\n✅ All environment variables are now set!');
    console.log('\n🔄 Next Step: Trigger a new deployment with:');
    console.log('   vercel --prod --force');
    console.log('\n   Or visit Vercel Dashboard to redeploy');
  } else {
    console.log('\n⚠️ Some variables failed. Check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);
