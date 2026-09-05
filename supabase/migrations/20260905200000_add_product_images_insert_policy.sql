-- Add INSERT policy for product_images to allow authenticated users to create images
-- This was missing and caused RLS violation when uploading product images

-- Add INSERT policy for authenticated users (admin-only in practice via app logic)
CREATE POLICY "product_images_insert_authenticated" ON "public"."product_images"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for authenticated users
CREATE POLICY "product_images_update_authenticated" ON "public"."product_images"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for authenticated users
CREATE POLICY "product_images_delete_authenticated" ON "public"."product_images"
  FOR DELETE
  TO authenticated
  USING (true);
