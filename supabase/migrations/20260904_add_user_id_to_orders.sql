-- Add user_id to orders table to associate orders with authenticated users
-- This enables users to see their own order history
-- user_id is NULLABLE to support anonymous/guest orders (user_id = NULL)

-- 1. Add user_id column (nullable, with FK to auth.users)
ALTER TABLE public.orders
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create index for efficient queries: "get user's orders ordered by date"
-- This is critical for performance when listing a user's orders
CREATE INDEX idx_orders_user_id_created_at
  ON public.orders(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- 3. Enable Row Level Security on orders table (if not already enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing RLS policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- 5. Create RLS policies

-- Policy: Users can SELECT only their own orders
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can SELECT all orders (no restriction)
-- Admins are identified by having role = 'admin' in profiles table
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Anyone can INSERT orders (public checkout)
-- But the server must validate and set user_id correctly
CREATE POLICY "Public can insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can UPDATE orders
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Note: order_items table should inherit RLS from orders via FK
-- but we'll ensure it's also protected appropriately
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view order items of their orders" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;

CREATE POLICY "Users can view order items of their orders"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (auth.uid() = orders.user_id OR orders.user_id IS NULL)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can insert order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
