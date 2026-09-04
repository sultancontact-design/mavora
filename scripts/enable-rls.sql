-- ============================================================
-- Enable Row Level Security (RLS) on Mavora tables
-- This fixes the security vulnerability where anonymous users
-- could modify other users' profile data
-- ============================================================

-- 1. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create policy: Users can read all profiles (public info)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 3. Create policy: Users can update their own profile only
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id OR auth.uid() = userId);

-- 4. Create policy: Users can insert their own profile only
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = userId);

-- 5. Enable RLS on users table (if it exists and needs protection)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'users', 'listings');
