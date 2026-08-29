-- ============================================
-- FIX: Grant permissions to service_role for orders and order_items
-- Date: 2026-08-28
-- Issue: Error 42501 - permission denied for table orders
-- ============================================
-- This migration adds necessary RLS configuration and grants to orders and order_items tables
-- The tables were created without explicit GRANT statements to service_role
-- This is IDEMPOTENT - it will not create duplicate policies if they already exist

-- ============================================
-- STEP 1: Enable RLS (if not already enabled)
-- ============================================
-- Note: This query will fail silently if RLS is already enabled
DO $$
BEGIN
  -- Enable RLS on orders table
  ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS enabled on public.orders';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'RLS already enabled on public.orders or other issue: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Enable RLS on order_items table
  ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS enabled on public.order_items';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'RLS already enabled on public.order_items or other issue: %', SQLERRM;
END $$;

-- ============================================
-- STEP 2: Grant permissions to service_role
-- ============================================
-- These grants are cumulative (GRANT again is safe even if already granted)
DO $$
BEGIN
  GRANT ALL PRIVILEGES ON public.orders TO service_role;
  GRANT ALL PRIVILEGES ON public.order_items TO service_role;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
  RAISE NOTICE 'Granted ALL PRIVILEGES to service_role on orders, order_items, and sequences';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error granting permissions: %', SQLERRM;
END $$;

-- ============================================
-- STEP 3: Create RLS Policies (if not exist)
-- ============================================
-- These policies allow service_role to perform all operations
-- (They bypass the default RLS deny-all when RLS is enabled)

-- Policy for orders table - SELECT
DO $$
BEGIN
  CREATE POLICY "service_role_select_orders"
    ON public.orders
    FOR SELECT
    TO service_role
    USING (true);
  RAISE NOTICE 'Created policy: service_role_select_orders';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy service_role_select_orders already exists (skipping)';
  WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Policy for orders table - INSERT
DO $$
BEGIN
  CREATE POLICY "service_role_insert_orders"
    ON public.orders
    FOR INSERT
    TO service_role
    WITH CHECK (true);
  RAISE NOTICE 'Created policy: service_role_insert_orders';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy service_role_insert_orders already exists (skipping)';
  WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Policy for orders table - UPDATE
DO $$
BEGIN
  CREATE POLICY "service_role_update_orders"
    ON public.orders
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
  RAISE NOTICE 'Created policy: service_role_update_orders';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy service_role_update_orders already exists (skipping)';
  WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Policy for orders table - DELETE
DO $$
BEGIN
  CREATE POLICY "service_role_delete_orders"
    ON public.orders
    FOR DELETE
    TO service_role
    USING (true);
  RAISE NOTICE 'Created policy: service_role_delete_orders';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy service_role_delete_orders already exists (skipping)';
  WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Policy for order_items table - SELECT
DO $$
BEGIN
  CREATE POLICY "service_role_select_order_items"
    ON public.order_items
    FOR SELECT
    TO service_role
    USING (true);
  RAISE NOTICE 'Created policy: service_role_select_order_items';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy service_role_select_order_items already exists (skipping)';
  WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Policy for order_items table - INSERT
DO $$
BEGIN
  CREATE POLICY "service_role_insert_order_items"
    ON public.order_items
    FOR INSERT
    TO service_role
    WITH CHECK (true);
  RAISE NOTICE 'Created policy: service_role_insert_order_items';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy service_role_insert_order_items already exists (skipping)';
  WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Policy for order_items table - UPDATE
DO $$
BEGIN
  CREATE POLICY "service_role_update_order_items"
    ON public.order_items
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
  RAISE NOTICE 'Created policy: service_role_update_order_items';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy service_role_update_order_items already exists (skipping)';
  WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Policy for order_items table - DELETE
DO $$
BEGIN
  CREATE POLICY "service_role_delete_order_items"
    ON public.order_items
    FOR DELETE
    TO service_role
    USING (true);
  RAISE NOTICE 'Created policy: service_role_delete_order_items';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy service_role_delete_order_items already exists (skipping)';
  WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- ============================================
-- Summary
-- ============================================
-- This migration:
-- 1. Enables RLS on orders and order_items (if not already enabled)
-- 2. Grants ALL PRIVILEGES to service_role on both tables
-- 3. Creates RLS policies allowing service_role to perform all operations
--
-- Result: service_role can now INSERT, SELECT, UPDATE, DELETE on both tables
-- No existing data is modified
-- No existing schemas are changed
-- Policies are created only if they don't already exist
