-- ===========================================
-- MAVORA - CRITICAL RLS FIX SCRIPT
-- ===========================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql
--
-- This script enables PUBLIC READ access for essential tables
-- while keeping WRITE operations protected

-- ===========================================
-- 1. LISTINGS TABLE (Most Critical)
-- ===========================================
-- Enable public SELECT so anyone can view listings
DROP POLICY IF EXISTS "Allow public select" ON listings;
CREATE POLICY "Allow public select" ON listings 
  FOR SELECT 
  USING (status = 'active');

-- Allow authenticated users to create listings
DROP POLICY IF EXISTS "Users can insert listings" ON listings;
CREATE POLICY "Users can insert listings" ON listings 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow sellers to update their own listings
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings" ON listings 
  FOR UPDATE 
  USING (auth.uid() = seller_id);

-- ===========================================
-- 2. CATEGORIES TABLE (Critical for UI)
-- ===========================================
-- Enable public SELECT for categories
DROP POLICY IF EXISTS "Allow public select" ON categories;
CREATE POLICY "Allow public select" ON categories 
  FOR SELECT 
  USING (true);

-- ===========================================
-- 3. PROFILES TABLE (For seller info)
-- ===========================================
-- Enable public SELECT for profiles
DROP POLICY IF EXISTS "Allow public select" ON profiles;
CREATE POLICY "Allow public select" ON profiles 
  FOR SELECT 
  USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- ===========================================
-- 4. CITIES TABLE (For location dropdown)
-- ===========================================
-- Enable public SELECT for cities
DROP POLICY IF EXISTS "Allow public select" ON cities;
CREATE POLICY "Allow public select" ON cities 
  FOR SELECT 
  USING (true);

-- ===========================================
-- 5. REVIEWS TABLE (For listing reviews)
-- ===========================================
-- Enable public SELECT for reviews
DROP POLICY IF EXISTS "Allow public select" ON reviews;
CREATE POLICY "Allow public select" ON reviews 
  FOR SELECT 
  USING (true);

-- Authenticated users can create reviews
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews" ON reviews 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===========================================
-- 6. CONVERSATIONS TABLE (Chat)
-- ===================================
-- Participants can read their conversations
DROP POLICY IF EXISTS "Participants can select conversations" ON conversations;
CREATE POLICY "Participants can select conversations" ON conversations 
  FOR SELECT 
  USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id
  );

-- Authenticated users can create conversations
DROP POLICY IF EXISTS "Authenticated users can insert conversations" ON conversations;
CREATE POLICY "Authenticated users can insert conversations" ON conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ===========================================
-- 7. MESSAGES TABLE (Chat)
-- ===========================================
-- Participants can read messages in their conversations
DROP POLICY IF EXISTS "Participants can select messages" ON messages;
CREATE POLICY "Participants can select messages" ON messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Participants can insert messages
DROP POLICY IF EXISTS "Participants can insert messages" ON messages;
CREATE POLICY "Participants can insert messages" ON messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- ===========================================
-- 8. FAVORITES TABLE
-- ===========================================
-- Users can see their own favorites
DROP POLICY IF EXISTS "Users can select own favorites" ON favorites;
CREATE POLICY "Users can select own favorites" ON favorites 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can manage their own favorites
DROP POLICY IF EXISTS "Users can insert favorites" ON favorites;
CREATE POLICY "Users can insert favorites" ON favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites" ON favorites 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ===========================================
-- 9. TRANSACTIONS TABLE (Payments)
-- ===========================================
-- Users can see their own transactions
DROP POLICY IF EXISTS "Users can select own transactions" ON transactions;
CREATE POLICY "Users can select own transactions" ON transactions 
  FOR SELECT 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ===========================================
-- 10. NOTIFICATIONS TABLE
-- ===========================================
-- Users can see their own notifications
DROP POLICY IF EXISTS "Users can select own notifications" ON notifications;
CREATE POLICY "Users can select own notifications" ON notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================
-- Run these after applying policies to verify:

-- Check if public can now access listings:
-- SELECT count(*) FROM listings;

-- Check if public can access categories:
-- SELECT count(*) FROM categories;

-- Check RLS status on key tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('listings', 'categories', 'profiles', 'cities');

-- List all policies:
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';
