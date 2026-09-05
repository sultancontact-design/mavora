/**
 * Seed Admin User Script
 * سكربت إضافة مستخدم المدير العام
 * 
 * Usage: npx tsx scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

// Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Supabase credentials not found in environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Admin user data
const ADMIN_USER = {
  email: 'mavora@admin.com',
  password: 'admin123',
  name: 'مدير مافورا',
  nameEn: 'Mavora Admin',
  role: 'super_admin',
};

async function seedAdmin() {
  console.log('🚀 Starting admin user seeding...');
  console.log(`📧 Email: ${ADMIN_USER.email}`);
  console.log(`👤 Name: ${ADMIN_USER.name}`);
  console.log(`🔑 Role: ${ADMIN_USER.role}`);
  console.log('');

  try {
    // Step 1: Check if user already exists
    console.log('🔍 Checking if admin user exists...');
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', ADMIN_USER.email)
      .limit(1);

    if (checkError) {
      console.warn('⚠️ Warning checking existing user:', checkError.message);
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log(`✅ User already exists with ID: ${existingUser.id}`);
      console.log(`   Current role: ${existingUser.role}`);

      // Update password and role if needed
      const passwordHash = await hash(ADMIN_USER.password, 10);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          passwordHash: passwordHash,
          role: ADMIN_USER.role,
          isActive: true,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
      } else {
        console.log('✅ User updated successfully!');
        console.log(`   Password reset to: ${ADMIN_USER.password}`);
        console.log(`   Role updated to: ${ADMIN_USER.role}`);
      }

      // Update or create profile
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', existingUser.id)
        .limit(1);

      if (profiles && profiles.length > 0) {
        await supabaseAdmin
          .from('profiles')
          .update({
            display_name: ADMIN_USER.name,
            email: ADMIN_USER.email,
            isVerified: true,
            updatedAt: new Date().toISOString(),
          })
          .eq('userId', existingUser.id);
      } else {
        await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingUser.id,
            userId: existingUser.id,
            display_name: ADMIN_USER.name,
            email: ADMIN_USER.email,
            isVerified: true,
            isSuspended: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
      }

      console.log('\n✨ Admin user ready for login!');
      return;
    }

    // Step 2: Create new admin user
    console.log('📝 Creating new admin user...');
    const userId = randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hash(ADMIN_USER.password, 10);

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: ADMIN_USER.email.toLowerCase().trim(),
        name: ADMIN_USER.name,
        image: null,
        role: ADMIN_USER.role,
        emailVerified: true,
        isActive: true,
        passwordHash: passwordHash,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      })
      .select('*')
      .single();

    if (insertError || !newUser) {
      console.error('❌ Error creating user:', insertError?.message);
      
      // Try alternative column names
      console.log('🔄 Trying alternative schema...');
      const { error: altError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: ADMIN_USER.email.toLowerCase().trim(),
          name: ADMIN_USER.nameEn,
          role: ADMIN_USER.role,
          emailVerified: true,
          isActive: true,
          password_hash: passwordHash,
          created_at: now,
          updated_at: now,
        });

      if (altError) {
        console.error('❌ Alternative insert also failed:', altError.message);
        process.exit(1);
      }
    }

    console.log(`✅ User created with ID: ${userId}`);

    // Step 3: Create profile
    console.log('👤 Creating user profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        userId: userId,
        display_name: ADMIN_USER.name,
        email: ADMIN_USER.email,
        phone: null,
        bio: 'حساب المدير العام لمنصة مافورا',
        avatarUrl: null,
        isVerified: true,
        isSuspended: false,
        createdAt: now,
        updatedAt: now,
      });

    if (profileError) {
      console.warn('⚠️ Profile creation warning:', profileError.message);
      // Don't fail - profile might be created by trigger
    } else {
      console.log('✅ Profile created successfully');
    }

    // Step 4: Create user role entry if table exists
    console.log('🔐 Setting up user role...');
    try {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          userId: userId,
          role: ADMIN_USER.role,
          assignedAt: now,
          assignedBy: 'system',
        });

      if (roleError && !roleError.message.includes('relation') && !roleError.message.includes('does not exist')) {
        console.warn('⚠️ Role assignment warning:', roleError.message);
      } else if (!roleError) {
        console.log('✅ Role assigned successfully');
      }
    } catch (e) {
      // Ignore if table doesn't exist
    }

    // Success!
    console.log('\n' + '='.repeat(50));
    console.log('✨ ADMIN USER CREATED SUCCESSFULLY! ✨');
    console.log('='.repeat(50));
    console.log(`\n📧 Email:    ${ADMIN_USER.email}`);
    console.log(`🔑 Password: ${ADMIN_USER.password}`);
    console.log(`👤 Name:     ${ADMIN_USER.name}`);
    console.log(`🔑 Role:     ${ADMIN_USER.role}`);
    console.log(`\n🌐 Login URL: https://my-project-nu-nine-64.vercel.app/admin`);
    console.log('\n⚠️  Please change the password after first login!');
    console.log(''.repeat(50));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();
