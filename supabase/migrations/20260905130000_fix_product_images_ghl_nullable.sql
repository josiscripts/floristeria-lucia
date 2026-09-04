-- Fix product_images schema to support Supabase-only products
-- Issue: ghl_product_id was NOT NULL but products.ghl_product_id can be NULL
-- Solution: Make ghl_product_id nullable in product_images, use product_id as primary FK

-- Make ghl_product_id nullable in product_images
ALTER TABLE IF EXISTS public.product_images
ALTER COLUMN ghl_product_id DROP NOT NULL;

-- Update constraint to allow nulls for Supabase-only products
ALTER TABLE IF EXISTS public.product_images
DROP CONSTRAINT IF EXISTS product_images_ghl_product_id_key CASCADE;

-- Create partial unique index (allows multiple NULLs) if it was previously a unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_ghl_product_id_unique ON public.product_images(ghl_product_id)
WHERE ghl_product_id IS NOT NULL;

-- Verify product_id NOT NULL constraint exists and is correct
ALTER TABLE IF EXISTS public.product_images
ALTER COLUMN product_id SET NOT NULL;

-- Add FK constraint if not exists
ALTER TABLE IF EXISTS public.product_images
ADD CONSTRAINT fk_product_images_product_id FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Update comment to reflect new model
COMMENT ON COLUMN public.product_images.ghl_product_id IS 'Legacy: GoHighLevel product ID (NULL for Supabase-only products). Primary FK is now product_id.';

-- Ensure product_images RLS is correct (should already be enabled by 20260904_fix_product_images_rls.sql)
ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are created/updated by 20260904_fix_product_images_rls.sql
-- This migration only handles schema changes (making ghl_product_id nullable)

-- Ensure proper grants
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;

-- Drop old indexes that used ghl_product_id as primary key
DROP INDEX IF EXISTS idx_product_images_ghl_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_images_sort_order CASCADE;
DROP INDEX IF EXISTS idx_product_images_is_primary CASCADE;
DROP INDEX IF EXISTS idx_product_images_one_primary CASCADE;

-- Create new indexes based on product_id
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_sort_order ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_product_primary ON public.product_images(product_id) WHERE is_primary = true;

-- Create new unique constraint for primary image (per product)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary_per_product
ON public.product_images(product_id)
WHERE is_primary = true;
