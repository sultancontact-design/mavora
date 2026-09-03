/**
 * Script to setup MAVORA database in Supabase
 * Executes SQL via Supabase REST API
 * Run: npx tsx scripts/setup-database.ts
 */

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

// Read the SQL file
import { readFileSync } from 'fs';
import { join } from 'path';

const sqlContent = readFileSync(join(process.cwd(), 'scripts/setup-database.sql'), 'utf-8');

async function executeSQL() {
  console.log('🚀 Setting up MAVORA database...\n');
  console.log('📋 Connecting to Supabase...');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql: sqlContent }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️  Direct RPC failed, trying alternative method...');
      
      // Alternative: Use the Supabase Management API to execute SQL
      // For now, we'll output the SQL for manual execution
      console.log('\n📄 Please execute this SQL manually in Supabase SQL Editor:');
      console.log('='.repeat(60));
      console.log(sqlContent);
      console.log('='.repeat(60));
      console.log('\n🔗 URL: https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql');
      
      return;
    }

    const data = await response.json();
    console.log('✅ Database setup completed successfully!');
    console.log('Response:', data);

  } catch (error) {
    console.error('❌ Error executing SQL:', error);
    
    // Output SQL for manual execution
    console.log('\n📄 Please execute this SQL manually in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(sqlContent);
    console.log('='.repeat(60));
    console.log('\n🔗 URL: https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql');
  }
}

executeSQL();
