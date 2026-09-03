/**
 * Script to create Super Admin account for MAVORA
 * Run: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Supabase Configuration
const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

// Admin Account Credentials
const ADMIN_EMAIL = 'admin@mavora.ma';
const ADMIN_PASSWORD = 'Mavora@2024!Admin';
const ADMIN_DISPLAY_NAME = 'مدير MAVORA';

// Create Supabase Admin Client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSuperAdmin() {
  console.log('🚀 Starting Super Admin creation...\n');

  try {
    // Step 1: Check if admin already exists
    console.log('📋 Checking if admin account already exists...');
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const adminExists = existingUser.users.find(u => u.email === ADMIN_EMAIL);
    
    if (adminExists) {
      console.log(`⚠️  Admin account already exists with ID: ${adminExists.id}`);
      console.log('   Updating password and role...');
      
      // Update existing user's password
      await supabase.auth.admin.updateUserById(adminExists.id, {
        password: ADMIN_PASSWORD,
        user_metadata: { 
          display_name: ADMIN_DISPLAY_NAME,
          role: 'super_admin'
        }
      });
      
      // Update or create profile
      await supabase.from('profiles').upsert({
        id: adminExists.id,
        display_name: ADMIN_DISPLAY_NAME,
        email: ADMIN_EMAIL,
        is_verified: true,
        is_suspended: false,
        role: 'super_admin',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      
      // Ensure admin role in user_roles
      await supabase.from('user_roles').upsert({
        user_id: adminExists.id,
        role: 'super_admin',
      }, { onConflict: 'user_id' });
      
      console.log('✅ Admin account updated successfully!\n');
      printCredentials(adminExists.id);
      return;
    }

    // Step 2: Create the admin user using Admin API
    console.log('👤 Creating admin user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: ADMIN_DISPLAY_NAME,
        role: 'super_admin',
      },
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      throw createError;
    }

    console.log(`✅ User created with ID: ${newUser.user.id}`);

    // Step 3: Create/Update profile with admin role
    console.log('📝 Setting up admin profile...');
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: newUser.user.id,
      display_name: ADMIN_DISPLAY_NAME,
      email: ADMIN_EMAIL,
      phone: '+212600000000',
      avatar_url: null,
      bio: 'حساب مدير النظام - صلاحيات كاملة',
      country_id: null,
      city_id: null,
      is_verified: true,
      is_suspended: false,
      role: 'super_admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (profileError) {
      console.warn('⚠️  Profile upsert warning:', profileError.message);
      // Don't fail - continue with role assignment
    }

    // Step 4: Assign super_admin role in user_roles table
    console.log('🔐 Assigning super_admin role...');
    const { error: roleError } = await supabase.from('user_roles').upsert({
      user_id: newUser.user.id,
      role: 'super_admin',
      granted_by: newUser.user.id, // Self-granted for initial setup
      granted_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (roleError) {
      console.warn('⚠️  Role assignment warning:', roleError.message);
      // Continue anyway - profile might have role field
    }

    // Step 5: Verify the setup
    console.log('\n🔍 Verifying admin account...');
    const { data: verifyProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single();

    const { data: verifyRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', newUser.user.id)
      .single();

    console.log('\n' + '='.repeat(50));
    console.log('✅ SUPER ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('='.repeat(50));
    printCredentials(newUser.user.id);
    
    console.log('\n📊 Verification:');
    console.log(`   Profile exists: ${!!verifyProfile ? '✅ Yes' : '❌ No'}`);
    console.log(`   Profile role: ${verifyProfile?.role || 'N/A'}`);
    console.log(`   Role entry exists: ${!!verifyRole ? '✅ Yes' : '❌ No'}`);
    console.log(`   Role in table: ${verifyRole?.role || 'N/A'}`);

  } catch (error) {
    console.error('\n❌ Fatal error creating admin:', error);
    process.exit(1);
  }
}

function printCredentials(userId: string) {
  console.log('\n🔑 ADMIN CREDENTIALS:');
  console.log('-'.repeat(30));
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   User ID:  ${userId}`);
  console.log(`   Role:     super_admin`);
  console.log('-'.repeat(30));
  console.log('\n⚠️  Please change this password after first login!');
  console.log('🌐 Login URL: https://my-project-nu-nine-64.vercel.app/auth/login');
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log('\n🎉 Setup complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
