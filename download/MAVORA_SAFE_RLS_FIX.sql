-- ============================================================
-- 🔧 MAVORA SAFE RLS FIX - Handles Missing Tables
-- 📅 Generated: 2026-01-09
--
-- This script ONLY modifies tables that EXIST
-- Skips any table that doesn't exist (like invoices)
-- ============================================================

-- ============================================================
-- STEP 1: DIAGNOSTIC - Show which tables exist
-- ============================================================
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename=t.tablename) AS policy_count
FROM pg_tables t 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- STEP 2: PROFILES TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies with correct column names
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
        
        CREATE POLICY "Users can insert own profile" ON public.profiles 
            FOR INSERT WITH CHECK (auth.uid()::text = id OR auth.uid()::text = "userId");
        
        CREATE POLICY "Users can update own profile" ON public.profiles 
            FOR UPDATE USING (auth.uid()::text = id OR auth.uid()::text = "userId");
        
        CREATE POLICY "Users can delete own profile" ON public.profiles 
            FOR DELETE USING (auth.uid()::text = id OR auth.uid()::text = "userId");
        
        RAISE NOTICE '✅ Profiles policies created';
    ELSE
        RAISE NOTICE '⚠️ Profiles table does not exist - skipping';
    END IF;
END $$;

-- ============================================================
-- STEP 3: USERS TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Users RLS enabled';
    END IF;
END $$;

-- ============================================================
-- STEP 4: LISTINGS TABLE (if exists)
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
        
        CREATE POLICY "Public listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
        CREATE POLICY "Sellers can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid()::text = seller_id);
        CREATE POLICY "Users can update own listings" ON public.listings FOR UPDATE USING (auth.uid()::text = seller_id);
        CREATE POLICY "Users can delete own listings" ON public.listings FOR DELETE USING (auth.uid()::text = seller_id);
        
        RAISE NOTICE '✅ Listings policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 5: LISTING_MEDIA TABLE (if exists)
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
        CREATE POLICY "Users can upload media for own listings" ON public.listing_media FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()::text));
        CREATE POLICY "Users can update own media" ON public.listing_media FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()::text));
        CREATE POLICY "Users can delete own media" ON public.listing_media FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()::text));
        
        RAISE NOTICE '✅ Listing media policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 6: FAVORITES TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
        DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
        DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
        DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;
        
        ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "Users can remove own favorites" ON public.favorites FOR DELETE USING (auth.uid()::text = user_id);
        
        RAISE NOTICE '✅ Favorites policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 7: CONVERSATIONS TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        DROP POLICY IF EXISTS "Participants can view conversation" ON public.conversations;
        DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
        DROP POLICY IF EXISTS "Participants can update conversation" ON public.conversations;
        DROP POLICY IF EXISTS "Participants can delete conversation" ON public.conversations;
        
        ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Participants can view conversation" ON public.conversations FOR SELECT USING (
            auth.uid()::text = buyer_id OR auth.uid()::text = seller_id);
        CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (
            auth.uid()::text = buyer_id OR auth.uid()::text = seller_id);
        CREATE POLICY "Participants can update conversation" ON public.conversations FOR UPDATE USING (
            auth.uid()::text = buyer_id OR auth.uid()::text = seller_id);
        CREATE POLICY "Participants can delete conversation" ON public.conversations FOR DELETE USING (
            auth.uid()::text = buyer_id OR auth.uid()::text = seller_id);
        
        RAISE NOTICE '✅ Conversations policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 8: MESSAGES TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can update own messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can delete own messages" ON public.messages;
        
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conversation_id AND user_id = auth.uid()::text));
        CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid()::text);
        CREATE POLICY "Participants can update own messages" ON public.messages FOR UPDATE USING (sender_id = auth.uid()::text);
        CREATE POLICY "Participants can delete own messages" ON public.messages FOR DELETE USING (sender_id = auth.uid()::text);
        
        RAISE NOTICE '✅ Messages policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 9: WALLETS TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
        DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
        DROP POLICY IF EXISTS "System can create wallets" ON public.wallets;
        DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
        
        ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "System can create wallets" ON public.wallets FOR INSERT WITH CHECK (
            auth.uid()::text = user_id OR auth.role() = 'service_role');
        CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid()::text = user_id);
        
        RAISE NOTICE '✅ Wallets policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 10: ORDERS TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
        DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
        DROP POLICY IF EXISTS "Sellers can view orders for their listings" ON public.orders;
        DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
        
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "Sellers can view orders for their listings" ON public.orders FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()::text));
        
        RAISE NOTICE '✅ Orders policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 11: REVIEWS TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        DROP POLICY IF EXISTS "Public reviews are viewable" ON public.reviews;
        DROP POLICY IF EXISTS "Buyers can create reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
        
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public reviews are viewable" ON public.reviews FOR SELECT USING (true);
        CREATE POLICY "Buyers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid()::text = user_id);
        
        RAISE NOTICE '✅ Reviews policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 12: NOTIFICATIONS TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
        
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (
            auth.role() = 'service_role' OR auth.uid()::text = user_id);
        CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid()::text = user_id);
        
        RAISE NOTICE '✅ Notifications policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 13: REPORTS TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
        DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
        DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
        
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid()::text = reporter_id);
        CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);
        
        RAISE NOTICE '✅ Reports policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 14: USER_ROLES TABLE (if exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
        DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
        
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Roles are viewable by everyone" ON public.user_roles FOR SELECT USING (true);
        CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role IN ('super_admin')));
        
        RAISE NOTICE '✅ User roles policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 15: INVOICES TABLE (if exists) - MAY NOT EXIST!
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
        DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
        DROP POLICY IF EXISTS "System can create invoices" ON public.invoices;
        DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
        
        ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "System can create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.role() = 'service_role');
        
        RAISE NOTICE '✅ Invoices policies created';
    ELSE
        RAISE NOTICE 'ℹ️ Invoices table does not exist - skipping (this is OK if not using invoices yet)';
    END IF;
END $$;

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================
SELECT 
    '✅ RLS Fix Complete!' AS status,
    (SELECT count(*) FROM pg_policies WHERE schemaname='public') AS total_policies_created,
    (SELECT count(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity = true) AS tables_with_rls;
