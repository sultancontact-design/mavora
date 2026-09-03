-- ============================================================
-- MAVORA Database Setup Script
-- Creates essential tables for authentication and user management
-- Run this in Supabase SQL Editor or via API
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (Main user profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    country_id UUID,
    city_id UUID,
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'user',
    language VARCHAR(10) DEFAULT 'ar',
    currency VARCHAR(10) DEFAULT 'MAD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================
-- 2. USER_ROLES TABLE (Role-based access control)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles (public info)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can insert/update any profile
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read roles (for public display)
CREATE POLICY "Roles are viewable by everyone" ON public.user_roles
    FOR SELECT USING (true);

-- Policy: Only admins can manage roles
CREATE POLICY "Only admins can manage roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin'))
    );

-- ============================================================
-- 4. AUTO-CREATE PROFILE TRIGGER
-- This trigger automatically creates a profile when a new user signs up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    
    -- Also create default role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. UPDATED_AT TRIGGER FOR PROFILES
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. SAMPLE DATA - CATEGORIES (for the classified ads)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert main categories for Moroccan marketplace
INSERT INTO public.categories (name_ar, name_fr, name_en, slug, icon, sort_order) VALUES
    ('إلكترونيات', 'Électronique', 'Electronics', 'electronics', 'smartphone', 1),
    ('عقارات', 'Immobilier', 'Real Estate', 'real-estate', 'home', 2),
    ('سيارات', 'Véhicules', 'Vehicles', 'vehicles', 'car', 3),
    ('أثاث وديكور', 'Meubles et Décoration', 'Furniture & Decor', 'furniture', 'sofa', 4),
    ('ملابس وإكسسوارات', 'Vêtements et Accessoires', 'Clothing & Accessories', 'clothing', 'shirt', 5),
    ('وظائف وخدمات', 'Emplois et Services', 'Jobs & Services', 'jobs', 'briefcase', 6),
   ('حيوانات أليفة', 'Animaux', 'Pets & Animals', 'animals', 'cat', 7),
    ('تعليم', 'Éducation', 'Education', 'education', 'book-open', 8),
    ('أطفال ورضع', 'Enfants et Bébés', 'Kids & Babies', 'kids', 'baby', 9),
    ('ترفيه وهوايات', 'Loisirs et Passions', 'Entertainment & Hobbies', 'entertainment', 'gamepad-2', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '✅ MAVORA database setup completed successfully!';
    RAISE NOTICE '   - Tables created: profiles, user_roles, categories';
    RAISE NOTICE '   - RLS policies enabled';
    RAISE NOTICE '   - Triggers set up for auto-profile creation';
    RAISE NOTICE '   - Sample categories inserted';
END $$;
