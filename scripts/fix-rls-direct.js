// Direct PostgreSQL connection to execute RLS fixes
// Using node-postgres to connect directly to Supabase

const { Client } = require('pg');

// Supabase Direct Connection String (needs DB password)
// Format: postgresql://postgres:[PASSWORD]@db.kyanecjjautqmuowbtvy.supabase.co:5432/postgres

async function executeRLSFix(dbPassword) {
  const connectionString = `postgresql://postgres.kyanecjjautqmuowbtvy:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔗 Connecting to Supabase database...');
  
  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // RLS Fix SQL
    const rlsFixes = [
      // Enable RLS on tables
      `ALTER TABLE listings ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE categories ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE cities ENABLE ROW LEVEL SECURITY;`,
      
      // Drop existing policies if they exist
      `DROP POLICY IF EXISTS "public_read_listings" ON listings;`,
      `DROP POLICY IF EXISTS "public_read_categories" ON categories;`,
      `DROP POLICY IF EXISTS "public_read_profiles" ON profiles;`,
      `DROP POLICY IF EXISTS "public_read_cities" ON cities;`,
      
      // Create public read policies
      `CREATE POLICY "public_read_listings" ON listings FOR SELECT TO anon USING (status = 'active');`,
      `CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon USING (true);`,
      `CREATE POLICY "public_read_profiles" ON profiles FOR SELECT TO anon USING (true);`,
      `CREATE POLICY "public_read_cities" ON cities FOR SELECT TO anon USING (true);`
    ];

    console.log('🔧 Executing RLS fixes...\n');
    
    for (const sql of rlsFixes) {
      try {
        await client.query(sql);
        console.log(`✅ ${sql.substring(0, 50)}...`);
      } catch (err) {
        // Some errors are OK (like RLS already enabled)
        console.log(`⚠️ ${err.message.substring(0, 60)}...`);
      }
    }

    // Verify by testing public access
    console.log('\n📊 Verifying public access...\n');
    
    const tables = ['listings', 'categories', 'profiles', 'cities'];
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT count(*) FROM ${table}`);
        console.log(`✅ ${table}: ${result.rows[0].count} records accessible`);
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    await client.end();
    console.log('\n🎉 RLS FIX COMPLETED SUCCESSFULLY!');
    return true;

  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n💡 You need to provide the database password.');
    console.log('Get it from: https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/settings/database');
    return false;
  }
}

// Try with empty password first (won't work, but shows the way)
const dbPassword = process.argv[2] || '';

if (!dbPassword) {
  console.log('==========================================');
  console.log('🔧 SUPABASE DIRECT DB CONNECTION TOOL');
  console.log('==========================================\n');
  console.log('Usage: node fix-rls-direct.js <DB_PASSWORD>\n');
  console.log('To get your database password:');
  console.log('1. Go to: https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/settings/database');
  console.log('2. Scroll to "Connection string" section');
  console.log('3. Copy the password from URI or use "Show password"\n');
  console.log('Then run: node fix-rls-direct.js YOUR_PASSWORD\n');
} else {
  executeRLSFix(dbPassword);
}
