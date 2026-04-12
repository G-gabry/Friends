-- ============================================================
-- Friends Wear — FULL DATABASE SETUP (Run this ONCE in Supabase SQL Editor)
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by auth users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Service role insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name  = COALESCE(NEW.raw_user_meta_data ->> 'full_name', full_name),
    email      = COALESCE(NEW.email, email),
    role       = COALESCE(NEW.raw_user_meta_data ->> 'role', role),
    avatar_url = COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', avatar_url)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL,
  description text,
  slug        text,
  owner_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Categories insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Categories update" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Categories delete" ON public.categories FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            text NOT NULL,
  description     text,
  category_id     bigint REFERENCES public.categories(id) ON DELETE SET NULL,
  size            text,
  color           text,
  price           numeric NOT NULL CHECK (price > 0),
  stock_quantity  integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  barcode         text UNIQUE,
  image_url       text,
  owner_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products viewable" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Products insert" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Products update" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Products delete" ON public.products FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.generate_product_barcode()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
    NEW.barcode := 'FW-' || LPAD(NEW.id::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_product_barcode
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.generate_product_barcode();

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_barcode  ON public.products(barcode);
CREATE INDEX idx_products_stock    ON public.products(stock_quantity);

-- ============================================================
-- 4. CUSTOMERS
-- ============================================================
CREATE TABLE public.customers (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL,
  phone       text NOT NULL,
  address     text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers viewable" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Customers insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Customers update" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Customers delete" ON public.customers FOR DELETE TO authenticated USING (true);
CREATE INDEX idx_customers_phone ON public.customers(phone);

-- ============================================================
-- 5. SHIPPING BATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipment_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipping_company TEXT NOT NULL,
    date DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shipment_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Batches viewable" ON public.shipment_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Batches insert" ON public.shipment_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Batches update" ON public.shipment_batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Batches delete" ON public.shipment_batches FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 6. ORDERS
-- ============================================================
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
                    CHECK (status IN ('pending', 'confirmed', 'preparing', 'in_delivery', 'shipped', 'delivered', 'cancelled', 'returned')),
  delivery_status   text DEFAULT 'pending'
                    CHECK (delivery_status IN ('pending', 'delivered', 'partially_delivered', 'not_delivered', 'returned')),
  batch_id          UUID REFERENCES public.shipment_batches(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders viewable" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Orders update" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Orders delete" ON public.orders FOR DELETE TO authenticated USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_order_barcode()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.barcode := 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(NEW.id::text, 5, '0');
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_order_barcode
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_barcode();

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

CREATE INDEX idx_orders_user     ON public.orders(user_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status   ON public.orders(status);
CREATE INDEX idx_orders_created  ON public.orders(created_at);

-- ============================================================
-- 7. ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id            bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id          bigint REFERENCES public.products(id) ON DELETE SET NULL,
  name                text NOT NULL,
  size                text,
  color               text,
  quantity            integer NOT NULL CHECK (quantity > 0),
  unit_price          numeric NOT NULL,
  image_url           text,
  delivered_quantity  INTEGER DEFAULT 0,
  returned_quantity   INTEGER DEFAULT 0,
  notes               text
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items viewable" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Order items insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Order items update" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Order items delete" ON public.order_items FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

CREATE INDEX idx_order_items_order   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- ============================================================
-- 8. SHIPPING
-- ============================================================
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
CREATE POLICY "Shipping viewable" ON public.shipping FOR SELECT TO authenticated USING (true);
CREATE POLICY "Shipping insert" ON public.shipping FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Shipping update" ON public.shipping FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Shipping delete" ON public.shipping FOR DELETE TO authenticated USING (true);
CREATE INDEX idx_shipping_order ON public.shipping(order_id);

-- ============================================================
-- 9. SHIPPING RATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  governorate  text NOT NULL,
  city         text NOT NULL,
  price        numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shipping rates viewable" ON public.shipping_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Shipping rates insert" ON public.shipping_rates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Shipping rates update" ON public.shipping_rates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Shipping rates delete" ON public.shipping_rates FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 10. RPC: place_new_order
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_new_order(order_data jsonb, items_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_order   public.orders%ROWTYPE;
  item        jsonb;
  stock_check integer;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    SELECT stock_quantity INTO stock_check FROM public.products WHERE id = (item->>'product_id')::bigint;
    IF stock_check IS NULL THEN RAISE EXCEPTION 'Product ID % not found', item->>'product_id'; END IF;
    IF stock_check < (item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %', item->>'name', stock_check, item->>'quantity';
    END IF;
  END LOOP;

  INSERT INTO public.orders (user_id, customer_id, customer_name, customer_phone, customer_address, total_price, status)
  VALUES (
    (order_data->>'user_id')::uuid, (order_data->>'customer_id')::bigint,
    COALESCE(order_data->>'customer_name', ''), COALESCE(order_data->>'customer_phone', ''),
    order_data->>'customer_address', (order_data->>'total_price')::numeric,
    COALESCE(order_data->>'status', 'pending')
  ) RETURNING * INTO new_order;

  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    INSERT INTO public.order_items (order_id, product_id, name, size, color, quantity, unit_price, image_url)
    VALUES (new_order.id, (item->>'product_id')::bigint, item->>'name', item->>'size', item->>'color',
            (item->>'quantity')::integer, (item->>'unit_price')::numeric, item->>'image_url');
    UPDATE public.products SET stock_quantity = stock_quantity - (item->>'quantity')::integer WHERE id = (item->>'product_id')::bigint;
  END LOOP;

  RETURN jsonb_build_object('order_id', new_order.id, 'invoice', new_order.invoice, 'barcode', new_order.barcode);
END;
$$;

-- ============================================================
-- 11. RPC: update_existing_order
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_existing_order(p_order_id bigint, p_order_data jsonb, p_items_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  old_item record; new_item jsonb; stock_check integer;
BEGIN
  FOR old_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
    IF old_item.product_id IS NOT NULL THEN
      UPDATE public.products SET stock_quantity = stock_quantity + old_item.quantity WHERE id = old_item.product_id;
    END IF;
  END LOOP;

  DELETE FROM public.order_items WHERE order_id = p_order_id;

  FOR new_item IN SELECT * FROM jsonb_array_elements(p_items_data) LOOP
    IF (new_item->>'product_id') IS NOT NULL THEN
      SELECT stock_quantity INTO stock_check FROM public.products WHERE id = (new_item->>'product_id')::bigint;
      IF stock_check IS NULL THEN RAISE EXCEPTION 'Product ID % not found', new_item->>'product_id'; END IF;
      IF stock_check < (new_item->>'quantity')::integer THEN
        RAISE EXCEPTION 'Insufficient stock for "%" (Requested: %)', new_item->>'name', new_item->>'quantity';
      END IF;
      UPDATE public.products SET stock_quantity = stock_quantity - (new_item->>'quantity')::integer WHERE id = (new_item->>'product_id')::bigint;
    END IF;
  END LOOP;

  FOR new_item IN SELECT * FROM jsonb_array_elements(p_items_data) LOOP
    INSERT INTO public.order_items (order_id, product_id, name, size, color, quantity, unit_price, image_url)
    VALUES (p_order_id, (new_item->>'product_id')::bigint, new_item->>'name', new_item->>'size', new_item->>'color',
            (new_item->>'quantity')::integer, (new_item->>'unit_price')::numeric, new_item->>'image_url');
  END LOOP;

  UPDATE public.orders SET
    customer_name = COALESCE(p_order_data->>'customer_name', customer_name),
    customer_phone = COALESCE(p_order_data->>'customer_phone', customer_phone),
    customer_address = COALESCE(p_order_data->>'customer_address', customer_address),
    total_price = COALESCE((p_order_data->>'total_price')::numeric, total_price),
    status = COALESCE(p_order_data->>'status', status)
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

-- ============================================================
-- 12. RPC: update_order_delivery_with_items
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_order_delivery_with_items(
    p_order_id bigint, p_delivery_status text, p_items_json jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_old_delivery_status text; v_item record; v_input_item jsonb;
    v_new_returned_qty integer; v_new_delivered_qty integer;
    v_diff_restore integer; v_new_total numeric := 0;
BEGIN
    SELECT delivery_status INTO v_old_delivery_status FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
        IF p_delivery_status IN ('returned', 'not_delivered') THEN
            v_new_delivered_qty := 0; v_new_returned_qty := v_item.quantity;
        ELSIF p_delivery_status = 'partially_delivered' THEN
            SELECT (elem->>'delivered_quantity')::integer INTO v_new_delivered_qty
            FROM jsonb_array_elements(p_items_json) AS elem WHERE (elem->>'id')::bigint = v_item.id LIMIT 1;
            IF v_new_delivered_qty IS NULL THEN v_new_delivered_qty := 0; END IF;
            IF v_new_delivered_qty < 0 THEN v_new_delivered_qty := 0; END IF;
            IF v_new_delivered_qty > v_item.quantity THEN v_new_delivered_qty := v_item.quantity; END IF;
            v_new_returned_qty := v_item.quantity - v_new_delivered_qty;
        ELSE
            v_new_delivered_qty := v_item.quantity; v_new_returned_qty := 0;
        END IF;

        v_diff_restore := v_new_returned_qty - v_item.returned_quantity;
        IF v_diff_restore <> 0 AND v_item.product_id IS NOT NULL THEN
            UPDATE public.products SET stock_quantity = stock_quantity + v_diff_restore WHERE id = v_item.product_id;
        END IF;
        IF v_new_delivered_qty <> v_item.delivered_quantity OR v_new_returned_qty <> v_item.returned_quantity THEN
            UPDATE public.order_items SET delivered_quantity = v_new_delivered_qty, returned_quantity = v_new_returned_qty WHERE id = v_item.id;
        END IF;
        v_new_total := v_new_total + (v_new_delivered_qty * v_item.unit_price);
    END LOOP;

    UPDATE public.orders SET delivery_status = p_delivery_status, total_price = v_new_total WHERE id = p_order_id;
    RETURN jsonb_build_object('success', true, 'new_total', v_new_total, 'status', p_delivery_status);
END;
$$;

-- ============================================================
-- 13. VIEW: shipment_batches_stats
-- ============================================================
DROP VIEW IF EXISTS public.shipment_batches_stats;
CREATE VIEW public.shipment_batches_stats AS
SELECT b.id as batch_id,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(oi.quantity), 0) as total_items,
    COALESCE(SUM(oi.delivered_quantity), 0) as delivered_items,
    COALESCE(SUM(oi.returned_quantity), 0) as returned_items,
    COALESCE(SUM(oi.delivered_quantity * oi.unit_price), 0) as total_amount
FROM public.shipment_batches b
LEFT JOIN public.orders o ON b.id = o.batch_id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY b.id;

-- ============================================================
-- 14. AFTER SETUP: Set the first user as manager
-- Run this line separately AFTER creating your user in Auth:
-- UPDATE public.profiles SET role = 'manager' WHERE email = 'moazkhalifa10@gmail.com';
-- ============================================================
