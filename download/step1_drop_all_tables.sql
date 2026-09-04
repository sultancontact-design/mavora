-- ============================================
-- 🔄 MAVORA: Complete Database Reset
-- This will DELETE ALL DATA and RECREATE everything
-- ============================================

-- Step 1: Drop all user-created tables automatically
DO $$ 
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('spatial_ref_sys')
        ORDER BY tablename
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS "' || tbl.tablename || '" CASCADE';
        RAISE NOTICE 'Dropped table: %', tbl.tablename;
    END LOOP;
END $$;

-- Step 2: Verify all tables are dropped
SELECT 
    COUNT(*) as remaining_tables
FROM pg_tables 
WHERE schemaname = 'public';

-- ============================================
-- ✅ Now you can run the main migration file:
-- mavora_database_schema.sql
-- ============================================
