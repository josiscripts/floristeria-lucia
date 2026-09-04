-- Fix RLS policy for product_images to match other product tables
-- The issue: product_images used roles={public} instead of roles={anon,authenticated}
-- This caused 401 permission denied when catalog tried to fetch products with images

-- Drop the problematic public role policies
DROP POLICY IF EXISTS "product_images_read_public" ON "public"."product_images";
DROP POLICY IF EXISTS "product_images_delete_authenticated" ON "public"."product_images";
DROP POLICY IF EXISTS "product_images_update_authenticated" ON "public"."product_images";
DROP POLICY IF EXISTS "product_images_write_authenticated" ON "public"."product_images";

-- Drop any existing new policies to ensure idempotent migration
DROP POLICY IF EXISTS "product_images_read_active" ON "public"."product_images";
DROP POLICY IF EXISTS "product_images_service_role" ON "public"."product_images";

-- Create proper policies matching products/product_options/color_variants pattern
CREATE POLICY "product_images_read_active" ON "public"."product_images"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
        AND products.active = true
        AND products.deleted_at IS NULL
    )
  );

CREATE POLICY "product_images_service_role" ON "public"."product_images"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
