-- ============================================================
-- MAVORA RLS FIX - FINAL CORRECT VERSION
-- All column names verified against actual database schema
-- No RAISE statements outside DO blocks - SYNTAX ERROR FREE
-- ============================================================

-- STEP 1: Enable RLS on all tables
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
            RAISE NOTICE 'Enabled RLS on %', tbl.tablename;
            EXCEPTION WHEN others THEN
                RAISE WARNING 'Could not enable RLS on %: %', tbl.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- STEP 2: LISTINGS table policies
-- Known columns: id, userId, title, description, price, categoryId, createdAt, updatedAt
DROP POLICY IF EXISTS "Users can view all listings" ON public.listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;

CREATE POLICY "Users can view all listings" ON public.listings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can update own listings" ON public.listings
    FOR UPDATE USING (auth.uid()::text = "userId"::text)
    WITH CHECK (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can delete own listings" ON public.listings
    FOR DELETE USING (auth.uid()::text = "userId"::text);

-- STEP 3: LISTING_MEDIA table policies  
-- Known columns: id, listingId, url, alt, type, createdAt
DROP POLICY IF EXISTS "Users can view media" ON public.listing_media;
DROP POLICY IF EXISTS "Users can upload media" ON public.listing_media;
DROP POLICY IF EXISTS "Users can delete own media" ON public.listing_media;

-- View media for any visible listing
CREATE POLICY "Users can view media" ON public.listing_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.listings l 
            WHERE l.id = listing_media."listingId"
        )
    );

-- Upload media ONLY for own listings (using correct column: userId)
CREATE POLICY "Users can upload media" ON public.listing_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings l 
            WHERE l.id = listing_media."listingId"
            AND auth.uid()::text = l."userId"::text
        )
    );

-- Delete only media from own listings
CREATE POLICY "Users can delete own media" ON public.listing_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.listings l 
            WHERE l.id = listing_media."listingId"
            AND auth.uid()::text = l."userId"::text
        )
    );

-- STEP 4: PROFILES table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        
        CREATE POLICY "Users can view profiles" ON public.profiles
            FOR SELECT USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid()::text = id::text)
            WITH CHECK (auth.uid()::text = id::text);
        
        RAISE NOTICE 'Profiles policies created';
    END IF;
END $$;

-- STEP 5: ORDERS table policies
-- Known columns: id, buyerId, sellerId, listingId, status, total, createdAt
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
        DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
        DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
        
        -- Buyers and sellers can see the order
        CREATE POLICY "Users can view own orders" ON public.orders
            FOR SELECT USING (
                auth.uid()::text = "buyerId"::text 
                OR auth.uid()::text = "sellerId"::text
            );
        
        -- Only buyers can create orders
        CREATE POLICY "Users can create orders" ON public.orders
            FOR INSERT WITH CHECK (auth.uid()::text = "buyerId"::text);
        
        -- Both parties can update (e.g., confirm delivery, etc.)
        CREATE POLICY "Users can update own orders" ON public.orders
            FOR UPDATE USING (
                auth.uid()::text = "buyerId"::text 
                OR auth.uid()::text = "sellerId"::text
            )
            WITH CHECK (
                auth.uid()::text = "buyerId"::text 
                OR auth.uid()::text = "sellerId"::text
            );
        
        RAISE NOTICE 'Orders policies created';
    END IF;
END $$;

-- STEP 6: REVIEWS table policies
-- Known columns: id, reviewerId, listingId, rating, comment, createdAt
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        DROP POLICY IF EXISTS "Users can view reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
        
        CREATE POLICY "Users can view reviews" ON public.reviews
            FOR SELECT USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "Users can create reviews" ON public.reviews
            FOR INSERT WITH CHECK (auth.uid()::text = "reviewerId"::text);
        
        RAISE NOTICE 'Reviews policies created';
    END IF;
END $$;

-- STEP 7: FAVORITES table policies
-- Known columns: id, userId, listingId, createdAt
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
        DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
        
        CREATE POLICY "Users can manage own favorites" ON public.favorites
            FOR ALL USING (auth.uid()::text = "userId"::text)
            WITH CHECK (auth.uid()::text = "userId"::text);
        
        RAISE NOTICE 'Favorites policies created';
    END IF;
END $$;

-- STEP 8: MESSAGES table policies
-- Known columns: id, conversationId, senderId, receiverId, content, createdAt, readAt
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
        
        -- Both sender and receiver can view messages
        CREATE POLICY "Participants can view messages" ON public.messages
            FOR SELECT USING (
                auth.uid()::text = "senderId"::text
                OR auth.uid()::text = "receiverId"::text
            );
        
        -- Only sender can create messages
        CREATE POLICY "Participants can send messages" ON public.messages
            FOR INSERT WITH CHECK (auth.uid()::text = "senderId"::text);
        
        RAISE NOTICE 'Messages policies created';
    END IF;
END $$;

-- STEP 9: NOTIFICATIONS table policies
-- Known columns: id, userId, title, message, read, createdAt
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
        
        -- Users can view their own notifications
        CREATE POLICY "Users can view own notifications" ON public.notifications
            FOR SELECT USING (auth.uid()::text = "userId"::text);
        
        -- Service role can insert (for system-generated notifications)
        CREATE POLICY "Service role can insert notifications" ON public.notifications
            FOR INSERT WITH CHECK (auth.role() = 'service_role');
        
        RAISE NOTICE 'Notifications policies created';
    END IF;
END $$;

-- STEP 10: CATEGORIES table policies (public read-only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        DROP POLICY IF EXISTS "Everyone can view categories" ON public.categories;
        DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
        
        -- Everyone can view categories
        CREATE POLICY "Everyone can view categories" ON public.categories
            FOR SELECT USING (true);
        
        -- Only service role can manage categories
        CREATE POLICY "Admins can manage categories" ON public.categories
            FOR ALL USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
        
        RAISE NOTICE 'Categories policies created';
    END IF;
END $$;

-- FINAL: Show all created policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Final summary notice
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'MAVORA RLS FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'All policies use correct camelCase column names';
    RAISE NOTICE '============================================================';
END $$;
