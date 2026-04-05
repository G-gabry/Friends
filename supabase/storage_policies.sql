-- ==========================================
-- STORAGE PERMISSIONS SCRIPT
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Note: RLS is already enabled by default on storage.objects

-- 0. Check and Create the Bucket automatically
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Allow public Read Access (so images can be viewed in the UI)
DROP POLICY IF EXISTS "Public can view item images" ON storage.objects;
CREATE POLICY "Public can view item images" 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'item-images' );

-- 2. Allow authenticated users to Insert/Upload
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
CREATE POLICY "Authenticated users can upload item images" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK ( bucket_id = 'item-images' );

-- 3. Allow authenticated users to Update/Replace images
DROP POLICY IF EXISTS "Authenticated users can update item images" ON storage.objects;
CREATE POLICY "Authenticated users can update item images" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING ( bucket_id = 'item-images' );

-- 4. Allow authenticated users to Delete images
DROP POLICY IF EXISTS "Authenticated users can delete item images" ON storage.objects;
CREATE POLICY "Authenticated users can delete item images" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING ( bucket_id = 'item-images' );
