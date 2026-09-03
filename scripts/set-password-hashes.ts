/**
 * Set Password Hashes for Existing Users
 * تعيين كلمات مرور مشفرة للمستخدمين الموجودين
 */

import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Users to set passwords for
const usersToUpdate = [
  { email: 'admin@mavora.ma', password: 'Mavora@2024!Admin' },
  { email: 'testuser@mavora.ma', password: 'TestUser2024!Secure' },
];

async function setPasswords() {
  console.log('🔐 Setting password hashes for existing users...\n');
  
  for (const user of usersToUpdate) {
    console.log(`📧 Processing: ${user.email}`);
    
    try {
      // Hash the password
      const passwordHash = await hash(user.password, 10);
      
      // Update user in database
      const { error } = await supabase
        .from('users')
        .update({ 
          passwordHash: passwordHash,
          updatedAt: new Date().toISOString(),
        })
        .eq('email', user.email);
      
      if (error) {
        console.error(`  ❌ Failed to update: ${error.message}`);
      } else {
        console.log(`  ✅ Password hash set successfully`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error:`, error);
    }
  }
  
  console.log('\n✅ Done! Users can now login with their passwords.');
}

setPasswords()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
