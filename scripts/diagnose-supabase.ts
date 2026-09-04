/**
 * Deep Diagnostics - Why is user creation failing?
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTgzNjIsImV4cCI6MjEwMzg3NDM2Mn0.';

async function diagnose() {
  console.log('🔍 DEEP DIAGNOSTICS\n');
  
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Test 1: Check if auth schema exists
  console.log('[DIAG 1] Checking auth.users table access...');
  try {
    const { data, error } = await supabaseAdmin.rpc('get_schema_version');
    console.log('   Schema version:', data, error ? error.message : 'OK');
  } catch (e) {
    console.log('   ⚠️  Cannot check schema version');
  }

  // Test 2: Try listing existing users
  console.log('\n[DIAG 2] Listing existing users...');
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 5 });
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Found ${users.users.length} users`);
      if (users.users.length > 0) {
        users.users.forEach(u => console.log(`   - ${u.email} (${u.id})`));
      }
    }
  } catch (e) {
    console.log('   ❌ Exception:', e);
  }

  // Test 3: Try public signup (not admin)
  console.log('\n[DIAG 3] Testing public signup (anon)...');
  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@mavora.ma`;
  
  const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
    options: {
      data: { display_name: 'Test User' }
    }
  });
  
  if (signupError) {
    console.log(`   ❌ Signup error: ${signupError.message}`);
    console.log(`   Status: ${signupError.status}`);
  } else {
    console.log('   ✅ Public signup works!');
    console.log(`   User ID: ${signupData.user?.id}`);
    console.log(`   Email: ${signupData.user?.email}`);
    
    // Clean up - delete the test user we just created
    if (signupData.user?.id) {
      console.log('\n[CLEANUP] Deleting test user...');
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(signupData.user.id);
      if (deleteError) {
        console.log(`   ⚠️  Could not delete: ${deleteError.message}`);
      } else {
        console.log('   ✅ Test user deleted');
      }
    }
  }

  // Test 4: Check if profiles table exists and is accessible
  console.log('\n[DIAG 4] Checking profiles table...');
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('count', { count: 'exact', head: true });
  
  if (profilesError) {
    console.log(`   ❌ Profiles table error: ${profilesError.message}`);
    console.log(`   Code: ${profilesError.code}`);
    
    if (profilesError.code === '42P01') {
      console.log('   🔴 ROOT CAUSE: Table "profiles" does not exist!');
      console.log('   → Need to run migration SQL first');
    }
  } else {
    console.log(`   ✅ Profiles table exists (${profiles} records)`);
  }

  // Test 5: Check user_roles table
  console.log('\n[DIAG 5] Checking user_roles table...');
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('user_roles')
    .select('count', { count: 'exact', head: true });
  
  if (rolesError) {
    console.log(`   ❌ User roles table error: ${rolesError.message}`);
    if (rolesError.code === '42P01') {
      console.log('   🔴 Table "user_roles" does not exist!');
    }
  } else {
    console.log(`   ✅ User roles table exists (${roles} records)`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSIS COMPLETE');
  console.log('='.repeat(60));
}

diagnose().catch(console.error);
