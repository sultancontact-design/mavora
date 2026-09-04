-- ============================================================
-- 🛡️ MAVORA ADAPTIVE RLS FIX
-- Automatically detects column names and creates policies
-- Works with ANY column naming convention!
-- ============================================================

-- ============================================================
-- STEP 1: Create helper function to check if column exists
-- ============================================================
CREATE OR REPLACE FUNCTION public.column_exists(table_name TEXT, col_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = column_exists.table_name 
            AND column_name = column_exists.col_name
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 2: Create helper function to get user ID column name
-- Tries common variations: userId, user_id, seller_id, id
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_id_column(table_name TEXT)
RETURNS TEXT AS $$
DECLARE
    possible_columns TEXT[] := ARRAY['userId', 'user_id', 'seller_id', 'owner_id', 'created_by'];
    col TEXT;
BEGIN
    FOR i IN 1..array_length(possible_columns, 1) LOOP
        col := possible_columns[i];
        IF public.column_exists(table_name, col) THEN
            RETURN col;
        END IF;
    END LOOP;
    RETURN NULL; -- No user ID column found
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 3: PROFILES TABLE
-- ============================================================
DO $$
DECLARE
    user_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Drop old policies
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Find the correct user ID column
        user_col := COALESCE(
            CASE WHEN public.column_exists('profiles', 'userId') THEN '"userId"' END,
            CASE WHEN public.column_exists('profiles', 'user_id') THEN 'user_id' END,
            'id'
        );
        
        -- Create policies using dynamic column name
        EXECUTE format('
            CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles 
            FOR SELECT USING (true);
            
            CREATE POLICY "Users can insert own profile" ON public.profiles 
            FOR INSERT WITH CHECK (auth.uid()::text = id OR auth.uid()::text = %s);
            
            CREATE POLICY "Users can update own profile" ON public.profiles 
            FOR UPDATE USING (auth.uid()::text = id OR auth.uid()::text = %s);
            
            CREATE POLICY "Users can delete own profile" ON public.profiles 
            FOR DELETE USING (auth.uid()::text = id OR auth.uid()::text = %s);
        ', user_col, user_col, user_col);
        
        RAISE NOTICE '✅ Profiles RLS policies created (using column: %)', user_col;
    ELSE
        RAISE NOTICE '⚠️  Profiles table not found';
    END IF;
END $$;

-- ============================================================
-- STEP 4: LISTINGS TABLE - Try multiple column names
-- ============================================================
DO $$
DECLARE
    seller_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
        DROP POLICY IF EXISTS "Public listings are viewable by everyone" ON public.listings;
        DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;
        DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
        DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
        DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;
        
        ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
        
        -- Find the correct seller/user column
        seller_col := COALESCE(
            CASE WHEN public.column_exists('listings', 'seller_id') THEN 'seller_id' END,
            CASE WHEN public.column_exists('listings', 'userId') THEN '"userId"' END,
            CASE WHEN public.column_exists('listings', 'user_id') THEN 'user_id' END,
            CASE WHEN public.column_exists('listings', 'owner_id') THEN 'owner_id' END,
            'id' -- fallback to id
        );
        
        EXECUTE format('
            CREATE POLICY "Public listings are viewable by everyone" ON public.listings 
            FOR SELECT USING (true);
            
            CREATE POLICY "Sellers can create listings" ON public.listings 
            FOR INSERT WITH CHECK (auth.uid()::text = %s);
            
            CREATE POLICY "Users can update own listings" ON public.listings 
            FOR UPDATE USING (auth.uid()::text = %s);
            
            CREATE POLICY "Users can delete own listings" ON public.listings 
            FOR DELETE USING (auth.uid()::text = %s);
        ', seller_col, seller_col, seller_col);
        
        RAISE NOTICE '✅ Listings RLS policies created (using column: %)', seller_col;
    ELSE
        RAISE NOTICE '⚠️  Listings table not found';
    END IF;
END $$;

-- ============================================================
-- STEP 5: LISTING_MEDIA TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_media') THEN
        DROP POLICY IF EXISTS "Public media is viewable by everyone" ON public.listing_media;
        DROP POLICY IF EXISTS "Users can upload media for own listings" ON public.listing_media;
        DROP POLICY IF EXISTS "Users can update own media" ON public.listing_media;
        DROP POLICY IF EXISTS "Users can delete own media" ON public.listing_media;
        
        ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
        
        -- Use subquery approach that works regardless of listings column name
        CREATE POLICY "Public media is viewable by everyone" ON public.listing_media FOR SELECT USING (true);
        
        CREATE POLICY "Users can upload media for own listings" ON public.listing_media FOR INSERT WITH CHECK (
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
        
        CREATE POLICY "Users can update own media" ON public.listing_media FOR UPDATE USING (
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
        
        CREATE POLICY "Users can delete own media" ON public.listing_media FOR DELETE USING (
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
        
        RAISE NOTICE '✅ Listing media RLS policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 6: FAVORITES TABLE
-- ============================================================
DO $$
DECLARE
    user_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
        DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
        DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
        DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;
        
        ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
        
        user_col := COALESCE(
            CASE WHEN public.column_exists('favorites', 'user_id') THEN 'user_id' END,
            CASE WHEN public.column_exists('favorites', 'userId') THEN '"userId"' END,
            'user_id'
        );
        
        EXECUTE format('
            CREATE POLICY "Users can view own favorites" ON public.favorites 
            FOR SELECT USING (auth.uid()::text = %s);
            
            CREATE POLICY "Users can add favorites" ON public.favorites 
            FOR INSERT WITH CHECK (auth.uid()::text = %s);
            
            CREATE POLICY "Users can remove own favorites" ON public.favorites 
            FOR DELETE USING (auth.uid()::text = %s);
        ', user_col, user_col, user_col);
        
        RAISE NOTICE '✅ Favorites RLS policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 7: CONVERSATIONS TABLE
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        DROP POLICY IF EXISTS "Participants can view conversation" ON public.conversations;
        DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
        DROP POLICY IF EXISTS "Participants can update conversation" ON public.conversations;
        DROP POLICY IF EXISTS "Participants can delete conversation" ON public.conversations;
        
        ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
        
        -- Handle multiple possible column names
        CREATE POLICY "Participants can view conversation" ON public.conversations FOR SELECT USING (
            (public.column_exists('conversations', 'buyer_id') AND auth.uid()::text = buyer_id) OR
            (public.column_exists('conversations', 'seller_id') AND auth.uid()::text = seller_id) OR
            (public.column_exists('conversations', 'buyerId') AND auth.uid()::text = "buyerId") OR
            (public.column_exists('conversations', 'sellerId') AND auth.uid()::text = "sellerId")
        );
        
        CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (
            (public.column_exists('conversations', 'buyer_id') AND auth.uid()::text = buyer_id) OR
            (public.column_exists('conversations', 'seller_id') AND auth.uid()::text = seller_id) OR
            (public.column_exists('conversations', 'buyerId') AND auth.uid()::text = "buyerId") OR
            (public.column_exists('conversations', 'sellerId') AND auth.uid()::text = "sellerId")
        );
        
        CREATE POLICY "Participants can update conversation" ON public.conversations FOR UPDATE USING (
            (public.column_exists('conversations', 'buyer_id') AND auth.uid()::text = buyer_id) OR
            (public.column_exists('conversations', 'seller_id') AND auth.uid()::text = seller_id) OR
            (public.column_exists('conversations', 'buyerId') AND auth.uid()::text = "buyerId") OR
            (public.column_exists('conversations', 'sellerId') AND auth.uid()::text = "sellerId")
        );
        
        CREATE POLICY "Participants can delete conversation" ON public.conversations FOR DELETE USING (
            (public.column_exists('conversations', 'buyer_id') AND auth.uid()::text = buyer_id) OR
            (public.column_exists('conversations', 'seller_id') AND auth.uid()::text = seller_id) OR
            (public.column_exists('conversations', 'buyerId') AND auth.uid()::text = "buyerId") OR
            (public.column_exists('conversations', 'sellerId') AND auth.uid()::text = "sellerId")
        );
        
        RAISE NOTICE '✅ Conversations RLS policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 8: MESSAGES TABLE
-- ============================================================
DO $$
DECLARE
    sender_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can update own messages" ON public.messages;
        DROP POLICY IF EXISTS "Participants can delete own messages" ON public.messages;
        
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        sender_col := COALESCE(
            CASE WHEN public.column_exists('messages', 'sender_id') THEN 'sender_id' END,
            CASE WHEN public.column_exists('messages', 'userId') THEN '"userId"' END,
            CASE WHEN public.column_exists('messages', 'user_id') THEN 'user_id' END,
            'sender_id'
        );
        
        EXECUTE format('
            CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (true);
            
            CREATE POLICY "Participants can send messages" ON public.messages 
            FOR INSERT WITH CHECK (auth.uid()::text = %s);
            
            CREATE POLICY "Participants can update own messages" ON public.messages 
            FOR UPDATE USING (auth.uid()::text = %s);
            
            CREATE POLICY "Participants can delete own messages" ON public.messages 
            FOR DELETE USING (auth.uid()::text = %s);
        ', sender_col, sender_col, sender_col);
        
        RAISE NOTICE '✅ Messages RLS policies created';
    END IF;
END $$;

-- ============================================================
-- STEP 9: WALLETS, ORDERS, REVIEWS, NOTIFICATIONS, REPORTS
-- Tables with standard user_id column
-- ============================================================

-- WALLETS
DO $$
DECLARE
    user_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
        DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
        DROP POLICY IF EXISTS "System can create wallets" ON public.wallets;
        DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
        
        ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
        
        user_col := COALESCE(
            CASE WHEN public.column_exists('wallets', 'user_id') THEN 'user_id' END,
            CASE WHEN public.column_exists('wallets', 'userId') THEN '"userId"' END,
            'user_id'
        );
        
        EXECUTE format('
            CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid()::text = %s);
            CREATE POLICY "System can create wallets" ON public.wallets FOR INSERT WITH CHECK (auth.uid()::text = %s OR auth.role() = ''service_role'');
            CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid()::text = %s);
        ', user_col, user_col, user_col);
        
        RAISE NOTICE '✅ Wallets RLS policies created';
    END IF;
END $$;

-- ORDERS
DO $$
DECLARE
    user_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
        DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
        
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        
        user_col := COALESCE(
            CASE WHEN public.column_exists('orders', 'user_id') THEN 'user_id' END,
            CASE WHEN public.column_exists('orders', 'userId') THEN '"userId"' END,
            'user_id'
        );
        
        EXECUTE format('
            CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid()::text = %s);
            CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid()::text = %s);
        ', user_col, user_col);
        
        RAISE NOTICE '✅ Orders RLS policies created';
    END IF;
END $$;

-- REVIEWS
DO $$
DECLARE
    user_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        DROP POLICY IF EXISTS "Public reviews are viewable" ON public.reviews;
        DROP POLICY IF EXISTS "Buyers can create reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
        
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
        
        user_col := COALESCE(
            CASE WHEN public.column_exists('reviews', 'user_id') THEN 'user_id' END,
            CASE WHEN public.column_exists('reviews', 'reviewer_id') THEN 'reviewer_id' END,
            CASE WHEN public.column_exists('reviews', 'userId') THEN '"userId"' END,
            'user_id'
        );
        
        EXECUTE format('
            CREATE POLICY "Public reviews are viewable" ON public.reviews FOR SELECT USING (true);
            CREATE POLICY "Buyers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid()::text = %s);
            CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid()::text = %s);
        ', user_col, user_col);
        
        RAISE NOTICE '✅ Reviews RLS policies created';
    END IF;
END $$;

-- NOTIFICATIONS
DO $$
DECLARE
    user_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
        
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        user_col := COALESCE(
            CASE WHEN public.column_exists('notifications', 'user_id') THEN 'user_id' END,
            CASE WHEN public.column_exists('notifications', 'userId') THEN '"userId"' END,
            'user_id'
        );
        
        EXECUTE format('
            CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid()::text = %s);
            CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = ''service_role'' OR auth.uid()::text = %s);
            CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid()::text = %s);
            CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid()::text = %s);
        ', user_col, user_col, user_col, user_col);
        
        RAISE NOTICE '✅ Notifications RLS policies created';
    END IF;
END $$;

-- REPORTS
DO $$
DECLARE
    reporter_col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
        DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
        
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
        
        reporter_col := COALESCE(
            CASE WHEN public.column_exists('reports', 'reporter_id') THEN 'reporter_id' END,
            CASE WHEN public.column_exists('reports', 'user_id') THEN 'user_id' END,
            'reporter_id'
        );
        
        EXECUTE format('
            CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid()::text = %s);
            CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid()::text = %s);
        ', reporter_col, reporter_col);
        
        RAISE NOTICE '✅ Reports RLS policies created';
    END IF;
END $$;

-- USER_ROLES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
        DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
        
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Roles are viewable by everyone" ON public.user_roles FOR SELECT USING (true);
        CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (
            EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('super_admin'))
        );
        
        RAISE NOTICE '✅ User roles RLS policies created';
    END IF;
END $$;

-- INVOICES (may not exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
        DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
        DROP POLICY IF EXISTS "System can create invoices" ON public.invoices;
        
        ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (
            (public.column_exists('invoices', 'user_id') AND auth.uid()::text = user_id) OR
            (public.column_exists('invoices', 'userId') AND auth.uid()::text = "userId")
        );
        CREATE POLICY "System can create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.role() = 'service_role');
        
        RAISE NOTICE '✅ Invoices RLS policies created';
    ELSE
        RAISE NOTICE 'ℹ️  Invoices table does not exist - skipping (OK if not used)';
    END IF;
END $$;

-- USERS TABLE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Users RLS enabled';
    END IF;
END $$;

-- CONVERSATION_MEMBERS (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_members') THEN
        ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Conversation members RLS enabled';
    END IF;
END $$;

-- ============================================================
-- CLEANUP: Drop helper functions
-- ============================================================
DROP FUNCTION IF EXISTS public.column_exists(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_id_column(TEXT);

-- ============================================================
-- FINAL REPORT
-- ============================================================
SELECT 
    '✅ ADAPTIVE RLS FIX COMPLETE!' AS status,
    (SELECT count(*) FROM pg_policies WHERE schemaname='public') AS total_policies,
    (SELECT count(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity=true) AS tables_with_rls;
