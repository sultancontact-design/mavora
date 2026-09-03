/**
 * Practical Test Script - Step 1: Create Test User
 * This script attempts to create a real test user in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kyanecjjautqmuowbtvy.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTgzNjIsImV4cCI6MjEwMzg3NDM2Mn0.-placeholder';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

// Test user credentials
const TEST_USER = {
  email: 'testuser@mavora.ma',
  password: 'TestUser2024!Secure',
  display_name: 'مستخدم اختباري',
  phone: '+212600123456',
};

async function step1_createTestUser() {
  console.log('='.repeat(60));
  console.log('STEP 1: CREATE TEST USER');
  console.log('='.repeat(60));
  
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Test 1.1: Check if we can connect to Supabase
    console.log('\n[TEST 1.1] Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabaseAdmin.from('profiles').select('count').limit(1);
    
    if (healthError) {
      console.log(`⚠️  Connection test result: ${healthError.message}`);
      console.log('   This might mean tables don\'t exist yet - continuing with auth test...');
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Test 1.2: Try to create user via Admin API
    console.log('\n[TEST 1.2] Creating test user via Admin API...');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Name: ${TEST_USER.display_name}`);
    
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: {
        display_name: TEST_USER.display_name,
        phone: TEST_USER.phone,
      },
    });

    if (createError) {
      console.log(`❌ Create user error: ${createError.message}`);
      console.log(`   Error code: ${createError.status}`);
      
      // If user exists, try to get it
      if (createError.message.includes('already') || createError.status === 422) {
        console.log('\n[TEST 1.3] User might already exist, trying to list users...');
        const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
        const existingUser = users.users.find(u => u.email === TEST_USER.email);
        
        if (existingUser) {
          console.log(`✅ Found existing user:`);
          console.log(`   ID: ${existingUser.id}`);
          console.log(`   Email: ${existingUser.email}`);
          console.log(`   Created: ${existingUser.created_at}`);
          return { success: true, userId: existingUser.id, method: 'existing' };
        }
      }
      
      return { success: false, error: createError.message };
    }

    // Success!
    console.log('\n✅ USER CREATED SUCCESSFULLY!');
    console.log(`   User ID: ${userData.user.id}`);
    console.log(`   Email: ${userData.user.email}`);
    console.log(`   Confirmed: ${userData.user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Created at: ${userData.user.created_at}`);

    // Test 1.3: Try to create profile record
    console.log('\n[TEST 1.4] Attempting to create profile record...');
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userData.user.id,
      user_id: userData.user.id,
      display_name: TEST_USER.display_name,
      email: TEST_USER.email,
      phone: TEST_USER.phone,
      is_verified: true,
      is_suspended: false,
      role: 'user',
    });

    if (profileError) {
      console.log(`⚠️  Profile creation: ${profileError.message}`);
      console.log('   (This is OK if tables are not set up yet)');
    } else {
      console.log('✅ Profile created successfully');
    }

    return { 
      success: true, 
      userId: userData.user.id, 
      email: userData.user.email,
      method: 'created'
    };

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    return { success: false, error: String(error) };
  }
}

// Run the test
step1_createTestUser()
  .then((result) => {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1 RESULT:', result.success ? '✅ PASSED' : '❌ FAILED');
    console.log('='.repeat(60));
    
    // Output result as JSON for next steps
    console.log('\n📋 OUTPUT FOR NEXT STEPS:');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
