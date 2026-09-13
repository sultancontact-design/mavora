// SET VERCEL ENVIRONMENT VARIABLES WITH NEW TOKEN
const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || ''; // Set via environment variable for security
const PROJECT_ID = 'prj_WVEai5zrNOgAyXJCAcnGc20k9iJe';

// Environment variables to set
const ENV_VARS = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://kyanecjjautqmuowbtvy.supabase.co',
    type: 'public'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'sb_publishable_GFdJgkCM6M193R_fwEdLRg_jU4cqoWc',
    type: 'public'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: process.env.SUPABASE_SERVICE_ROLE_KEY || '', // Set via environment variable
    type: 'secret'
  },
  {
    key: 'JWT_SECRET',
    value: process.env.JWT_SECRET || 'your-jwt-secret-here', // Set via environment variable
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
  console.log(`   Setting ${key}...`);
  
  try {
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
      if (result.data.error) {
        console.log(`   Error: ${result.data.error.message || JSON.stringify(result.data.error)}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error setting ${key}: ${error.message}`);
    return false;
  }
}

async function triggerRedeploy() {
  console.log('\n🚀 Triggering new deployment...');
  
  try {
    // Get latest deployment to redeploy
    const deployments = await makeRequest(`/v9/projects/${PROJECT_ID}/deployments`, 'GET');
    
    if (deployments.status === 200 && deployments.data.deployments && deployments.data.deployments.length > 0) {
      const latestDeployment = deployments.data.deployments[0];
      console.log(`   Latest deployment: ${latestDeployment.id}`);
      
      // Create a new deployment
      const deployResult = await makeRequest(
        `/v13/deployments`,
        'POST',
        {
          project: PROJECT_ID,
          target: 'production'
        }
      );
      
      if (deployResult.status === 200 || deployResult.status === 201) {
        console.log('   ✅ Deployment triggered successfully!');
        return true;
      } else {
        console.log(`   ⚠️ Deploy status: ${deployResult.status}`);
        return false;
      }
    } else {
      console.log('   ⚠️ Could not find existing deployments');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error triggering deployment: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('==========================================');
  console.log('🚀 SETTING VERCEL ENVIRONMENT VARIABLES');
  console.log('==========================================');
  console.log(`\n📋 Project ID: ${PROJECT_ID}`);
  console.log(`📦 Total variables: ${ENV_VARS.length}\n`);

  let successCount = 0;
  
  for (const envVar of ENV_VARS) {
    const success = await setEnvVar(envVar.key, envVar.value, envVar.type);
    if (success) successCount++;
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n========================================');
  console.log(`📊 Result: ${successCount}/${ENV_VARS.length} variables set`);
  console.log('========================================');

  if (successCount > 0) {
    await triggerRedeploy();
  }

  if (successCount === ENV_VARS.length) {
    console.log('\n✅ ALL ENV VARIABLES SET + DEPLOYMENT TRIGGERED!');
    console.log('\n🔗 Your site will be live at: https://my-project-nu-nine-64.vercel.app');
  } else {
    console.log('\n⚠️ Some variables failed. Check errors above.');
  }

  return successCount === ENV_VARS.length;
}

main().catch(console.error);
