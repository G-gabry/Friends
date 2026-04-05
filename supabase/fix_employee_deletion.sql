-- ============================================================
-- Fix: Employee Management Roles & Deletion Support
-- ============================================================
-- This script performs two critical fixes:
-- 1. Standardizes roles to ('admin', 'employee') only.
-- 2. Allows deleting employees who have existing orders by setting 
--    the 'user_id' in orders to NULL (preserving historical data).

-- 1. Fix Profiles Table Roles
-- Ensure only 'admin' and 'employee' are allowed
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'employee'));

-- 2. Fix Orders Table Deletion
-- Drop the existing strict foreign key constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Make the user_id column nullable so it can hold NULL 
-- (currently it is NOT NULL in many POS schemas)
ALTER TABLE public.orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Re-add the foreign key with ON DELETE SET NULL behavior
ALTER TABLE public.orders
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 3. Verify Categories and Products Ownership (Optional but safe)
-- These are usually already SET NULL but we ensure it here
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_owner_id_fkey;
ALTER TABLE public.categories ADD CONSTRAINT categories_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_owner_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
