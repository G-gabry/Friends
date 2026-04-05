-- ============================================================
-- PATCH: Upgrade Orders table for Confirmation Workflow
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Update the status Check Constraint dynamically
DO $$ 
DECLARE 
  r record;
BEGIN 
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.orders'::regclass 
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%status%'
  ) LOOP 
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || r.conname; 
  END LOOP; 
END $$;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned'));

-- 2. Create the update_existing_order RPC to safely sync inventory
CREATE OR REPLACE FUNCTION public.update_existing_order(
  p_order_id  bigint,
  p_order_data  jsonb,
  p_items_data  jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_item     record;
  new_item     jsonb;
  stock_check  integer;
BEGIN
  -- 1. Restore Stock for Old Items
  FOR old_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
    IF old_item.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock_quantity = stock_quantity + old_item.quantity
      WHERE id = old_item.product_id;
    END IF;
  END LOOP;

  -- 2. Delete Old Order Items
  DELETE FROM public.order_items WHERE order_id = p_order_id;

  -- 3. Validate Stock & Deduct for New Items
  FOR new_item IN SELECT * FROM jsonb_array_elements(p_items_data) LOOP
    IF (new_item ->> 'product_id') IS NOT NULL THEN
      SELECT stock_quantity INTO stock_check
      FROM public.products
      WHERE id = (new_item ->> 'product_id')::bigint;

      IF stock_check IS NULL THEN
        RAISE EXCEPTION 'Product ID % not found', new_item ->> 'product_id';
      END IF;

      IF stock_check < (new_item ->> 'quantity')::integer THEN
        RAISE EXCEPTION 'Insufficient stock for product "%" (Requested: %)', new_item ->> 'name', new_item ->> 'quantity';
      END IF;

      -- Deduct stock
      UPDATE public.products
      SET stock_quantity = stock_quantity - (new_item ->> 'quantity')::integer
      WHERE id = (new_item ->> 'product_id')::bigint;
    END IF;
  END LOOP;

  -- 4. Insert New Order Items
  FOR new_item IN SELECT * FROM jsonb_array_elements(p_items_data) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, name, size, color,
      quantity, unit_price, image_url
    ) VALUES (
      p_order_id,
      (new_item ->> 'product_id')::bigint,
      new_item ->> 'name',
      new_item ->> 'size',
      new_item ->> 'color',
      (new_item ->> 'quantity')::integer,
      (new_item ->> 'unit_price')::numeric,
      new_item ->> 'image_url'
    );
  END LOOP;

  -- 5. Update Order Master Record
  UPDATE public.orders
  SET 
    customer_name = COALESCE(p_order_data ->> 'customer_name', customer_name),
    customer_phone = COALESCE(p_order_data ->> 'customer_phone', customer_phone),
    customer_address = COALESCE(p_order_data ->> 'customer_address', customer_address),
    total_price = COALESCE((p_order_data ->> 'total_price')::numeric, total_price),
    status = COALESCE(p_order_data ->> 'status', status)
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;
