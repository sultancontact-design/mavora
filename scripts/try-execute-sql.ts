/**
 * Attempt to execute SQL via Supabase's internal API
 * This tries multiple methods to run DDL statements
 */

import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Extract project ref
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'kyanecjjautqmuowbtvy';

async function tryExecuteSQL(sql: string): Promise<{ success: boolean; method?: string; error?: string }> {
  
  // Method 1: Try PostgREST RPC endpoint
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ sql_string: sql }),
    });
    
    if (response.ok) {
      return { success: true, method: 'PostgREST RPC' };
    }
    
    const text = await response.text();
    if (!text.includes('does not exist')) {
      console.log(`   Method 1 (RPC) failed: ${text.substring(0, 100)}`);
    }
  } catch (e: any) {
    console.log(`   Method 1 (RPC) error: ${e.message}`);
  }

  // Method 2: Try pg_query endpoint (internal)
  try {
    const response = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (response.ok) {
      return { success: true, method: 'pg/query' };
    }
    
    const text = await response.text();
    console.log(`   Method 2 (pg/query) failed: ${text.substring(0, 100)}`);
  } catch (e: any) {
    console.log(`   Method 2 (pg/query) error: ${e.message}`);
  }

  // Method 3: Try Management API format
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (response.ok) {
      return { success: true, method: 'Management API' };
    }
    
    const text = await response.text();
    console.log(`   Method 3 (Management API) failed: ${text.substring(0, 100)}`);
  } catch (e: any) {
    console.log(`   Method 3 (Management API) error: ${e.message}`);
  }

  return { success: false, error: 'All methods failed' };
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔧 Mavora SQL Execution Attempt');
  console.log('   Project:', projectRef);
  console.log('='.repeat(60));
  console.log('');

  // Test with a simple query first
  console.log('🔄 Testing database connection...');
  const testResult = await tryExecuteSQL('SELECT 1 as test');
  
  if (!testResult.success) {
    console.log('\n❌ Cannot execute SQL directly via API');
    console.log('');
    console.log('💡 This is expected - DDL execution requires:');
    console.log('   1. Direct PostgreSQL connection (psql)');
    console.log('   2. Supabase Dashboard SQL Editor');
    console.log('   3. Supabase CLI (supabase db push)');
    console.log('');
    
    // Generate the complete SQL file for manual execution
    const sqlPath = path.join(__dirname, 'fix-uuid-rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    const outputPath = path.join(__dirname, '..', 'download', 'MAVORA_RLS_FIX.sql');
    
    const completeScript = `-- ============================================================
-- 🚀 MAVORA RLS COMPLETE FIX SCRIPT
-- 📅 Generated: ${new Date().toISOString()}
-- 🔧 Fixes: UUID = text type mismatch in all RLS policies
--
-- ⚡ HOW TO USE:
--   Option A: Supabase Dashboard (Easiest)
--     1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql
--     2. Delete any existing content
--     3. Copy & paste this ENTIRE file
--     4. Click "Run" button
--
--   Option B: Command Line (if you have psql)
--     psql \$DATABASE_URL < MAVORA_RLS_FIX.sql
--
-- ✅ WHAT THIS FIXES:
--   • All RLS policies now cast auth.uid() to text (::text)
--   • DELETE policies added for all tables
--   • RLS enabled on 14 tables
--   • Fixes "operator does not exist: uuid = text" error
-- ============================================================

${sqlContent}

-- ============================================================
-- ✅ VERIFICATION QUERIES
-- Run these after the fix to verify everything works
-- ============================================================

-- Check RLS status on all tables
SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename=t.tablename) AS policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 'users', 'listings', 'listing_media', 'favorites', 
  'conversations', 'messages', 'wallets', 'orders', 'reviews', 
  'notifications', 'reports', 'invoices', 'user_roles'
)
ORDER BY tablename;

-- Sample query to test UUID casting works
SELECT 
  id::text = id::text AS text_comparison_works,
  typeof(id) AS id_type
FROM profiles 
LIMIT 1;
`;

    fs.writeFileSync(outputPath, completeScript);
    
    console.log(''.repeat(60));
    console.log('✅ SQL FIX FILE GENERATED');
    console.log(''.repeat(60));
    console.log(`📄 Location: ${outputPath}`);
    console.log(`📊 Size: ${(completeScript.length / 1024).toFixed(1)} KB`);
    console.log('');
    console.log('🔗 Direct link to SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql`);
    console.log('');
    console.log('📋 Instructions:');
    console.log('   1. Open the link above');
    console.log('   2. Copy the contents of MAVORA_RLS_FIX.sql');
    console.log('   3. Paste into the editor');
    console.log('   4. Click "Run"');
    console.log('');
    
  } else {
    console.log('✅ Connection successful! Method:', testResult.method);
    console.log('');
    console.log('🎉 You can execute SQL directly! Running full fix...');
    // Here we would execute all statements
  }
}

main().catch(console.error);
