const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3widHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

async function runMigration() {
  console.log('🚀 Starting database migration to Supabase...\n');
  
  const sqlContent = fs.readFileSync('prisma/migrations/20260103000000_init/migration.sql', 'utf8');
  console.log(`📄 SQL file size: ${sqlContent.length} characters`);
  
  // Better SQL splitting - handle statements properly
  const lines = sqlContent.split('\n');
  let currentStatement = '';
  const statements = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comment-only lines but keep them for context
    if (trimmedLine.startsWith('--')) {
      continue;
    }
    
    currentStatement += line + '\n';
    
    // Check if statement ends with semicolon
    if (trimmedLine.endsWith(';')) {
      const cleanStmt = currentStatement.trim();
      if (cleanStmt.length > 10) { // Only add non-trivial statements
        statements.push(cleanStmt);
      }
      currentStatement = '';
    }
  }
  
  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
  
  // Log first few statements
  console.log('Sample statements:');
  statements.slice(0, 3).forEach((s, i) => {
    console.log(`  ${i+1}. ${s.substring(0, 80)}...`);
  });
  
  // Try to execute via Supabase SQL API
  console.log('\n🔄 Attempting to execute via Supabase API...');
  
  // Method 1: Try using the internal _sql endpoint (if available)
  try {
    const response = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1 as test' })
    });
    
    const result = await response.json();
    console.log('PG Query API Response:', JSON.stringify(result).substring(0, 200));
  } catch (err) {
    console.log('PG Query not available:', err.message);
  }
  
  // Method 2: Check if we can use the dashboard SQL editor endpoint
  console.log('\n💡 To complete the migration, you can:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Open SQL Editor');
  console.log('   3. Copy and paste the content of: prisma/migrations/20260103000000_init/migration.sql');
  console.log('   4. Run the SQL');
}

runMigration().catch(console.error);
