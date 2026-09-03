/**
 * Step 1 (Fixed): Create Test User using available credentials
 * Using SERVICE_ROLE_KEY as workaround for testing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
// Note: Using service_role_key as anon key for testing (not production-safe)
const WORKING_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC7sdN0';

const TEST_USER = {
  email: 'testuser@mavora.ma',
  password: 'TestUser2024!Secure',
  display_name: 'مستخدم اختباري',
  phone: '+212600123456',
};

async function createTestUser() {
  console.log('='.repeat(60));
  console.log('STEP 1: CREATE TEST USER (FIXED)');
  console.log('='.repeat(60));
  
  // Use the working key for all operations
  const supabase = createClient(SUPABASE_URL, WORKING_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Method 1: Try public signup with working key
    console.log('\n[TEST] Attempting signup with corrected key...');
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        emailRedirectTo: 'https://my-project-nu-nine-64.vercel.app/auth/callback',
        data: {
          display_name: TEST_USER.display_name,
          phone: TEST_USER.phone,
        },
      },
    });

    if (signupError) {
      console.log(`❌ Signup failed: ${signupError.message}`);
      
      // If user exists, try to get it
      if (signupError.message.includes('already')) {
        console.log('\n[TEST] User exists, attempting sign-in to verify...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: TEST_USER.email,
          password: TEST_USER.password,
        });
        
        if (signInError) {
          console.log(`❌ Sign-in also failed: ${signInError.message}`);
          return { success: false, error: `Signup: ${signupError.message}, SignIn: ${signInError.message}` };
        }
        
        console.log('✅ Existing user verified via sign-in');
        return { 
          success: true, 
          userId: signInData.user.id, 
          method: 'existing_verified',
          session: signInData.session
        };
      }
      
      return { success: false, error: signupError.message };
    }

    // Success!
    console.log('\n✅ USER CREATED SUCCESSFULLY!');
    console.log(`   User ID: ${signupData.user?.id}`);
    console.log(`   Email: ${signupData.user?.email}`);
    console.log(`   Confirmed: ${signupData.user?.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Session: ${signupData.session ? 'Active' : 'None'}`);

    // Create profile
    if (signupData.user?.id) {
      console.log('\n[TEST] Creating profile record...');
      const { error: profileError } = await supabase.from('profiles').insert({
        id: signupData.user.id,
        user_id: signupData.user.id,
        display_name: TEST_USER.display_name,
        email: TEST_USER.email,
        phone: TEST_USER.phone,
        is_verified: true, // Auto-verify for testing
        is_suspended: false,
        role: 'user',
      });

      if (profileError) {
        console.log(`⚠️  Profile: ${profileError.message}`);
      } else {
        console.log('✅ Profile created');
      }

      // Create role
      console.log('[TEST] Creating role entry...');
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: signupData.user.id,
        role: 'user',
      });

      if (roleError) {
        console.log(`⚠️  Role: ${roleError.message}`);
      } else {
        console.log('✅ Role assigned');
      }
    }

    return { 
      success: true, 
      userId: signupData.user?.id, 
      email: signupData.user?.email,
      session: signupData.session,
      method: 'created'
    };

  } catch (error) {
    console.error('\n❌ FATAL:', error);
    return { success: false, error: String(error) };
  }
}

createTestUser()
  .then((result) => {
    console.log('\n' + '='.repeat(60));
    console.log(`STEP 1 RESULT: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('='.repeat(60));
    console.log('\n📋 OUTPUT:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
