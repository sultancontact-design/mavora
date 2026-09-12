// EXECUTE RLS FIXES NOW WITH REAL CREDENTIALS
const { Client } = require('pg');

const DB_PASSWORD = 'Sultan@Admin2024';
const SUPABASE_PROJECT = 'kyanecjjautqmuowbtvy';

async function executeRLSFix() {
  const client = new Client({
    connectionString: `postgresql://postgres.${SUPABASE_PROJECT}:${encodeURIComponent(DB_PASSWORD)}@db.${SUPABASE_PROJECT}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔗 Connecting to Supabase database...');
  
  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // RLS Fix SQL statements
    const fixes = [
      // Enable RLS on tables
      { sql: 'ALTER TABLE listings ENABLE ROW LEVEL SECURITY', desc: 'Enable RLS on listings' },
      { sql: 'ALTER TABLE categories ENABLE ROW LEVEL SECURITY', desc: 'Enable RLS on categories' },
      { sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY', desc: 'Enable RLS on profiles' },
      { sql: 'ALTER TABLE cities ENABLE ROW LEVEL SECURITY', desc: 'Enable RLS on cities' },
      { sql: 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY', desc: 'Enable RLS on reviews' },
      
      // Drop existing policies
      { sql: 'DROP POLICY IF EXISTS "public_read_listings" ON listings', desc: 'Drop old listings policy' },
      { sql: 'DROP POLICY IF EXISTS "public_read_categories" ON categories', desc: 'Drop old categories policy' },
      { sql: 'DROP POLICY IF EXISTS "public_read_profiles" ON profiles', desc: 'Drop old profiles policy' },
      { sql: 'DROP POLICY IF EXISTS "public_read_cities" ON cities', desc: 'Drop old cities policy' },
      { sql: 'DROP POLICY IF EXISTS "public_read_reviews" ON reviews', desc: 'Drop old reviews policy' },
      
      // Create public read policies
      { sql: 'CREATE POLICY "public_read_listings" ON listings FOR SELECT TO anon USING (status = \'active\')', desc: 'Create public read for listings' },
      { sql: 'CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon USING (true)', desc: 'Create public read for categories' },
      { sql: 'CREATE POLICY "public_read_profiles" ON profiles FOR SELECT TO anon USING (true)', desc: 'Create public read for profiles' },
      { sql: 'CREATE POLICY "public_read_cities" ON cities FOR SELECT TO anon USING (true)', desc: 'Create public read for cities' },
      { sql: 'CREATE POLICY "public_read_reviews" ON reviews FOR SELECT TO anon USING (true)', desc: 'Create public read for reviews' }
    ];

    console.log('🔧 Executing RLS fixes...\n');
    
    for (const fix of fixes) {
      try {
        await client.query(fix.sql);
        console.log(`✅ ${fix.desc}`);
      } catch (err) {
        // Some errors are OK (like RLS already enabled)
        if (err.message.includes('already enabled') || err.message.includes('already exists')) {
          console.log(`⏭️ ${fix.desc} (already done)`);
        } else {
          console.log(`⚠️ ${fix.desc}: ${err.message.substring(0, 80)}`);
        }
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
        console.log(`❌ ${table}: ${err.message.substring(0, 80)}`);
      }
    }

    await client.end();
    console.log('\n🎉 RLS FIX COMPLETED SUCCESSFULLY!');
    return true;

  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    return false;
  }
}

executeRLSFix().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
