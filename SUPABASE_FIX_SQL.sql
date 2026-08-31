-- ============================================
-- FIX: Grant permissions to service_role for orders and order_items
-- Execute this in Supabase SQL Editor
-- URL: https://app.supabase.com/project/leksmflinhohnekbgmgj/sql/new
-- ============================================

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON public.orders TO service_role;
GRANT ALL PRIVILEGES ON public.order_items TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create RLS Policies for orders table
CREATE POLICY "service_role_select_orders" ON public.orders FOR SELECT TO service_role USING (true);
CREATE POLICY "service_role_insert_orders" ON public.orders FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_role_update_orders" ON public.orders FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_delete_orders" ON public.orders FOR DELETE TO service_role USING (true);

-- Create RLS Policies for order_items table
CREATE POLICY "service_role_select_order_items" ON public.order_items FOR SELECT TO service_role USING (true);
CREATE POLICY "service_role_insert_order_items" ON public.order_items FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_role_update_order_items" ON public.order_items FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_delete_order_items" ON public.order_items FOR DELETE TO service_role USING (true);
