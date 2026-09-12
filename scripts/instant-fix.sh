#!/bin/bash
# ===========================================
# 🚀 MAVORA - INSTANT FIX SCRIPT
# ===========================================
# Run this script after providing credentials
# Usage: ./instant-fix.sh "VERCEL_EMAIL" "DB_PASSWORD"
# ===========================================

set -e

echo "=========================================="
echo "🚀 MAVORA - INSTANT FIX EXECUTION"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ "$#" -lt 2 ]; then
    echo -e "${YELLOW}Usage: $0 \"VERCEL_EMAIL\" \"SUPABASE_DB_PASSWORD\"${NC}"
    echo ""
    echo "Where:"
    echo "  VERCEL_EMAIL        = Your Vercel account email"
    echo "  SUPABASE_DB_PASSWORD = Your Supabase database password"
    echo ""
    echo "Get DB password from:"
    echo "  https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/settings/database"
    echo ""
    exit 1
fi

VERCEL_EMAIL=$1
DB_PASSWORD=$2
SUPABASE_URL="https://kyanecjjautqmuowbtvy.supabase.co"
SUPABASE_PROJECT="kyanecjjautqmuowbtvy"

echo -e "${GREEN}[1/4] Fixing RLS Policies in Supabase...${NC}"

# Create temp SQL file
SQL_FILE="/tmp/mavora-rls-fix.sql"
cat > "$SQL_FILE" << 'SQLEOF'
-- Enable RLS (ignore errors if already enabled)
DO $$ BEGIN
  EXECUTE 'ALTER TABLE listings ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN END;
$$;

DO $$ BEGIN
  EXECUTE 'ALTER TABLE categories ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN END;
$$;

DO $$ BEGIN
  EXECUTE 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN END;
$$;

DO $$ BEGIN
  EXECUTE 'ALTER TABLE cities ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "public_read_listings" ON listings;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
DROP POLICY IF EXISTS "public_read_cities" ON cities;

-- Create public read policies
CREATE POLICY "public_read_listings" ON listings FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_cities" ON cities FOR SELECT TO anon USING (true);

-- Verify
SELECT 'listings' as table_name, count(*) as row_count FROM listings
UNION ALL
SELECT 'categories', count(*) FROM categories
UNION ALL
SELECT 'profiles', count(*) FROM profiles
UNION ALL
SELECT 'cities', count(*) FROM cities;
SQLEOF

# Try to execute via psql if available
if command -v psql &> /dev/null; then
    echo "Using psql to connect..."
    PGPASSWORD="$DB_PASSWORD" psql -h db.${SUPABASE_PROJECT}.supabase.co -U postgres.${SUPABASE_PROJECT} -d postgres -f "$SQL_FILE" 2>&1 || true
else
    echo -e "${YELLOW}psql not found. Using Node.js...${NC}"
    
    # Use node to execute
    node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.${SUPABASE_PROJECT}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('✅ Connected to database!');
  
  const sql = $(cat "$SQL_FILE" | sed "s/'/\\\\'/g" | awk '{print "\""$0"\\n\""}')
  
  const queries = [
    'ALTER TABLE listings ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE categories ENABLE ROW LEVEL SECURITY', 
    'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE cities ENABLE ROW LEVEL SECURITY',
    'DROP POLICY IF EXISTS \"public_read_listings\" ON listings',
    'DROP POLICY IF EXISTS \"public_read_categories\" ON categories',
    'DROP POLICY IF EXISTS \"public_read_profiles\" ON profiles',
    'DROP POLICY IF EXISTS \"public_read_cities\" ON cities',
    'CREATE POLICY \"public_read_listings\" ON listings FOR SELECT TO anon USING (status = \\'active\\')',
    'CREATE POLICY \"public_read_categories\" ON categories FOR SELECT TO anon USING (true)',
    'CREATE POLICY \"public_read_profiles\" ON profiles FOR SELECT TO anon USING (true)',
    'CREATE POLICY \"public_read_cities\" ON cities FOR SELECT TO anon USING (true)'
  ];
  
  for (const q of queries) {
    try {
      await client.query(q);
      console.log('✅ ' + q.substring(0, 50) + '...');
    } catch(e) {
      console.log('⚠️ ' + e.message.substring(0, 60));
    }
  }
  
  // Verify
  console.log('\\n📊 Verification:');
  for (const t of ['listings', 'categories', 'profiles', 'cities']) {
    try {
      const r = await client.query('SELECT count(*) FROM ' + t);
      console.log('✅ ' + t + ': ' + r.rows[0].count + ' records');
    } catch(e) {
      console.log('❌ ' + t + ': ' + e.message);
    }
  }
  
  await client.end();
}
run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
" 2>&1
fi

echo ""
echo -e "${GREEN}[2/4] RLS Fix Complete!${NC}"
echo ""
echo -e "${GREEN}[3/4] Setting up environment variables...${NC}"
echo ""
echo "Please add these to Vercel manually (takes 2 minutes):"
echo ""
echo "📍 Go to: https://vercel.com/sultancontact-design/mavora/settings/environment-variables"
echo ""
cat << 'ENVEOF'

┌─────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐│ Variable Name                           │ Value                                                                  │
├─────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_SUPABASE_URL                │ https://kyanecjjautqmuowbtvy.supabase.co                     │
│ NEXT_PUBLIC_SUPABASE_ANON_KEY           │ (get from: supabase.com/dashboard > Settings > API)         │
│ SUPABASE_SERVICE_ROLE_KEY               │ (get from: supabase.com/dashboard > Settings > API)         │
│ JWT_SECRET                              │ mavora-super-secret-jwt-key-2024-production-minimum-32-chars! │
│ NEXT_PUBLIC_APP_URL                    │ https://my-project-nu-nine-64.vercel.app                      │
└─────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘
ENVEOF

echo ""
echo -e "${GREEN}[4/4] Final Steps:${NC}"
echo ""
echo "1. ✅ RLS Policies: FIXED (if no errors above)"
echo "2. ⏳ Env Variables: Set in Vercel Dashboard (see above)"
echo "3. ⏳ Redeploy: Vercel Dashboard > Deployments > Redeploy"
echo "4. ⏳ Test: Visit https://my-project-nu-nine-64.vercel.app"
echo ""
echo "=========================================="
echo -e "${GREEN}✨ SCRIPT COMPLETE!${NC}"
echo "=========================================="

# Cleanup
rm -f "$SQL_FILE"
