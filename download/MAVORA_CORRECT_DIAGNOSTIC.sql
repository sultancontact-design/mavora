-- ============================================================
-- MAVORA CORRECT DATABASE DIAGNOSTIC
-- discovers ACTUAL column names using correct PostgreSQL syntax
-- ============================================================

-- Step 1: List all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 2: For each table, get actual column names with their types
-- This will show us the REAL column names (camelCase vs snake_case)

-- listings table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'listings'
ORDER BY ordinal_position;

-- listing_media table columns  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'listing_media'
ORDER BY ordinal_position;

-- users/profiles table columns (check common names)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name IN ('profiles', 'users', 'accounts')
ORDER BY table_name, ordinal_position;

-- orders table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- reviews table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY ordinal_position;

-- messages/conversations table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name IN ('messages', 'conversations', 'chats')
ORDER BY table_name, ordinal_position;

-- favorites/wishlist table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name IN ('favorites', 'wishlist', 'saved_items')
ORDER BY table_name, ordinal_position;

-- notifications table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notifications'
ORDER BY ordinal_position;

-- categories table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;
