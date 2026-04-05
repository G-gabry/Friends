-- ==========================================
-- FIX PERMISSIONS SCRIPT
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Fix RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON public.products;
CREATE POLICY "Products are viewable by authenticated users" ON public.products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
CREATE POLICY "Authenticated can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
CREATE POLICY "Authenticated can update products" ON public.products FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can delete products" ON public.products;
CREATE POLICY "Authenticated can delete products" ON public.products FOR DELETE TO authenticated USING (true);


-- 2. Fix RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON public.categories;
CREATE POLICY "Categories are viewable by authenticated users" ON public.categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (true);


-- 3. Fix RLS for profiles (users)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
