-- Clean up all order data for FASE 2 restart
-- This removes historical test/demo orders safely
-- The orders and order_items tables themselves are preserved

-- First, delete all order_items (respects FK constraint on orders)
DELETE FROM public.order_items;

-- Then delete all orders
DELETE FROM public.orders;

-- Verify deletions were successful
-- SELECT COUNT(*) FROM public.orders; -- Should be 0
-- SELECT COUNT(*) FROM public.order_items; -- Should be 0
