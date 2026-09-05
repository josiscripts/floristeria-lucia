-- FASE 5.2 CRITICAL: Remove duplicate FK constraint on product_images.product_id
-- Issue: Two constraints with same FK relationship cause PGRST201 ambiguity
-- - fk_product_images_product_id (custom name)
-- - product_images_product_id_fkey (auto-generated name)
-- Solution: Keep only the auto-generated one, drop the custom one

BEGIN;

-- Drop the custom-named constraint (keeping the auto-generated one)
ALTER TABLE IF EXISTS public.product_images
DROP CONSTRAINT IF EXISTS fk_product_images_product_id;

-- Verify only one FK remains
-- SELECT constraint_name, table_name, column_name FROM information_schema.key_column_usage 
-- WHERE table_name = 'product_images' AND column_name = 'product_id';

COMMIT;
