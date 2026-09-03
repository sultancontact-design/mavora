const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

async function executeMigration() {
  console.log('🚀 Starting MAVORA Database Migration...\n');
  
  const sqlContent = fs.readFileSync('prisma/migrations/20260103000000_init/migration.sql', 'utf8');
  
  // Parse SQL into individual statements
  const lines = sqlContent.split('\n');
  let currentStatement = '';
  const statements = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('--')) continue;
    
    currentStatement += line + '\n';
    
    if (trimmedLine.endsWith(';')) {
      const cleanStmt = currentStatement.trim();
      if (cleanStmt.length > 10) {
        statements.push(cleanStmt);
      }
      currentStatement = '';
    }
  }
  
  console.log(`📊 Total SQL Statements: ${statements.length}\n`);
  
  // Try executing via fetch to various endpoints
  console.log('🔄 Attempting to execute SQL via API...\n');
  
  // Test with a simple CREATE TABLE first
  const testSQL = `CREATE TABLE IF NOT EXISTS _migration_test (
    id serial PRIMARY KEY,
    created_at timestamp default now()
  );`;
  
  // Method 1: Try /rpc endpoint
  console.log('Method 1: Trying /rpc/exec_sql...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql_string: testSQL })
    });
    console.log('   Status:', res.status, await res.text().catch(() => ''));
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  // Method 2: Try direct pg endpoint
  console.log('\nMethod 2: Trying /pg/sql...');
  try {
    const res = await fetch(`${SUPABASE_URL}/pg/sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: testSQL })
    });
    console.log('   Status:', res.status, (await res.text()).substring(0, 100));
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n💡 MIGRATION INSTRUCTIONS:');
  console.log('='.repeat(50));
  console.log('\nThe SQL file is ready at:');
  console.log('   📄 prisma/migrations/20260103000000_init/migration.sql');
  console.log('\nTo complete migration:');
  console.log('   1. Open https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql');
  console.log('   2. Click "New Query"');
  console.log('   3. Copy the entire content of the SQL file above');
  console.log('   4. Paste and press Run (Ctrl+Enter)');
  console.log('   5. Wait for all 40+ tables to be created ✅\n');
}

executeMigration().catch(console.error);
