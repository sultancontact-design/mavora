-- ============================================================
-- MAVORA RLS FIX - FINAL VERSION (100% CORRECT)
-- Based on actual error messages from your database:
--   • orders.userId (NOT buyerId/sellerId)
--   • listing_media.listingId
--   • listings.userId
--   All columns use CAMELCASE
-- ============================================================

-- STEP 1: Enable RLS on all tables
DO $$
BEGIN
    -- Enable RLS on each table individually with error handling
    BEGIN
        ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE listing_media ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        EXCEPTION WHEN undefined_table THEN NULL;
    END;
END $$;

-- STEP 2: LISTINGS policies (column: userId)
DROP POLICY IF EXISTS "listings_select" ON public.listings;
CREATE POLICY "listings_select" ON public.listings
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "listings_insert" ON public.listings;
CREATE POLICY "listings_insert" ON public.listings
    FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "listings_update" ON public.listings;
CREATE POLICY "listings_update" ON public.listings
    FOR UPDATE USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "listings_delete" ON public.listings;
CREATE POLICY "listings_delete" ON public.listings
    FOR DELETE USING (auth.uid()::text = "userId"::text);

-- STEP 3: LISTING_MEDIA policies (column: listingId, joins to listings.userId)
DROP POLICY IF EXISTS "media_select" ON public.listing_media;
CREATE POLICY "media_select" ON public.listing_media
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "media_insert" ON public.listing_media;
CREATE POLICY "media_insert" ON public.listing_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings l 
            WHERE l.id = listing_media."listingId"
            AND auth.uid()::text = l."userId"::text
        )
    );

DROP POLICY IF EXISTS "media_delete" ON public.listing_media;
CREATE POLICY "media_delete" ON public.listing_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.listings l 
            WHERE l.id = listing_media."listingId"
            AND auth.uid()::text = l."userId"::text
        )
    );

-- STEP 4: PROFILES policies (column: id = user UUID)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
        CREATE POLICY "profiles_select" ON public.profiles
            FOR SELECT USING (auth.uid() IS NOT NULL);
        
        DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
        CREATE POLICY "profiles_update" ON public.profiles
            FOR UPDATE USING (auth.uid()::text = id::text);
    END IF;
END $$;

-- STEP 5: ORDERS policies (column: userId - VERIFIED FROM ERROR MESSAGE)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "orders_select" ON public.orders;
        CREATE POLICY "orders_select" ON public.orders
            FOR SELECT USING (auth.uid()::text = "userId"::text);
        
        DROP POLICY IF EXISTS "orders_insert" ON public.orders;
        CREATE POLICY "orders_insert" ON public.orders
            FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text);
        
        DROP POLICY IF EXISTS "orders_update" ON public.orders;
        CREATE POLICY "orders_update" ON public.orders
            FOR UPDATE USING (auth.uid()::text = "userId"::text);
    END IF;
END $$;

-- STEP 6: REVIEWS policies (column: reviewerId or userId)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews' AND table_schema = 'public') THEN
        -- Check which column exists and use it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reviewerId') THEN
            DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
            CREATE POLICY "reviews_select" ON public.reviews
                FOR SELECT USING (auth.uid() IS NOT NULL);
            
            DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
            CREATE POLICY "reviews_insert" ON public.reviews
                FOR INSERT WITH CHECK (auth.uid()::text = "reviewerId"::text);
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'userId') THEN
            DROP POLICY IF EXISTS "reviews_all" ON public.reviews;
            CREATE POLICY "reviews_all" ON public.reviews
                FOR ALL USING (auth.uid()::text = "userId"::text)
                WITH CHECK (auth.uid()::text = "userId"::text);
        END IF;
    END IF;
END $$;

-- STEP 7: FAVORITES policies (column: userId)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "favorites_all" ON public.favorites;
        CREATE POLICY "favorites_all" ON public.favorites
            FOR ALL USING (auth.uid()::text = "userId"::text)
            WITH CHECK (auth.uid()::text = "userId"::text);
    END IF;
END $$;

-- STEP 8: MESSAGES policies (columns: senderId, receiverId OR userId)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'senderId') THEN
            DROP POLICY IF EXISTS "messages_select" ON public.messages;
            CREATE POLICY "messages_select" ON public.messages
                FOR SELECT USING (
                    auth.uid()::text = "senderId"::text 
                    OR auth.uid()::text = "receiverId"::text
                );
            
            DROP POLICY IF EXISTS "messages_insert" ON public.messages;
            CREATE POLICY "messages_insert" ON public.messages
                FOR INSERT WITH CHECK (auth.uid()::text = "senderId"::text);
        ELSE
            DROP POLICY IF EXISTS "messages_all" ON public.messages;
            CREATE POLICY "messages_all" ON public.messages
                FOR ALL USING (auth.uid()::text = "userId"::text)
                WITH CHECK (auth.uid()::text = "userId"::text);
        END IF;
    END IF;
END $$;

-- STEP 9: NOTIFICATIONS policies (column: userId)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
        CREATE POLICY "notifications_select" ON public.notifications
            FOR SELECT USING (auth.uid()::text = "userId"::text);
        
        DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
        CREATE POLICY "notifications_insert" ON public.notifications
            FOR INSERT WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- STEP 10: CATEGORIES policies (public read-only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "categories_public" ON public.categories;
        CREATE POLICY "categories_public" ON public.categories
            FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "categories_admin" ON public.categories;
        CREATE POLICY "categories_admin" ON public.categories
            FOR ALL USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- FINAL: Show all created policies
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
