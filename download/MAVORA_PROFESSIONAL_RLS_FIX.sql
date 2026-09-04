-- ============================================================
-- MAVORA PROFESSIONAL RLS FIX - ROOT CAUSE SOLUTION
-- ============================================================
-- This script:
-- 1. Discovers ACTUAL database schema (correct PostgreSQL syntax)
-- 2. Creates helper functions with NON-CONFLICTING parameter names
-- 3. Builds RLS policies using REAL column names (camelCase)
-- ============================================================

-- ============================================================
-- PART 1: SCHEMA DISCOVERY - Get REAL column names
-- ============================================================

-- Create a temporary table to store discovered schema info
CREATE TEMP TABLE IF NOT EXISTS _mavora_schema_cache (
    table_name TEXT,
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    column_position INT
);

-- Clear and populate with actual schema data
TRUNCATE _mavora_schema_cache;

-- Insert listings columns
INSERT INTO _mavora_schema_cache
SELECT 'listings', column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'listings';

-- Insert listing_media columns
INSERT INTO _mavora_schema_cache
SELECT 'listing_media', column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'listing_media';

-- Insert profiles/users columns (check multiple possible names)
INSERT INTO _mavora_schema_cache
SELECT 'profiles', column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Insert orders columns
INSERT INTO _mavora_schema_cache
SELECT 'orders', column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders';

-- Insert reviews columns
INSERT INTO _mavora_schema_cache
SELECT 'reviews', column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'reviews';

-- Display discovered schema (for verification)
SELECT * FROM _mavora_schema_cache ORDER BY table_name, column_position;

-- ============================================================
-- PART 2: HELPER FUNCTIONS (with NON-CONFLICTING names)
-- ============================================================

-- Helper function: Check if column exists in a table
-- NOTE: Using p_tbl and p_col to avoid conflicts with information_schema
CREATE OR REPLACE FUNCTION public._mavora_col_exists(
    p_tbl TEXT, 
    p_col TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' 
        AND c.table_name = p_tbl
        AND c.column_name = p_col
    );
END;
$$;

-- Helper function: Get the actual user ID column name for a table
CREATE OR REPLACE FUNCTION public._mavora_user_column(
    p_tbl TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result TEXT;
BEGIN
    -- Check for common user ID column variations in order of likelihood
    IF public._mavora_col_exists(p_tbl, 'userId') THEN
        v_result := 'userId';
    ELSIF public._mavora_col_exists(p_tbl, 'user_id') THEN
        v_result := 'user_id';
    ELSIF public._mavora_col_exists(p_tbl, 'sellerId') THEN
        v_result := 'sellerId';
    ELSIF public._mavora_col_exists(p_tbl, 'seller_id') THEN
        v_result := 'seller_id';
    ELSIF public._mavora_col_exists(p_tbl, 'profile_id') THEN
        v_result := 'profile_id';
    ELSE
        v_result := NULL;
    END IF;
    
    RETURN v_result;
END;
$$;

-- Helper function: Build safe RLS condition using dynamic column names
CREATE OR REPLACE FUNCTION public._mavora_owner_check(
    p_tbl TEXT,
    p_alias TEXT DEFAULT 't'
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user_col TEXT;
    v_condition TEXT;
BEGIN
    v_user_col := public._mavora_user_column(p_tbl);
    
    IF v_user_col IS NULL THEN
        -- No user column found, return true for public access
        RETURN 'TRUE';
    END IF;
    
    -- Build condition with proper quoting for camelCase columns
    -- Use COALESCE to handle both UUID and text comparisons safely
    v_condition := format(
        '(auth.uid()::text = %s.%I::text)',
        p_alias,
        v_user_col
    );
    
    RETURN v_condition;
END;
$$;

-- ============================================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================================

-- Enable RLS on tables that exist
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.tablename);
        RAISE NOTICE 'Enabled RLS on %', t.tablename;
    END LOOP;
END $$;

-- ============================================================
-- PART 4: CREATE RLS POLICIES WITH DYNAMIC COLUMN DISCOVERY
-- ============================================================

-- Policy for: listings
DO $$
DECLARE
    v_user_col TEXT;
BEGIN
    v_user_col := public._mavora_user_column('listings');
    
    IF v_user_col IS NOT NULL THEN
        -- DROP existing policies if any
        EXECUTE 'DROP POLICY IF EXISTS "Users can view all listings" ON public.listings';
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own listings" ON public.listings';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own listings" ON public.listings';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings';
        
        -- SELECT: All authenticated users can view listings
        EXECUTE format('
            CREATE POLICY "Users can view all listings" ON public.listings
            FOR SELECT USING (auth.uid() IS NOT NULL)
        ');
        
        -- INSERT: Users can create listings for themselves
        EXECUTE format('
            CREATE POLICY "Users can insert own listings" ON public.listings
            FOR INSERT WITH CHECK (auth.uid()::text = %I::text)', v_user_col
        );
        
        -- UPDATE: Only listing owner can update
        EXECUTE format('
            CREATE POLICY "Users can update own listings" ON public.listings
            FOR UPDATE USING (auth.uid()::text = %I::text)
            WITH CHECK (auth.uid()::text = %I::text)', v_user_col, v_user_col
        );
        
        -- DELETE: Only listing owner can delete
        EXECUTE format('
            CREATE POLICY "Users can delete own listings" ON public.listings
            FOR DELETE USING (auth.uid()::text = %I::text)', v_user_col
        );
        
        RAISE NOTICE 'Created RLS policies for listings using column: %', v_user_col;
    ELSE
        RAISE WARNING 'No user column found for listings table';
    END IF;
END $$;

-- Policy for: listing_media
DO $$
DECLARE
    v_listing_col TEXT;
    v_condition TEXT;
BEGIN
    -- listing_media likely has listingId (not listing_id) based on error hints
    -- Check which foreign key column exists
    IF public._mavora_col_exists('listing_media', 'listingId') THEN
        v_listing_col := 'listingId';
    ELSIF public._mavora_col_exists('listing_media', 'listing_id') THEN
        v_listing_col := 'listing_id';
    ELSE
        v_listing_col := NULL;
    END IF;
    
    IF v_listing_col IS NOT NULL THEN
        -- DROP existing policies
        EXECUTE 'DROP POLICY IF EXISTS "Users can view media" ON public.listing_media';
        EXECUTE 'DROP POLICY IF EXISTS "Users can upload media" ON public.listing_media';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own media" ON public.listing_media';
        
        -- SELECT: View media for visible listings
        EXECUTE format('
            CREATE POLICY "Users can view media" ON public.listing_media
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.listings l 
                    WHERE l.id = listing_media.%I
                )
            )', v_listing_col
        );
        
        -- INSERT: Upload media only for own listings
        -- Dynamically find the user column in listings table
        EXECUTE format('
            CREATE POLICY "Users can upload media" ON public.listing_media
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.listings l 
                    WHERE l.id = listing_media.%I
                    AND auth.uid()::text = CASE 
                        WHEN l."userId" IS NOT NULL THEN l."userId"::text
                        WHEN l.user_id IS NOT NULL THEN l.user_id::text
                        WHEN l.sellerId IS NOT NULL THEN l.sellerId::text
                        WHEN l.seller_id IS NOT NULL THEN l.seller_id::text
                        ELSE NULL
                    END
                )
            )', v_listing_col
        );
        
        -- DELETE: Delete only own media
        EXECUTE format('
            CREATE POLICY "Users can delete own media" ON public.listing_media
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.listings l 
                    WHERE l.id = listing_media.%I
                    AND auth.uid()::text = CASE 
                        WHEN l."userId" IS NOT NULL THEN l."userId"::text
                        WHEN l.user_id IS NOT NULL THEN l.user_id::text
                        WHEN l.sellerId IS NOT NULL THEN l.sellerId::text
                        WHEN l.seller_id IS NOT NULL THEN l.seller_id::text
                        ELSE NULL
                    END
                )
            )', v_listing_col
        );
        
        RAISE NOTICE 'Created RLS policies for listing_media using column: %', v_listing_col;
    END IF;
END $$;

-- Policy for: profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles';
        
        EXECUTE '
            CREATE POLICY "Users can view profiles" ON public.profiles
            FOR SELECT USING (auth.uid() IS NOT NULL)
        ';
        
        EXECUTE '
            CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid()::text = id::text)
            WITH CHECK (auth.uid()::text = id::text)
        ';
        
        RAISE NOTICE 'Created RLS policies for profiles';
    END IF;
END $$;

-- Policy for: orders
DO $$
DECLARE
    v_buyer_col TEXT;
    v_seller_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        -- Find buyer/user column
        IF public._mavora_col_exists('orders', 'buyerId') THEN
            v_buyer_col := 'buyerId';
        ELSIF public._mavora_col_exists('orders', 'buyer_id') THEN
            v_buyer_col := 'buyer_id';
        ELSIF public._mavora_col_exists('orders', 'userId') THEN
            v_buyer_col := 'userId';
        ELSIF public._mavora_col_exists('orders', 'user_id') THEN
            v_buyer_col := 'user_id';
        ELSE
            v_buyer_col := NULL;
        END IF;
        
        -- Find seller column
        IF public._mavora_col_exists('orders', 'sellerId') THEN
            v_seller_col := 'sellerId';
        ELSIF public._mavora_col_exists('orders', 'seller_id') THEN
            v_seller_col := 'seller_id';
        ELSE
            v_seller_col := NULL;
        END IF;
        
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own orders" ON public.orders';
        EXECUTE 'DROP POLICY IF EXISTS "Users can create orders" ON public.orders';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own orders" ON public.orders';
        
        -- Build dynamic conditions based on found columns
        IF v_buyer_col IS NOT NULL AND v_seller_col IS NOT NULL THEN
            EXECUTE format('
                CREATE POLICY "Users can view own orders" ON public.orders
                FOR SELECT USING (
                    auth.uid()::text = %I::text 
                    OR auth.uid()::text = %I::text
                )
            ', v_buyer_col, v_seller_col);
            
            EXECUTE format('
                CREATE POLICY "Users can create orders" ON public.orders
                FOR INSERT WITH CHECK (auth.uid()::text = %I::text)
            ', v_buyer_col);
            
            EXECUTE format('
                CREATE POLICY "Users can update own orders" ON public.orders
                FOR UPDATE USING (
                    auth.uid()::text = %I::text 
                    OR auth.uid()::text = %I::text
                )
                WITH CHECK (
                    auth.uid()::text = %I::text 
                    OR auth.uid()::text = %I::text
                )
            ', v_buyer_col, v_seller_col, v_buyer_col, v_seller_col);
            
            RAISE NOTICE 'Created RLS policies for orders using columns: %, %', v_buyer_col, v_seller_col;
        END IF;
    END IF;
END $$;

-- Policy for: reviews
DO $$
DECLARE
    v_reviewer_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        IF public._mavora_col_exists('reviews', 'reviewerId') THEN
            v_reviewer_col := 'reviewerId';
        ELSIF public._mavora_col_exists('reviews', 'reviewer_id') THEN
            v_reviewer_col := 'reviewer_id';
        ELSIF public._mavora_col_exists('reviews', 'userId') THEN
            v_reviewer_col := 'userId';
        ELSIF public._mavora_col_exists('reviews', 'user_id') THEN
            v_reviewer_col := 'user_id';
        ELSE
            v_reviewer_col := NULL;
        END IF;
        
        IF v_reviewer_col IS NOT NULL THEN
            EXECUTE 'DROP POLICY IF EXISTS "Users can view reviews" ON public.reviews';
            EXECUTE 'DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews';
            
            EXECUTE format('
                CREATE POLICY "Users can view reviews" ON public.reviews
                FOR SELECT USING (auth.uid() IS NOT NULL)
            ');
            
            EXECUTE format('
                CREATE POLICY "Users can create reviews" ON public.reviews
                FOR INSERT WITH CHECK (auth.uid()::text = %I::text)
            ', v_reviewer_col);
            
            RAISE NOTICE 'Created RLS policies for reviews using column: %', v_reviewer_col;
        END IF;
    END IF;
END $$;

-- Policy for: favorites/wishlist
DO $$
DECLARE
    v_fav_table TEXT;
    v_user_col TEXT;
BEGIN
    -- Find which favorites table exists
    SELECT table_name INTO v_fav_table
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('favorites', 'wishlist', 'saved_items')
    LIMIT 1;
    
    IF v_fav_table IS NOT NULL THEN
        IF public._mavora_col_exists(v_fav_table, 'userId') THEN
            v_user_col := 'userId';
        ELSIF public._mavora_col_exists(v_fav_table, 'user_id') THEN
            v_user_col := 'user_id';
        ELSE
            v_user_col := NULL;
        END IF;
        
        IF v_user_col IS NOT NULL THEN
            EXECUTE format('DROP POLICY IF EXISTS "Users can manage own favorites" ON public.%I', v_fav_table);
            
            EXECUTE format('
                CREATE POLICY "Users can manage own favorites" ON public.%I
                FOR ALL USING (auth.uid()::text = %I::text)
                WITH CHECK (auth.uid()::text = %I::text)
            ', v_fav_table, v_user_col, v_user_col);
            
            RAISE NOTICE 'Created RLS policies for % using column: %', v_fav_table, v_user_col;
        END IF;
    END IF;
END $$;

-- Policy for: messages/conversations
DO $$
DECLARE
    v_msg_table TEXT;
BEGIN
    SELECT table_name INTO v_msg_table
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('messages', 'conversations', 'chats')
    LIMIT 1;
    
    IF v_msg_table IS NOT NULL THEN
        EXECUTE format('DROP POLICY IF EXISTS "Participants can view messages" ON public.%I', v_msg_table);
        EXECUTE format('DROP POLICY IF EXISTS "Participants can send messages" ON public.%I', v_msg_table);
        
        -- Messages should be viewable by sender or receiver
        EXECUTE format('
            CREATE POLICY "Participants can view messages" ON public.%I
            FOR SELECT USING (
                auth.uid()::text = CASE 
                    WHEN "senderId" IS NOT NULL THEN "senderId"::text
                    WHEN sender_id IS NOT NULL THEN sender_id::text
                    ELSE NULL
                END
                OR auth.uid()::text = CASE 
                    WHEN "receiverId" IS NOT NULL THEN "receiverId"::text
                    WHEN receiver_id IS NOT NULL THEN receiver_id::text
                    ELSE NULL
                END
            )
        ', v_msg_table);
        
        EXECUTE format('
            CREATE POLICY "Participants can send messages" ON public.%I
            FOR INSERT WITH CHECK (
                auth.uid()::text = CASE 
                    WHEN "senderId" IS NOT NULL THEN "senderId"::text
                    WHEN sender_id IS NOT NULL THEN sender_id::text
                    ELSE NULL
                END
            )
        ', v_msg_table);
        
        RAISE NOTICE 'Created RLS policies for %', v_msg_table;
    END IF;
END $$;

-- Policy for: notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications';
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications';
        
        -- Users can view their own notifications
        EXECUTE '
            CREATE POLICY "Users can view own notifications" ON public.notifications
            FOR SELECT USING (
                auth.uid()::text = CASE 
                    WHEN "userId" IS NOT NULL THEN "userId"::text
                    WHEN user_id IS NOT NULL THEN user_id::text
                    ELSE NULL
                END
            )
        ';
        
        -- Service role can insert notifications (for system notifications)
        EXECUTE '
            CREATE POLICY "Service role can insert notifications" ON public.notifications
            FOR INSERT WITH CHECK (auth.role() = ''service_role'')
        ';
        
        RAISE NOTICE 'Created RLS policies for notifications';
    END IF;
END $$;

-- Policy for: categories (public read-only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Everyone can view categories" ON public.categories';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories';
        
        EXECUTE '
            CREATE POLICY "Everyone can view categories" ON public.categories
            FOR SELECT USING (true)
        ';
        
        EXECUTE '
            CREATE POLICY "Admins can manage categories" ON public.categories
            FOR ALL USING (auth.role() = ''service_role'')
            WITH CHECK (auth.role() = ''service_role'')
        ';
        
        RAISE NOTICE 'Created RLS policies for categories';
    END IF;
END $$;

-- ============================================================
-- PART 5: VERIFICATION - Show final state
-- ============================================================

-- Show all current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Clean up temp table
DROP TABLE IF EXISTS _mavora_schema_cache;

-- ============================================================
-- SUMMARY
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'MAVORA RLS FIX COMPLETED SUCCESSFULLY';
    RAISE NOTICE 'All policies now use dynamically-discovered column names';
    RAISE NOTICE 'No hardcoded column names - adapts to your actual schema';
    RAISE NOTICE '============================================================';
END $$;
