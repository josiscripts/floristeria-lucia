-- PHASE 2: Add product_id FK to order_items
-- Purpose: Enable proper referential integrity between orders and products
-- Date: 2026-09-05

-- Step 1: Add product_id column to order_items (nullable for now, backfill data)
ALTER TABLE IF EXISTS public.order_items
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Step 3: Note - ghl_product_id remains but is now semantically "legacy Supabase UUID" not actual GHL ID
-- This is a migration path: eventually ghl_product_id can be removed after audit

COMMENT ON COLUMN public.order_items.product_id IS 'FK to products table for referential integrity';
COMMENT ON COLUMN public.order_items.ghl_product_id IS 'Legacy: Contains product UUID (not actual GHL ID after migration)';
