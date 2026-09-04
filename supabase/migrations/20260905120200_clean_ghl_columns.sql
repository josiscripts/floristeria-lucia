-- PHASE 2: Remove GHL-specific columns from product tables
-- Purpose: Supabase-only cleanup
-- Date: 2026-09-05

-- NOTE: This migration is NON-DESTRUCTIVE and REVERSIBLE
-- We document the old columns but don't delete them yet (leaving for gradual migration)
-- In production, validate that no active code references these before deletion

-- Step 1: Document what will eventually be removed
-- ghl_price_id from product_options - no longer used for pricing
-- ghl_product_id from products - made nullable, eventually can be archived
-- location_id from product_metadata - GHL-only

-- For now, just add comments so developers know they're deprecated
COMMENT ON COLUMN public.product_options.ghl_price_id IS 'DEPRECATED: GHL price ID. No longer used after Supabase-only migration.';

-- Step 2: Ensure product_options pricing is self-contained (no GHL sync needed)
-- price_amount and discount_percent are the source of truth
-- price_final is auto-calculated
-- This is already the case, so no schema changes needed here

-- Step 3: Document the data flow
COMMENT ON TABLE public.product_options IS 'Product pricing options. Source of truth for all prices. ghl_price_id is deprecated.';
