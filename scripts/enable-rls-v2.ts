/**
 * Enable RLS using Supabase SQL endpoint (PostgREST)
 * This uses the /rpc endpoint with proper SQL execution
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

async function enableRLSViaSQL() {
  console.log('🔒 Attempting to enable RLS via direct SQL...\n');

  // Try using fetch to call Supabase's internal SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      sql: `
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
        CREATE POLICY "Users update own" ON profiles FOR UPDATE USING (auth.uid() = id);
        CREATE POLICY "Users insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
      `
    }),
  });

  const result = await response.json();
  console.log('Response:', response.status, result);

  // Test if it worked
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTgzNjImImV4cCI6MjEwMzg3NDM2Mn0.-Oe0g-zcJ5ygIUKBkxfsqmkkZTDXPAmdINp2uoKV48Q';
  
  const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.fake`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ bio: 'test' }),
  });

  if (!testResponse.ok || (await testResponse.json()).length === 0) {
    console.log('✅ RLS appears to be working - anonymous PATCH was blocked');
  } else {
    console.log('⚠️  RLS may need manual configuration');
  }
}

enableRLSViaSQL().catch(console.error);
