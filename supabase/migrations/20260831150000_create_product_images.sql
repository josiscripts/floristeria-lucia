-- FASE 3B.1: Product Images Infrastructure
-- Create table for managing product images in Supabase Storage

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_product_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  image_url TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_product_images_ghl_product_id ON product_images(ghl_product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(ghl_product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(ghl_product_id, is_primary);

-- Constraint: only one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary
ON product_images(ghl_product_id)
WHERE is_primary = true;

-- Comments for documentation
COMMENT ON TABLE product_images IS 'Stores metadata about product images stored in Supabase Storage';
COMMENT ON COLUMN product_images.ghl_product_id IS 'FK to GHL product (not a true FK, as GHL data is external)';
COMMENT ON COLUMN product_images.storage_path IS 'Path in product-images bucket: {ghl_product_id}/{sequence}.{ext}';
COMMENT ON COLUMN product_images.image_url IS 'Public URL for accessing the image from Storage';
COMMENT ON COLUMN product_images.is_primary IS 'If true, this is the main product image for catalog display';

-- RLS: Enable for this table
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read product images (public catalog)
CREATE POLICY "product_images_read_public"
ON product_images FOR SELECT
USING (true);

-- RLS Policy: Only authenticated users can insert/update/delete (admin-only in practice)
CREATE POLICY "product_images_write_authenticated"
ON product_images FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "product_images_update_authenticated"
ON product_images FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "product_images_delete_authenticated"
ON product_images FOR DELETE
USING (auth.role() = 'authenticated');
