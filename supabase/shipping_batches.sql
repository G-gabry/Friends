-- ==========================================
-- PHASE 2: SHIPPING BATCHES AND DELIVERY STATUS
-- ==========================================

-- 1. Create the shipment_batches table
CREATE TABLE IF NOT EXISTS public.shipment_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipping_company TEXT NOT NULL,
    date DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modify the orders table to include delivery tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.shipment_batches(id),
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'partially_delivered', 'not_delivered', 'returned'));

-- 3. We must add "in_delivery" to the orders.status ENUM constraint
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
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'in_delivery', 'shipped', 'delivered', 'cancelled', 'returned'));


-- 4. Create an RPC to cleanly update delivery status AND handle automatic inventory restoration
CREATE OR REPLACE FUNCTION public.update_order_delivery_status(
    p_order_id bigint,
    p_delivery_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_delivery_status text;
    item record;
BEGIN
    -- Get current delivery status to avoid duplicate returns
    SELECT delivery_status INTO v_old_delivery_status
    FROM public.orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- If status is already returned, do not restore stock again
    IF p_delivery_status = 'returned' AND v_old_delivery_status <> 'returned' THEN
        -- Loop through order items and restore stock
        FOR item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
            IF item.product_id IS NOT NULL THEN
                UPDATE public.products
                SET stock_quantity = stock_quantity + item.quantity
                WHERE id = item.product_id;
            END IF;
        END LOOP;
    END IF;
    
    -- If status moves FROM returned to something else, we arguably should decrement stock again.
    -- However, practically returns are final. If they reverse it accidentally, we handle it:
    IF v_old_delivery_status = 'returned' AND p_delivery_status <> 'returned' THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
            IF item.product_id IS NOT NULL THEN
                UPDATE public.products
                SET stock_quantity = stock_quantity - item.quantity
                WHERE id = item.product_id;
            END IF;
        END LOOP;
    END IF;

    -- Update the order delivery status
    UPDATE public.orders 
    SET delivery_status = p_delivery_status 
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
