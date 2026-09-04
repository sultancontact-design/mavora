/**
 * Script to create a new admin user in Supabase database
 * This bypasses the need for admin@mavora.ma or testuser@mavora.ma accounts
 */

const { createClient } = require('@supabase/supabase-js');
const { hash } = require('bcryptjs');

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// New admin credentials - simple and easy to remember
const NEW_ADMIN_EMAIL = 'mavora@admin.com';
const NEW_ADMIN_PASSWORD = 'admin123';
const NEW_ADMIN_NAME = 'مدير مافورة';

async function createAdminUser() {
  console.log('🚀 Creating new admin user...');
  console.log('📧 Email:', NEW_ADMIN_EMAIL);
  console.log('🔑 Password:', NEW_ADMIN_PASSWORD);
  
  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', NEW_ADMIN_EMAIL)
      .limit(1);
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('\n✅ User already exists. Updating role to super_admin...');
      
      // Update existing user to super_admin
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          role: 'super_admin',
          isActive: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingUsers[0].id);
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
        return;
      }
      
      // Update password
      const passwordHash = await hash(NEW_ADMIN_PASSWORD, 10);
      await supabaseAdmin
        .from('users')
        .update({ passwordHash })
        .eq('id', existingUsers[0].id);
      
      console.log('✅ User updated successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('   Email:', NEW_ADMIN_EMAIL);
      console.log('   Password:', NEW_ADMIN_PASSWORD);
      console.log('   Role: super_admin');
      return;
    }
    
    // Create new admin user
    const userId = require('crypto').randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hash(NEW_ADMIN_PASSWORD, 10);
    
    console.log('\n📝 Creating new admin user with ID:', userId);
    
    // Insert into users table
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: NEW_ADMIN_EMAIL.toLowerCase(),
        name: NEW_ADMIN_NAME,
        image: null,
        role: 'super_admin',  // Give full admin access
        emailVerified: true,   // Auto-verify
        isActive: true,
        passwordHash: passwordHash,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error('❌ Error creating user:', insertError.message);
      return;
    }
    
    console.log('✅ User created in users table');
    
    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        userId: userId,
        display_name: NEW_ADMIN_NAME,
        email: NEW_ADMIN_EMAIL.toLowerCase(),
        phone: null,
        bio: 'حساب مدير النظام',
        avatarUrl: null,
        isVerified: true,
        isSuspended: false,
        createdAt: now,
        updatedAt: now,
      });
    
    if (profileError) {
      console.warn('⚠️ Profile creation warning:', profileError.message);
    } else {
      console.log('✅ Profile created in profiles table');
    }
    
    console.log('\n========================================');
    console.log('🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\n📋 Login Credentials:');
    console.log('   📧 Email:    ', NEW_ADMIN_EMAIL);
    console.log('   🔑 Password: ', NEW_ADMIN_PASSWORD);
    console.log('   👤 Role:     super_admin');
    console.log('   ✅ Verified: Yes');
    console.log('\n🌐 You can now login at: /auth/login');
    console.log('🔧 Then access admin at: /admin');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

createAdminUser();
