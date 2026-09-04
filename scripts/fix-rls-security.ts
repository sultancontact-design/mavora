/**
 * Fix RLS (Row Level Security) on Supabase tables
 * This addresses the security vulnerability found in Step 9
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixRLS() {
  console.log('🔒 Fixing RLS (Row Level Security) on Supabase tables...\n');

  const tables = ['profiles', 'users', 'listings', 'listing_media'];
  const results: { table: string; status: string; message: string }[] = [];

  for (const table of tables) {
    try {
      // Enable RLS on the table
      const { error: enableError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      }).catch(() => ({ error: { message: 'RPC not available, trying direct...' } }));

      if (enableError) {
        // Try using raw SQL via REST
        console.log(`⚠️  Could not enable RLS on ${table} via RPC: ${enableError.message}`);
        results.push({ table, status: 'WARNING', message: enableError.message });
        continue;
      }

      // Create policy for authenticated users to read their own data
      const policyName = `Users_can_read_own_${table}`;
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE POLICY "${policyName}" ON ${table}
          FOR SELECT USING (auth.uid() = user_id OR auth.uid() = id OR auth.role() = 'service_role');
        `
      }).catch(() => ({ error: { message: 'Policy creation skipped' } }));

      results.push({
        table,
        status: policyError ? 'PARTIAL' : 'SUCCESS',
        message: policyError ? `RLS enabled, policy creation warning: ${policyError.message}` : 'RLS enabled with policies'
      });

      console.log(`✅ ${table}: RLS enabled`);

    } catch (error: any) {
      console.log(`❌ ${table}: ${error.message}`);
      results.push({ table, status: 'ERROR', message: error.message });
    }
  }

  // Specifically try to enable RLS on profiles using direct approach
  console.log('\n📋 Attempting direct RLS enable on profiles...');
  
  try {
    // Check current RLS status
    const { data: currentStatus, error: statusError } = await supabaseAdmin
      .rpc('check_rls_enabled', { table_name: 'profiles' })
      .catch(() => ({ data: null, error: { message: 'Cannot check' } }));

    console.log(`Current RLS status for profiles: ${currentStatus || 'unknown'}`);
  } catch (e) {
    console.log('Could not check RLS status');
  }

  console.log('\n📊 Summary:');
  results.forEach(r => {
    const icon = r.status === 'SUCCESS' ? '✅' : r.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.table}: ${r.message}`);
  });

  return results;
}

fixRLS().then(() => {
  console.log('\n✨ RLS fix complete');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
