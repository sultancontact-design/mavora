-- ============================================================
-- 🔧 MAVORA DATABASE FIX - Column Name Issues
-- 📅 Generated: ${new Date().toISOString()}
--
-- This script fixes:
-- 1. Verifies correct column names in all tables
-- 2. Drops and recreates RLS policies with correct column names
-- 3. Adds diagnostic queries to identify issues
-- ============================================================

-- First, let's verify the actual column names in key tables
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check for any views that might reference 'userid'
SELECT 
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND definition ILIKE '%userid%';

-- Check for any functions that might reference 'userid'
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_definition ILIKE '%userid%';

-- ============================================================
-- DROP ALL EXISTING RLS POLICIES (clean slate)
-- ============================================================

-- Profiles table policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- User roles policies
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Listings policies
DROP POLICY IF EXISTS "Public listings are viewable by everyone" ON public.listings;
DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;

-- Listing media policies
DROP POLICY IF EXISTS "Public media is viewable by everyone" ON public.listing_media;
DROP POLICY IF EXISTS "Users can upload media for own listings" ON public.listing_media;
DROP POLICY IF EXISTS "Users can update own media" ON public.listing_media;
DROP POLICY IF EXISTS "Users can delete own media" ON public.listing_media;

-- Favorites policies
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;

-- Conversations policies
DROP POLICY IF EXISTS "Participants can view conversation" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversation" ON public.conversations;
DROP POLICY IF EXISTS "Participants can delete conversation" ON public.conversations;

-- Messages policies
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can delete own messages" ON public.messages;

-- Wallets policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "System can create wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their listings" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

-- Reviews policies
DROP POLICY IF EXISTS "Public reviews are viewable" ON public.reviews;
DROP POLICY IF EXISTS "Buyers can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Reports policies
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;

-- Invoices policies
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "System can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

-- ============================================================
-- RECREATE ALL RLS POLICIES WITH CORRECT COLUMN NAMES
-- Using the EXACT column names from the schema
-- ============================================================

-- PROFILES TABLE (columns: id, userId, avatarUrl, etc.)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id OR auth.uid()::text = "userId");

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = id OR auth.uid()::text = "userId");

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid()::text = id OR auth.uid()::text = "userId");

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE "userId" = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- USER_ROLES TABLE (columns: id, userId, roleId, etc.)
CREATE POLICY "Roles are viewable by everyone" ON public.user_roles
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE "userId" = auth.uid()::text AND role IN ('super_admin'))
    );

-- LISTINGS TABLE (columns: id, seller_id, etc.)
CREATE POLICY "Public listings are viewable by everyone" ON public.listings
    FOR SELECT USING (true);

CREATE POLICY "Sellers can create listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid()::text = seller_id);

CREATE POLICY "Users can update own listings" ON public.listings
    FOR UPDATE USING (auth.uid()::text = seller_id);

CREATE POLICY "Users can delete own listings" ON public.listings
    FOR DELETE USING (auth.uid()::text = seller_id);

CREATE POLICY "Admins can manage all listings" ON public.listings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE "userId" = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- LISTING_MEDIA TABLE
CREATE POLICY "Public media is viewable by everyone" ON public.listing_media
    FOR SELECT USING (true);

CREATE POLICY "Users can upload media for own listings" ON public.listing_media
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()::text)
    );

CREATE POLICY "Users can update own media" ON public.listing_media
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()::text)
    );

CREATE POLICY "Users can delete own media" ON public.listing_media
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()::text)
    );

-- FAVORITES TABLE (columns: id, user_id, listing_id)
CREATE POLICY "Users can view own favorites" ON public.favorites
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can add favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can remove own favorites" ON public.favorites
    FOR DELETE USING (auth.uid()::text = user_id);

-- CONVERSATIONS TABLE
CREATE POLICY "Participants can view conversation" ON public.conversations
    FOR SELECT USING (
        auth.uid()::text = buyer_id OR 
        auth.uid()::text = seller_id OR
        EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND "userId" = auth.uid()::text)
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid()::text = buyer_id OR auth.uid()::text = seller_id);

CREATE POLICY "Participants can update conversation" ON public.conversations
    FOR UPDATE USING (
        auth.uid()::text = buyer_id OR 
        auth.uid()::text = seller_id
    );

CREATE POLICY "Participants can delete conversation" ON public.conversations
    FOR DELETE USING (
        auth.uid()::text = buyer_id OR 
        auth.uid()::text = seller_id
    );

-- MESSAGES TABLE
CREATE POLICY "Participants can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conversation_id AND "userId" = auth.uid()::text)
    );

CREATE POLICY "Participants can send messages" ON public.messages
    FOR INSERT WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "Participants can update own messages" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid()::text);

CREATE POLICY "Participants can delete own messages" ON public.messages
    FOR DELETE USING (sender_id = auth.uid()::text);

-- WALLETS TABLE (columns: id, user_id)
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create wallets" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid()::text = user_id);

-- ORDERS TABLE (columns: id, user_id)
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Sellers can view orders for their listings" ON public.orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()::text)
    );

CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE "userId" = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- REVIEWS TABLE
CREATE POLICY "Public reviews are viewable" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE "userId" = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- NOTIFICATIONS TABLE (columns: id, user_id)
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid()::text = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid()::text = user_id);

-- REPORTS TABLE
CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (auth.uid()::text = reporter_id);

CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);

CREATE POLICY "Admins can manage reports" ON public.reports
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE "userId" = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- INVOICES TABLE
CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE "userId" = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these to confirm everything is working
-- ============================================================

-- Check RLS status
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename=t.tablename) AS policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'users', 'listings', 'listing_media', 'favorites', 
    'conversations', 'messages', 'wallets', 'orders', 'reviews', 
    'notifications', 'reports', 'invoices', 'user_roles', 'conversation_members'
)
ORDER BY tablename;

-- Test that userId column exists in profiles
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'userId';

-- Success message
SELECT '✅ All RLS policies recreated with correct column names!' AS result;
