-- BLOQUE 4 REDESIGN - Complete product model restructuring
-- Migration: 2026-09-03
-- Purpose: Introduce products, product_options, color_variants tables with full schema redesign

-- ============================================================
-- 1. CREATE NEW TABLES
-- ============================================================

-- 1.1 Main products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GHL Integration
  ghl_product_id TEXT NOT NULL UNIQUE,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- CategoryId: ramos, plantas, rosas-eternas, complementos, condolencias
  active BOOLEAN DEFAULT true,

  -- Media
  cover_image_url TEXT,

  -- Features
  has_color_variants BOOLEAN DEFAULT false, -- true only for rosas-eternas

  -- Status & Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT check_category CHECK (category IS NULL OR category IN (
    'ramos', 'plantas', 'rosas-eternas', 'complementos', 'condolencias'
  ))
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_ghl_product_id ON public.products(ghl_product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anon/authenticated can SELECT active products
CREATE POLICY "products_read_active"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (active = true AND deleted_at IS NULL);

-- RLS Policy: Service role can do everything
CREATE POLICY "products_service_role"
  ON public.products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grants for products
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

-- ============================================================
-- 1.2 Product options table (pricing, stock, discounts)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- GHL Integration
  ghl_price_id TEXT UNIQUE, -- Price ID in GHL

  -- Option Details
  name TEXT NOT NULL, -- "Básico", "Premium", "Pequeño", etc.
  price_amount NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  price_final NUMERIC(12,2) GENERATED ALWAYS AS (
    price_amount * (1 - discount_percent/100)
  ) STORED, -- Auto-calculated final price

  -- Stock & SKU
  stock_quantity INTEGER, -- NULL = no tracking
  sku TEXT UNIQUE,

  -- Status & Tracking
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT check_price_positive CHECK (price_amount > 0),
  CONSTRAINT check_stock_non_negative CHECK (stock_quantity IS NULL OR stock_quantity >= 0)
);

-- Indexes for product_options
CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON public.product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_options_ghl_price_id ON public.product_options(ghl_price_id);
CREATE INDEX IF NOT EXISTS idx_product_options_sku ON public.product_options(sku);
CREATE INDEX IF NOT EXISTS idx_product_options_active ON public.product_options(active);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_product_options_updated_at
BEFORE UPDATE ON public.product_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for product_options
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anon/authenticated can SELECT active options from active products
CREATE POLICY "product_options_read_active"
  ON public.product_options FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_options.product_id
      AND products.active = true
      AND products.deleted_at IS NULL
    )
  );

-- RLS Policy: Service role can do everything
CREATE POLICY "product_options_service_role"
  ON public.product_options FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grants for product_options
GRANT SELECT ON public.product_options TO anon, authenticated;
GRANT ALL ON public.product_options TO service_role;

-- ============================================================
-- 1.3 Color variants table (only for rosas-eternas)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.color_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Details
  name TEXT NOT NULL, -- "Rojo", "Rosa", "Blanco", etc.
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,

  -- Status & Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_color_per_product UNIQUE (product_id, name),
  CONSTRAINT check_sort_order CHECK (sort_order >= 0)
);

-- Indexes for color_variants
CREATE INDEX IF NOT EXISTS idx_color_variants_product_id ON public.color_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_color_variants_sort_order ON public.color_variants(product_id, sort_order);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_color_variants_updated_at
BEFORE UPDATE ON public.color_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for color_variants
ALTER TABLE public.color_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anon/authenticated can SELECT active colors from active products
CREATE POLICY "color_variants_read_active"
  ON public.color_variants FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = color_variants.product_id
      AND products.active = true
      AND products.deleted_at IS NULL
    )
  );

-- RLS Policy: Service role can do everything
CREATE POLICY "color_variants_service_role"
  ON public.color_variants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grants for color_variants
GRANT SELECT ON public.color_variants TO anon, authenticated;
GRANT ALL ON public.color_variants TO service_role;

-- ============================================================
-- 2. MODIFY EXISTING TABLES
-- ============================================================

-- 2.1 Modify product_images table to add foreign keys
ALTER TABLE IF EXISTS public.product_images
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.product_images
ADD COLUMN IF NOT EXISTS color_variant_id UUID REFERENCES public.color_variants(id) ON DELETE SET NULL;

-- Create new indexes for product_images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_color_variant_id ON public.product_images(color_variant_id);

-- ============================================================
-- 3. TABLE COMMENTS & DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.products IS 'Main products table for BLOQUE 4 redesign. Stores product information with GHL integration.';
COMMENT ON COLUMN public.products.ghl_product_id IS 'Unique reference to GoHighLevel product ID';
COMMENT ON COLUMN public.products.has_color_variants IS 'Only true for rosas-eternas category. Controls whether to show color selection UI.';
COMMENT ON COLUMN public.products.cover_image_url IS 'Primary image URL for product display';

COMMENT ON TABLE public.product_options IS 'Pricing options for products. One product can have multiple options (sizes, types, tiers, etc.)';
COMMENT ON COLUMN public.product_options.ghl_price_id IS 'Reference to GoHighLevel Price object. Each option is a distinct Price in GHL.';
COMMENT ON COLUMN public.product_options.name IS 'Option name (e.g., "Básico", "Premium", "Pequeño", "Mediano")';
COMMENT ON COLUMN public.product_options.price_final IS 'Calculated final price after discount. Auto-computed from price_amount and discount_percent.';
COMMENT ON COLUMN public.product_options.sku IS 'Stock Keeping Unit (e.g., FL-RAM-0001). Auto-generated, unique per option.';
COMMENT ON COLUMN public.product_options.stock_quantity IS 'Current inventory. NULL = no stock tracking for this option.';

COMMENT ON TABLE public.color_variants IS 'Color variants for Rosas Eternas products. Allows multiple color options per product with separate images.';
COMMENT ON COLUMN public.color_variants.sort_order IS 'Display order for color selection UI (0-based, lower values first)';

COMMENT ON TABLE public.product_images IS 'Product image metadata. Modified to include product_id and color_variant_id FKs.';
COMMENT ON COLUMN public.product_images.product_id IS 'FK to products table';
COMMENT ON COLUMN public.product_images.color_variant_id IS 'FK to color_variants. NULL for general product images, populated for color-specific images.';

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Function to get all options for a product with calculated pricing
CREATE OR REPLACE FUNCTION get_product_with_options(p_product_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_category TEXT,
  option_id UUID,
  option_name TEXT,
  price_amount NUMERIC,
  discount_percent NUMERIC,
  price_final NUMERIC,
  stock_quantity INTEGER,
  sku TEXT
) AS $$
SELECT
  p.id,
  p.name,
  p.category,
  po.id,
  po.name,
  po.price_amount,
  po.discount_percent,
  po.price_final,
  po.stock_quantity,
  po.sku
FROM public.products p
LEFT JOIN public.product_options po ON p.id = po.product_id AND po.deleted_at IS NULL
WHERE p.id = p_product_id AND p.deleted_at IS NULL
ORDER BY po.sort_order, po.created_at;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_product_with_options(UUID) IS 'Get a product with all its active options and pricing';

-- ============================================================
-- 5. MIGRATION NOTES
-- ============================================================

-- NOTE: This migration creates the new schema but does NOT migrate existing data.
-- Existing product_metadata will remain intact as a legacy table.
-- Data migration is handled separately via application code.
--
-- To migrate data from product_metadata to products:
-- 1. Read all records from product_metadata
-- 2. Create products (from product_metadata.ghl_product_id)
-- 3. Create product_options (from product_metadata.ghl_price_id)
-- 4. Update product_images to link to new products
--
-- The old product_metadata table should be kept for reference and can be archived later.
