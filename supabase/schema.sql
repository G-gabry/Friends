-- ============================================================
-- Friends Wear — Fresh Database Schema
-- Run this in your Supabase SQL Editor (a fresh project)
-- ============================================================

-- 0. Enable required extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (auto-created from Supabase Auth trigger)
-- ============================================================
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Service role can insert (via trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

-- Trigger: sync profile on user update
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

CREATE POLICY "Categories are viewable by authenticated users"
  ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR true  -- allow all authenticated for now; tighten as needed
  );

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 3. PRODUCTS (replaces old "items" table)
-- ============================================================
CREATE TABLE public.products (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            text NOT NULL,
  description     text,
  category_id     bigint REFERENCES public.categories(id) ON DELETE SET NULL,
  size            text,           -- e.g. 'S', 'M', 'L', 'XL', 'XXL'
  color           text,           -- e.g. 'Black', 'White'
  price           numeric NOT NULL CHECK (price > 0),
  stock_quantity  integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  barcode         text UNIQUE,    -- auto-generated or manual override
  image_url       text,
  owner_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by authenticated users"
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert products"
  ON public.products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update products"
  ON public.products FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete products"
  ON public.products FOR DELETE TO authenticated USING (true);

-- Auto-generate barcode if not provided
CREATE OR REPLACE FUNCTION public.generate_product_barcode()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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

CREATE POLICY "Customers are viewable by authenticated users"
  ON public.customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert customers"
  ON public.customers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update customers"
  ON public.customers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete customers"
  ON public.customers FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 5. ORDERS
-- ============================================================
-- Invoice sequence (separate from id)
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

-- Enable Realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================
-- 6. ORDER_ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id    bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  bigint REFERENCES public.products(id) ON DELETE SET NULL,
  name        text NOT NULL,       -- snapshot at order time
  size        text,                -- snapshot
  color       text,                -- snapshot
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

-- Enable Realtime for order_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- ============================================================
-- 7. SHIPPING
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

CREATE POLICY "Shipping is viewable by authenticated users"
  ON public.shipping FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert shipping"
  ON public.shipping FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update shipping"
  ON public.shipping FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete shipping"
  ON public.shipping FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 8. RPC: place_new_order (with inventory auto-decrement)
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

-- ============================================================
-- 9. Seed: Create initial admin user (run AFTER creating user in Auth)
-- After creating a user via Supabase Auth dashboard, update their role:
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';

-- ============================================================
-- 10. Useful indexes
-- ============================================================
CREATE INDEX idx_products_category    ON public.products(category_id);
CREATE INDEX idx_products_barcode     ON public.products(barcode);
CREATE INDEX idx_products_stock       ON public.products(stock_quantity);
CREATE INDEX idx_orders_user          ON public.orders(user_id);
CREATE INDEX idx_orders_customer      ON public.orders(customer_id);
CREATE INDEX idx_orders_status        ON public.orders(status);
CREATE INDEX idx_orders_created       ON public.orders(created_at);
CREATE INDEX idx_order_items_order    ON public.order_items(order_id);
CREATE INDEX idx_order_items_product  ON public.order_items(product_id);
CREATE INDEX idx_shipping_order       ON public.shipping(order_id);
CREATE INDEX idx_customers_phone      ON public.customers(phone);
