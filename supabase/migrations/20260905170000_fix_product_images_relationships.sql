-- FASE 5.2 FIX: Remove ambiguous ghl_product_id relationship from product_images
-- Issue: product_images has two FKs to products (product_id and ghl_product_id)
-- This causes PostgREST PGRST201 "Could not embed" error
-- Solution: Keep only product_id FK, remove ghl_product_id constraint

BEGIN;

-- 1. Drop the foreign key constraint if it exists on ghl_product_id
ALTER TABLE IF EXISTS public.product_images
DROP CONSTRAINT IF EXISTS product_images_ghl_product_id_fkey;

-- 2. Drop the unique index on ghl_product_id if it was also acting as FK
DROP INDEX IF EXISTS idx_product_images_ghl_product_id_unique;

-- 3. Keep ghl_product_id as a TEXT field (for legacy tracking) but NOT as FK
-- This field can still be used for audit/sync purposes but won't create ambiguous relationships

-- 4. Ensure product_id is the PRIMARY foreign key relationship
-- Constraint should already exist, but verify
-- (It was created as fk_product_images_product_id in earlier migration)

-- 5. Create a clean index for ghl_product_id lookup (no unique constraint, no FK)
CREATE INDEX IF NOT EXISTS idx_product_images_ghl_product_id_lookup
ON public.product_images(ghl_product_id)
WHERE ghl_product_id IS NOT NULL;

-- 6. Update comment to clarify ghl_product_id is NOT a FK
COMMENT ON COLUMN public.product_images.ghl_product_id IS 'Legacy tracking only: GoHighLevel product ID. NOT a foreign key. Primary FK is product_id.';

-- 7. Verify no other ambiguous relationships exist
-- (run checks in test, not in migration)

COMMIT;
