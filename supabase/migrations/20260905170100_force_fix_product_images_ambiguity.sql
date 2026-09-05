-- PHASE 5.2 CRITICAL FIX: Force removal of ghl_product_id as relationship
-- The previous migration didn't fully fix the PGRST201 error
-- This migration will rename ghl_product_id column to force PostgREST to use only product_id FK

BEGIN;

-- Step 1: Check what constraints exist
-- (This is for documentation - constraints that cause ambiguity will be dropped)

-- Step 2: Drop ALL constraints/indexes related to ghl_product_id
ALTER TABLE IF EXISTS public.product_images
DROP CONSTRAINT IF EXISTS product_images_ghl_product_id_key;

DROP INDEX IF EXISTS idx_product_images_ghl_product_id_unique;
DROP INDEX IF EXISTS idx_product_images_ghl_product_id_lookup;

-- Step 3: Rename the column to prevent PostgREST from auto-detecting it as a relationship
-- From: ghl_product_id -> To: legacy_ghl_product_id
ALTER TABLE IF EXISTS public.product_images
RENAME COLUMN ghl_product_id TO legacy_ghl_product_id;

-- Step 4: Update comment
COMMENT ON COLUMN public.product_images.legacy_ghl_product_id IS 'LEGACY: Former GoHighLevel ID. Not a foreign key. Kept for audit trail only. Primary FK is product_id.';

-- Step 5: Verify only one FK relationship remains (product_id)
-- product_id -> products(id) should be the ONLY FK

COMMIT;
