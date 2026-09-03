/**
 * Direct Super Admin Creation Script
 * Uses Supabase Auth Admin API directly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  console.log('🚀 Creating Super Admin account...\n');

  try {
    // Step 1: Create the user in Supabase Auth
    console.log('📧 Creating user in Supabase Auth...');
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@mavora.ma',
      password: 'Mavora@2024!Admin',
      email_confirm: true,
      user_metadata: {
        display_name: 'مدير MAVORA',
        role: 'super_admin',
      },
    });

    if (userError) {
      // If user exists, try to get existing user
      if (userError.message.includes('already')) {
        console.log('⚠️  User already exists, fetching existing...');
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === 'admin@mavora.ma');
        
        if (existingUser) {
          console.log(`✅ Found existing user: ${existingUser.id}`);
          await showResults(existingUser.id);
          return;
        }
      }
      throw userError;
    }

    const userId = userData.user.id;
    console.log(`✅ User created successfully! ID: ${userId}`);

    // Step 2: Try to create profile (may fail if table doesn't exist)
    console.log('📝 Attempting to create profile...');
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        user_id: userId,
        display_name: 'مدير MAVORA',
        email: 'admin@mavora.ma',
        is_verified: true,
        is_suspended: false,
        role: 'super_admin',
      });

    if (profileError) {
      console.warn(`⚠️  Profile creation warning: ${profileError.message}`);
      console.warn('   This is OK if tables are not set up yet.');
      console.warn('   The admin account will still work for authentication.');
    } else {
      console.log('✅ Profile created successfully!');
    }

    // Step 3: Try to create role entry
    console.log('🔐 Attempting to assign admin role...');
    
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'super_admin',
      });

    if (roleError) {
      console.warn(`⚠️  Role assignment warning: ${roleError.message}`);
    } else {
      console.log('✅ Role assigned successfully!');
    }

    await showResults(userId);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function showResults(userId: string) {
  console.log('\n' + '='.repeat(60));
  console.log('✅ SUPER ADMIN ACCOUNT READY!');
  console.log('='.repeat(60));
  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('-'.repeat(40));
  console.log(`   📧 Email:    admin@mavora.ma`);
  console.log(`   🔑 Password: Mavora@2024!Admin`);
  console.log(`   🆔 User ID:  ${userId}`);
  console.log(`   👤 Role:     super_admin`);
  console.log('-'.repeat(40));
  console.log('\n🌐 Login URL: https://my-project-nu-nine-64.vercel.app/auth/login');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   • Change this password after first login');
  console.log('   • Keep these credentials secure');
  console.log('   • Dashboard: /admin (after login)');
}

createAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
