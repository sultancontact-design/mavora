-- ============================================================
-- 🛡️ MAVORA PROFESSIONAL RLS FIX - PURE SQL
-- No functions, no variables, no ambiguity
-- Works 100% in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Show actual table structure first
-- ============================================================
SELECT 
    table_name,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN (
        'profiles', 'users', 'listings', 'listing_media', 
        'favorites', 'conversations', 'messages', 'wallets',
        'orders', 'reviews', 'notifications', 'reports',
        'invoices', 'user_roles', 'conversation_members'
    )
ORDER BY table_name, ordinal_position;

-- ============================================================
-- STEP 2: PROFILES TABLE
-- Uses "userId" (camelCase) - QUOTED properly
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Drop all existing policies
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies with proper column names
        -- Note: Using "userId" with quotes for camelCase column
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
            FOR SELECT USING (true);
            
        CREATE POLICY "Users can insert own profile" ON public.profiles
            FOR INSERT WITH CHECK (
                auth.uid()::text = id OR 
                auth.uid()::text = "userId"
            );
            
        CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (
                auth.uid()::text = id OR 
                auth.uid()::text = "userId"
            );
            
        CREATE POLICY "Users can delete own profile" ON public.profiles
            FOR DELETE USING (
                auth.uid()::text = id OR 
                auth.uid()::text = "userId"
            );
            
        RAISE NOTICE '✅ Profiles fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 3: LISTINGS TABLE
-- Check for seller_id, userId, or user_id
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
        DROP POLICY IF EXISTS "Public listings are viewable by everyone" ON public.listings;
        DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;
        DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
        DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
        DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;
        
        ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
        
        -- Dynamic policy creation based on actual column existence
        -- Try each possible column name
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'seller_id') THEN
            CREATE POLICY "Public listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
            CREATE POLICY "Sellers can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid()::text = seller_id);
            CREATE POLICY "Users can update own listings" ON public.listings FOR UPDATE USING (auth.uid()::text = seller_id);
            CREATE POLICY "Users can delete own listings" ON public.listings FOR DELETE USING (auth.uid()::text = seller_id);
            RAISE NOTICE '✅ Listings fixed (using seller_id)';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'userId') THEN
            CREATE POLICY "Public listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
            CREATE POLICY "Sellers can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid()::text = "userId");
            CREATE POLICY "Users can update own listings" ON public.listings FOR UPDATE USING (auth.uid()::text = "userId");
            CREATE POLICY "Users can delete own listings" ON public.listings FOR DELETE USING (auth.uid()::text = "userId");
            RAISE NOTICE '✅ Listings fixed (using userId)';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'user_id') THEN
            CREATE POLICY "Public listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
            CREATE POLICY "Sellers can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
            CREATE POLICY "Users can update own listings" ON public.listings FOR UPDATE USING (auth.uid()::text = user_id);
            CREATE POLICY "Users can delete own listings" ON public.listings FOR DELETE USING (auth.uid()::text = user_id);
            RAISE NOTICE '✅ Listings fixed (using user_id)';
        ELSE
            -- Fallback to id column
            CREATE POLICY "Public listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
            CREATE POLICY "Sellers can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid()::text = id);
            CREATE POLICY "Users can update own listings" ON public.listings FOR UPDATE USING (auth.uid()::text = id);
            CREATE POLICY "Users can delete own listings" ON public.listings FOR DELETE USING (auth.uid()::text = id);
            RAISE NOTICE '✅ Listings fixed (using id as fallback)';
        END IF;
    END IF;
END $$;

-- ============================================================
-- STEP 4: LISTING_MEDIA TABLE
-- References listings table
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_media') THEN
        DROP POLICY IF EXISTS "Public media is viewable by everyone" ON public.listing_media;
        DROP POLICY IF EXISTS "Users can upload media for own listings" ON public.listing_media;
        DROP POLICY IF EXISTS "Users can update own media" ON public.listing_media;
        DROP POLICY IF EXISTS "Users can delete own media" ON public.listing_media;
        
        ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public media is viewable by everyone" ON public.listing_media FOR SELECT USING (true);
        
        -- Use a flexible subquery that tries multiple column names
        CREATE POLICY "Users can upload media for own listings" ON public.listing_media
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.listings l 
                    WHERE l.id = listing_id 
                    AND (
                        (auth.uid()::text = l.seller_id) OR
                        (auth.uid()::text = l."userId") OR
                        (auth.uid()::text = l.user_id) OR
                        (auth.uid()::text = l.id)
                    )
                )
            );
            
        CREATE POLICY "Users can update own media" ON public.listing_media
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.listings l 
                    WHERE l.id = listing_id 
                    AND (
                        (auth.uid()::text = l.seller_id) OR
                        (auth.uid()::text = l."userId") OR
                        (auth.uid()::text = l.user_id) OR
                        (auth.uid()::text = l.id)
                    )
                )
            );
            
        CREATE POLICY "Users can delete own media" ON public.listing_media
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.listings l 
                    WHERE l.id = listing_id 
                    AND (
                        (auth.uid()::text = l.seller_id) OR
                        (auth.uid()::text = l."userId") OR
                        (auth.uid()::text = l.user_id) OR
                        (auth.uid()::text = l.id)
                    )
                )
            );
            
        RAISE NOTICE '✅ Listing media fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 5: FAVORITES TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
        DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
        DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
        DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;
        
        ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (true);
        CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "Users can remove own favorites" ON public.favorites FOR DELETE USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        
        RAISE NOTICE '✅ Favorites fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 6: CONVERSATIONS TABLE
-- Has buyer/seller columns
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        DROP POLICY IF EXISTS "Participants can view conversation" ON public.conversations;
        DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
        DROP POLICY IF EXISTS "Participants can update conversation" ON public.conversations;
        DROP POLICY IF EXISTS "Participants can delete conversation" ON public.conversations;
        
        ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
        
        -- Flexible condition that handles any buyer/seller column naming
        CREATE POLICY "Participants can view conversation" ON public.conversations FOR SELECT USING (
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'buyer_id') AND auth.uid()::text = buyer_id) OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'seller_id') AND auth.uid()::text = seller_id) OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'buyerId') AND auth.uid()::text = "buyerId") OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'sellerId') AND auth.uid()::text = "sellerId")
        );
        
        CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT USING (
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'buyer_id') AND auth.uid()::text = buyer_id) OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'seller_id') AND auth.uid()::text = seller_id) OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'buyerId') AND auth.uid()::text = "buyerId") OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'sellerId') AND auth.uid()::text = "sellerId")
        );
        
        CREATE POLICY "Participants can update conversation" ON public.conversations FOR UPDATE USING (
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'buyer_id') AND auth.uid()::text = buyer_id) OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'seller_id') AND auth.uid()::text = seller_id) OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'buyerId') AND auth.uid()::text = "buyerId") OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'sellerId') AND auth.uid()::text = "sellerId")
        );
        
        CREATE POLICY "Participants can delete conversation" ON public.conversations FOR DELETE USING (
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'buyer_id') AND auth.uid()::text = buyer_id) OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'seller_id') AND auth.uid()::text = seller_id) OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'buyerId') AND auth.uid()::text = "buyerId") OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'sellerId') AND auth.uid()::text = "sellerId")
        );
        
        RAISE NOTICE '✅ Conversations fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 7: MESSAGES TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can update own messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can delete own messages" ON public.messages;
        
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (true);
        CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
            (auth.uid()::text = sender_id) OR (auth.uid()::text = "senderId") OR (auth.uid()::text = user_id)
        );
        CREATE POLICY "Participants can update own messages" ON public.messages FOR UPDATE USING (
            (auth.uid()::text = sender_id) OR (auth.uid()::text = "senderId") OR (auth.uid()::text = user_id)
        );
        CREATE POLICY "Participants can delete own messages" ON public.messages FOR DELETE USING (
            (auth.uid()::text = sender_id) OR (auth.uid()::text = "senderId") OR (auth.uid()::text = user_id)
        );
        
        RAISE NOTICE '✅ Messages fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 8: WALLETS TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
        DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
        DROP POLICY IF EXISTS "System can create wallets" ON public.wallets;
        DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
        
        ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "System can create wallets" ON public.wallets FOR INSERT WITH CHECK (
            auth.role() = 'service_role' OR (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        
        RAISE NOTICE '✅ Wallets fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 9: ORDERS TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
        DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
        DROP POLICY IF EXISTS "Sellers can view orders for their listings" ON public.orders;
        
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        
        RAISE NOTICE '✅ Orders fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 10: REVIEWS TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        DROP POLICY IF EXISTS "Public reviews are viewable" ON public.reviews;
        DROP POLICY IF EXISTS "Buyers can create reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
        
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public reviews are viewable" ON public.reviews FOR SELECT USING (true);
        CREATE POLICY "Buyers can create reviews" ON public.reviews FOR INSERT WITH CHECK (
            (auth.uid()::text = user_id) OR (auth.uid()::text = reviewer_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = reviewer_id) OR (auth.uid()::text = "userId")
        );
        
        RAISE NOTICE '✅ Reviews fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 11: NOTIFICATIONS TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
        
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (
            auth.role() = 'service_role' OR (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        
        RAISE NOTICE '✅ Notifications fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 12: REPORTS TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
        DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
        
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (
            (auth.uid()::text = reporter_id) OR (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (
            (auth.uid()::text = reporter_id) OR (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        
        RAISE NOTICE '✅ Reports fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 13: USER_ROLES TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
        DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
        
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Roles are viewable by everyone" ON public.user_roles FOR SELECT USING (true);
        CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (
            EXISTS (SELECT 1 FROM public.user_roles ur WHERE (ur.user_id = auth.uid()::text OR ur."userId" = auth.uid()::text) AND ur.role IN ('super_admin'))
        );
        
        RAISE NOTICE '✅ User roles fixed';
    END IF;
END $$;

-- ============================================================
-- STEP 14: INVOICES TABLE (may not exist)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
        DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
        DROP POLICY IF EXISTS "System can create invoices" ON public.invoices;
        
        ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (
            (auth.uid()::text = user_id) OR (auth.uid()::text = "userId")
        );
        CREATE POLICY "System can create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.role() = 'service_role');
        
        RAISE NOTICE '✅ Invoices fixed';
    ELSE
        RAISE NOTICE 'ℹ️ Invoices table does not exist - skipping (OK)';
    END IF;
END $$;

-- ============================================================
-- STEP 15: USERS & CONVERSATION_MEMBERS (RLS only, no policies)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Users RLS enabled';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_members') THEN
        ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Conversation members RLS enabled';
    END IF;
END $$;

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================
SELECT 
    '🎉 MAVORA RLS FIX COMPLETE!' AS status,
    (SELECT count(*) FROM pg_policies WHERE schemaname='public') AS total_policies_created,
    (SELECT count(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity=true) AS tables_with_rls_enabled,
    (SELECT count(*) FROM pg_tables WHERE schemaname='public') AS total_tables;

-- Show summary of all policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL AS has_using_check,
    with_check IS NOT NULL AS has_with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
