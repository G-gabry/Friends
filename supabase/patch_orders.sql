-- ============================================================
-- PATCH: Fix orders table if you already ran the original schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- If the orders table already exists with the broken dual-identity,
-- you need to recreate it. If the table doesn't exist yet, just run
-- the updated schema.sql instead.

-- Option A: If orders table has NO data yet (fresh DB)
-- Drop and recreate:
DROP TABLE IF EXISTS public.shipping CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- Invoice sequence
CREATE SEQUENCE IF NOT EXISTS public.orders_invoice_seq START 1000;

CREATE TABLE public.orders (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice           bigint UNIQUE NOT NULL DEFAULT nextval('public.orders_invoice_seq'),
  barcode           text UNIQUE,
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  customer_id       bigint REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name     text NOT NULL DEFAULT '',
  customer_phone    text NOT NULL DEFAULT '',
  customer_address  text,
  total_price       numeric NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled', 'returned')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders are viewable by authenticated users"
  ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert orders"
  ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update orders"
  ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete orders"
  ON public.orders FOR DELETE TO authenticated USING (true);

-- Auto-generate order barcode
CREATE OR REPLACE FUNCTION public.generate_order_barcode()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.barcode := 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(NEW.id::text, 5, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_order_barcode
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_barcode();

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Recreate order_items
CREATE TABLE public.order_items (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id    bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  bigint REFERENCES public.products(id) ON DELETE SET NULL,
  name        text NOT NULL,
  size        text,
  color       text,
  quantity    integer NOT NULL CHECK (quantity > 0),
  unit_price  numeric NOT NULL,
  image_url   text
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items are viewable by authenticated users"
  ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert order items"
  ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update order items"
  ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete order items"
  ON public.order_items FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Recreate shipping
CREATE TABLE public.shipping (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id        bigint NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  company_name    text NOT NULL,
  tracking_number text,
  phone           text,
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shipping is viewable by authenticated users"
  ON public.shipping FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert shipping"
  ON public.shipping FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update shipping"
  ON public.shipping FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete shipping"
  ON public.shipping FOR DELETE TO authenticated USING (true);

-- Recreate indexes
CREATE INDEX idx_orders_user          ON public.orders(user_id);
CREATE INDEX idx_orders_customer      ON public.orders(customer_id);
CREATE INDEX idx_orders_status        ON public.orders(status);
CREATE INDEX idx_orders_created       ON public.orders(created_at);
CREATE INDEX idx_order_items_order    ON public.order_items(order_id);
CREATE INDEX idx_order_items_product  ON public.order_items(product_id);
CREATE INDEX idx_shipping_order       ON public.shipping(order_id);

-- ============================================================
-- Recreate the RPC function (must match new table structure)
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_new_order(
  order_data  jsonb,
  items_data  jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order    public.orders%ROWTYPE;
  item         jsonb;
  stock_check  integer;
BEGIN
  -- 1. Validate stock for all items first
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    SELECT stock_quantity INTO stock_check
    FROM public.products
    WHERE id = (item ->> 'product_id')::bigint;

    IF stock_check IS NULL THEN
      RAISE EXCEPTION 'Product ID % not found', item ->> 'product_id';
    END IF;

    IF stock_check < (item ->> 'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %',
        item ->> 'name', stock_check, item ->> 'quantity';
    END IF;
  END LOOP;

  -- 2. Insert the order
  INSERT INTO public.orders (
    user_id, customer_id, customer_name, customer_phone,
    customer_address, total_price, status
  ) VALUES (
    (order_data ->> 'user_id')::uuid,
    (order_data ->> 'customer_id')::bigint,
    COALESCE(order_data ->> 'customer_name', ''),
    COALESCE(order_data ->> 'customer_phone', ''),
    order_data ->> 'customer_address',
    (order_data ->> 'total_price')::numeric,
    COALESCE(order_data ->> 'status', 'pending')
  )
  RETURNING * INTO new_order;

  -- 3. Insert order items and decrement stock
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, name, size, color,
      quantity, unit_price, image_url
    ) VALUES (
      new_order.id,
      (item ->> 'product_id')::bigint,
      item ->> 'name',
      item ->> 'size',
      item ->> 'color',
      (item ->> 'quantity')::integer,
      (item ->> 'unit_price')::numeric,
      item ->> 'image_url'
    );

    -- Decrement stock
    UPDATE public.products
    SET stock_quantity = stock_quantity - (item ->> 'quantity')::integer
    WHERE id = (item ->> 'product_id')::bigint;
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', new_order.id,
    'invoice', new_order.invoice,
    'barcode', new_order.barcode
  );
END;
$$;
