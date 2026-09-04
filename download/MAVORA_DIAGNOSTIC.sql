-- ============================================================
-- 🔍 MAVORA DIAGNOSTIC SCRIPT
-- Shows EXACT column names for all tables
-- Run this FIRST to see what columns actually exist!
-- ============================================================

-- Show all tables and their columns
SELECT 
    t.tablename,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.tablename, c.ordinal_position;

-- ============================================================
-- Alternative: Show as grouped by table (easier to read)
-- ============================================================

-- Create a temporary function to display table structure
DO $$
DECLARE
    table_rec RECORD;
    col_rec RECORD;
    table_text TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '🔍 MAVORA DATABASE STRUCTURE DIAGNOSTIC';
    RAISE NOTICE '============================================================';
    
    FOR table_rec IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '📋 TABLE: %', table_rec.tablename;
        
        -- Get columns for this table
        FOR col_rec IN 
            SELECT 
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = table_rec.tablename
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '   • % (%) %', col_rec.column_name, col_rec.data_type, 
                CASE WHEN col_rec.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END;
        END LOOP;
        
        -- Check if RLS is enabled
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
                AND tablename = table_rec.tablename 
                AND rowsecurity = true
        ) THEN
            RAISE NOTICE '   ✅ RLS: ENABLED';
        ELSE
            RAISE NOTICE '   ⚠️  RLS: DISABLED';
        END IF;
        
        -- Count existing policies
        DECLARE policy_count INT;
        SELECT COUNT(*) INTO policy_count FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = table_rec.tablename;
        
        RAISE NOTICE '   📜 Policies: %', policy_count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ Diagnostic complete! Use this info to fix RLS policies';
    RAISE NOTICE '============================================================';
END $$;
