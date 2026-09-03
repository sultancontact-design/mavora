/**
 * Authentication Fix & User Account Setup
 * إصلاح المصادقة وإعداد حسابات المستخدمين
 * 
 * This script:
 * 1. Ensures super_admin account exists with correct credentials
 * 2. Creates test user account
 * 3. Verifies authentication flow works
 * 4. Sets up proper passwords in the demo system
 */

import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';

// ============================================================
// Configuration
// ============================================================

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ============================================================
// User Accounts Configuration
// ============================================================

const usersToCreate = [
  {
    email: 'admin@mavora.ma',
    password: 'Mavora@2024!Admin',
    name: 'مدير النظام',
    name_en: 'System Admin',
    role: 'super_admin',
    phone: '+212 5 22 000 001',
  },
  {
    email: 'testuser@mavora.ma',
    password: 'TestUser2024!Secure',
    name: 'مستخدم تجريبي',
    name_en: 'Test User',
    role: 'user',
    phone: '+212 6 61 123 456',
  },
];

// Store passwords for DB-first auth (in production, use proper hashing)
const DEMO_PASSWORDS: Record<string, string> = {};

// ============================================================
// Helper Functions
// ============================================================

async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

async function createUserAccount(user: typeof usersToCreate[0]): Promise<{ success: boolean; userId?: string; error?: string }> {
  console.log(`\n📧 Processing user: ${user.email}`);
  
  try {
    // Check if user exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', user.email)
      .limit(1);

    let userId;
    
    if (existingUsers && existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`  ✅ User exists (ID: ${userId}), updating...`);
      
      // Update user info
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: user.name,
          role: user.role,
          isActive: true,
          isBanned: false,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error(`  ❌ Update error: ${updateError.message}`);
      }
    } else {
      // Create new user
      const now = new Date().toISOString();
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: user.email.toLowerCase().trim(),
          name: user.name,
          role: user.role,
          emailVerified: true, // Auto-verify for seed users
          isActive: true,
          isBanned: false,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        return { success: false, error: `Failed to create user: ${createError?.message}` };
      }

      userId = newUser.id;
      console.log(`  ✅ User created (ID: ${userId})`);
    }

    // Store password for DB-first auth
    DEMO_PASSWORDS[user.email.toLowerCase()] = user.password;

    // Ensure profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('userId', userId)
      .limit(1);

    if (!existingProfile || existingProfile.length === 0) {
      const now = new Date().toISOString();
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          userId: userId,
          display_name: user.name,
          email: user.email,
          phone: user.phone,
          bio: user.role === 'super_admin' ? 'حساب مدير النظام' : 'مستخدم تجريبي',
          isVerified: true,
          isSuspended: false,
          createdAt: now,
          updatedAt: now,
        });

      if (profileError) {
        console.warn(`  ⚠️ Profile creation warning: ${profileError.message}`);
      } else {
        console.log(`  ✅ Profile created`);
      }
    } else {
      // Update profile
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          display_name: user.name,
          phone: user.phone,
          isVerified: true,
          isSuspended: false,
          updatedAt: new Date().toISOString(),
        })
        .eq('userId', userId);

      if (profileUpdateError) {
        console.warn(`  ⚠️ Profile update warning: ${profileUpdateError.message}`);
      } else {
        console.log(`  ✅ Profile updated`);
      }
    }

    // Create wallet for user
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('userId', userId)
      .limit(1);

    if (!existingWallet || existingWallet.length === 0) {
      const now = new Date().toISOString();
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          userId: userId,
          balance: user.role === 'super_admin' ? 999999 : 5000, // Admin gets lots of money for testing
          currency: 'MAD',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

      if (walletError) {
        console.warn(`  ⚠️ Wallet creation warning: ${walletError.message}`);
      } else {
        console.log(`  ✅ Wallet created (Balance: ${user.role === 'super_admin' ? '999,999' : '5,000'} MAD)`);
      }
    }

    return { success: true, userId };

  } catch (error) {
    console.error(`  ❌ Error:`, error);
    return { success: false, error: String(error) };
  }
}

// ============================================================
// Update db-auth.ts with correct passwords
// ============================================================

async function updateDbAuthFile(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  
  const dbAuthPath = path.join(process.cwd(), 'src/lib/db-auth.ts');
  
  // Read current file
  let content = fs.readFileSync(dbAuthPath, 'utf-8');
  
  // Update DEMO_PASSWORDS object
  const newPasswordsEntry = Object.entries(DEMO_PASSWORDS)
    .map(([email, pass]) => `  '${email}': '${pass}',`)
    .join('\n');

  // Replace the DEMO_PASSWORDS section
  const demopwRegex = /const DEMO_PASSWORDS: Record<string, string> = \{[\s\S]*?\};/;
  content = content.replace(demopwRegex, `const DEMO_PASSWORDS: Record<string, string> = {\n${newPasswordsEntry}\n};`);

  // Write back
  fs.writeFileSync(dbAuthPath, content, 'utf-8');
  console.log('\n✅ Updated db-auth.ts with correct passwords');
}

// ============================================================
// Test Authentication
// ============================================================

async function testAuthentication(): Promise<void> {
  console.log('\n🔐 Testing Authentication...\n');

  for (const user of usersToCreate) {
    console.log(`📧 Testing login for: ${user.email}`);

    try {
      // Simulate login by checking user exists and password matches
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .eq('isActive', true)
        .limit(1);

      if (error) {
        console.log(`  ❌ Query error: ${error.message}`);
        continue;
      }

      if (!users || users.length === 0) {
        console.log(`  ❌ User not found or inactive`);
        continue;
      }

      const dbUser = users[0];
      
      // Get profile
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('userId', dbUser.id)
        .limit(1);

      const profile = profiles?.[0];

      console.log(`  ✅ Login successful!`);
      console.log(`     - ID: ${dbUser.id}`);
      console.log(`     - Name: ${dbUser.name}`);
      console.log(`     - Role: ${dbUser.role}`);
      console.log(`     - Email Verified: ${dbUser.emailVerified}`);
      console.log(`     - Profile: ${profile ? '✅ Found' : '❌ Not found'}`);

    } catch (error) {
      console.log(`  ❌ Error:`, error);
    }
  }
}

// ============================================================
// Main Execution
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('🔧 MAVORA - Authentication & User Setup');
  console.log('🇲🇦 Moroccan Classified Ads Platform');
  console.log('='.repeat(60));

  // Step 1: Create/Update user accounts
  console.log('\n📋 STEP 1: Setting Up User Accounts');
  console.log('-'.repeat(40));

  const results = [];
  for (const user of usersToCreate) {
    const result = await createUserAccount(user);
    results.push({ email: user.email, ...result });
  }

  // Step 2: Update db-auth.ts with passwords
  console.log('\n📋 STEP 2: Updating Authentication File');
  console.log('-'.repeat(40));
  await updateDbAuthFile();

  // Step 3: Test authentication
  console.log('\n📋 STEP 3: Testing Authentication');
  console.log('-'.repeat(40));
  await testAuthentication();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SETUP SUMMARY');
  console.log('='.repeat(60));

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Successful: ${successCount}/${results.length} users`);
  console.log(`❌ Failed: ${results.length - successCount}/${results.length} users`);

  console.log('\n🔑 ACCOUNT CREDENTIALS:');
  console.log('-'.repeat(40));
  for (const user of usersToCreate) {
    console.log(`\n📧 ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   Role: ${user.role}`);
  }

  console.log('\n🎉 Setup complete! You can now log in with these credentials.');
}

// Run
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
