-- ============================================================
-- FIX UUID = TEXT TYPE MISMATCH IN RLS POLICIES
-- Problem: auth.uid() returns UUID but columns are TEXT
-- Solution: Cast auth.uid() to text in all policies
-- ============================================================

-- Drop existing policies first (they have type mismatch)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Re-create profiles policies with proper type casting
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id OR auth.uid()::text = userId);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = id OR auth.uid()::text = userId);

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid()::text = id OR auth.uid()::text = userId);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- Re-create user_roles policies with proper type casting
CREATE POLICY "Roles are viewable by everyone" ON public.user_roles
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role IN ('super_admin'))
    );

-- ============================================================
-- FIX LISTINGS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public listings are viewable by everyone" ON public.listings;
DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;

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
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- ============================================================
-- FIX LISTING_MEDIA RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public media is viewable by everyone" ON public.listing_media;
DROP POLICY IF EXISTS "Users can upload media for own listings" ON public.listing_media;
DROP POLICY IF EXISTS "Users can update own media" ON public.listing_media;
DROP POLICY IF EXISTS "Users can delete own media" ON public.listing_media;

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

-- ============================================================
-- FIX FAVORITES RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;

CREATE POLICY "Users can view own favorites" ON public.favorites
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can add favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can remove own favorites" ON public.favorites
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- FIX CONVERSATIONS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Participants can view conversation" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversation" ON public.conversations;
DROP POLICY IF EXISTS "Participants can delete conversation" ON public.conversations;

CREATE POLICY "Participants can view conversation" ON public.conversations
    FOR SELECT USING (
        auth.uid()::text = buyer_id OR 
        auth.uid()::text = seller_id OR
        EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND user_id = auth.uid()::text)
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

-- ============================================================
-- FIX MESSAGES RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can delete own messages" ON public.messages;

CREATE POLICY "Participants can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conversation_id AND user_id = auth.uid()::text)
    );

CREATE POLICY "Participants can send messages" ON public.messages
    FOR INSERT WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "Participants can update own messages" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid()::text);

CREATE POLICY "Participants can delete own messages" ON public.messages
    FOR DELETE USING (sender_id = auth.uid()::text);

-- ============================================================
-- FIX WALLETS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "System can create wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create wallets" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid()::text = user_id);

-- ============================================================
-- FIX ORDERS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their listings" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

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
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- ============================================================
-- FIX REVIEWS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public reviews are viewable" ON public.reviews;
DROP POLICY IF EXISTS "Buyers can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;

CREATE POLICY "Public reviews are viewable" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- ============================================================
-- FIX NOTIFICATIONS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid()::text = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- FIX REPORTS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;

CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (auth.uid()::text = reporter_id);

CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);

CREATE POLICY "Admins can manage reports" ON public.reports
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- ============================================================
-- FIX INVOICES RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "System can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role IN ('admin', 'super_admin'))
    );

-- ============================================================
-- ENSURE RLS IS ENABLED ON ALL TABLES
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

-- Success message
SELECT 'RLS policies fixed successfully! All UUID comparisons now use ::text cast.' AS result;
