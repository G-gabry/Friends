-- ============================================================
-- Fulfillment Delivery Upgrade Update
-- ============================================================

-- 1. Add fields to order_items to track delivery
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS delivered_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS returned_quantity INTEGER DEFAULT 0;

-- 2. Backfill delivered_quantity to match quantity (so existing stats don't break)
UPDATE public.order_items SET delivered_quantity = quantity WHERE delivered_quantity = 0 AND returned_quantity = 0;

-- 3. Create RPC for atomic delivery status updates
CREATE OR REPLACE FUNCTION public.update_order_delivery_with_items(
    p_order_id bigint,
    p_delivery_status text,
    p_items_json jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_delivery_status text;
    v_item record;
    v_input_item jsonb;
    v_new_returned_qty integer;
    v_new_delivered_qty integer;
    v_diff_restore integer;
    v_new_total numeric := 0;
BEGIN
    -- 1. Lock the order row to prevent race conditions
    SELECT delivery_status INTO v_old_delivery_status
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 2. Process each item in the order
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
        
        -- Determine new delivered and returned quantities based on status
        IF p_delivery_status = 'returned' OR p_delivery_status = 'not_delivered' THEN
            v_new_delivered_qty := 0;
            v_new_returned_qty := v_item.quantity;
            
        ELSIF p_delivery_status = 'partially_delivered' THEN
            -- Extract requested delivered quantity from the input JSON
            SELECT (elem->>'delivered_quantity')::integer
            INTO v_new_delivered_qty
            FROM jsonb_array_elements(p_items_json) AS elem
            WHERE (elem->>'id')::bigint = v_item.id
            LIMIT 1;
                        
            -- If not found in JSON snippet, assume fully returned for missing item
            IF v_new_delivered_qty IS NULL THEN
                v_new_delivered_qty := 0;
            END IF;

            -- Safety check
            IF v_new_delivered_qty < 0 THEN v_new_delivered_qty := 0; END IF;
            IF v_new_delivered_qty > v_item.quantity THEN v_new_delivered_qty := v_item.quantity; END IF;
            
            v_new_returned_qty := v_item.quantity - v_new_delivered_qty;
            
        ELSE -- 'delivered', 'pending', 'in_delivery', 'shipped'
            v_new_delivered_qty := v_item.quantity;
            v_new_returned_qty := 0;
        END IF;

        -- 3. Calculate how much stock to restore (or remove if reversing a return)
        v_diff_restore := v_new_returned_qty - v_item.returned_quantity;

        -- 4. Update Product Stock (prevent negative stock on reversal)
        IF v_diff_restore <> 0 AND v_item.product_id IS NOT NULL THEN
            UPDATE public.products
            SET stock_quantity = stock_quantity + v_diff_restore
            WHERE id = v_item.product_id;
            -- (Constraint CHECK(stock_quantity >= 0) handles the negative stock rejection naturally)
        END IF;

        -- 5. Update Order Item
        IF v_new_delivered_qty <> v_item.delivered_quantity OR v_new_returned_qty <> v_item.returned_quantity THEN
            UPDATE public.order_items
            SET 
               delivered_quantity = v_new_delivered_qty,
               returned_quantity = v_new_returned_qty
            WHERE id = v_item.id;
        END IF;

        -- 6. Tally the new total order price based ONLY on delivered quantities
        v_new_total := v_new_total + (v_new_delivered_qty * v_item.unit_price);
    END LOOP;

    -- 7. Update Master Order Form
    UPDATE public.orders 
    SET 
        delivery_status = p_delivery_status,
        total_price = v_new_total
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true, 
        'new_total', v_new_total, 
        'status', p_delivery_status
    );
END;
$$;

-- 4. Create View for Batch Stats Fast Tracking
DROP VIEW IF EXISTS public.shipment_batches_stats;

CREATE VIEW public.shipment_batches_stats AS
SELECT 
    b.id as batch_id,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(oi.quantity), 0) as total_items,
    COALESCE(SUM(oi.delivered_quantity), 0) as delivered_items,
    COALESCE(SUM(oi.returned_quantity), 0) as returned_items,
    COALESCE(SUM(oi.delivered_quantity * oi.unit_price), 0) as total_amount
FROM public.shipment_batches b
LEFT JOIN public.orders o ON b.id = o.batch_id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY b.id;