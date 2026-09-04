-- PHASE 2: Supabase-only Schema Changes
-- Purpose: Remove GHL dependencies and normalize schema
-- Date: 2026-09-05

-- Step 1: Create categories table (Supabase-only, no GHL fields)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read_active" ON public.categories;
CREATE POLICY "categories_read_active"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "categories_service_role" ON public.categories;
CREATE POLICY "categories_service_role"
  ON public.categories FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (name, slug, display_order, active)
VALUES
  ('Ramos y arreglos florales', 'ramos', 1, true),
  ('Plantas y Composiciones', 'plantas', 2, true),
  ('Rosas eternas', 'rosas-eternas', 3, true),
  ('Complementos', 'complementos', 4, true),
  ('Condolencias', 'condolencias', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Make ghl_product_id nullable in products
ALTER TABLE IF EXISTS public.products
ALTER COLUMN ghl_product_id DROP NOT NULL;

-- Drop old constraint
ALTER TABLE IF EXISTS public.products
DROP CONSTRAINT IF EXISTS products_ghl_product_id_key;

-- Create partial unique index instead (allows multiple NULLs)
DROP INDEX IF EXISTS idx_products_ghl_product_id_unique;
CREATE UNIQUE INDEX idx_products_ghl_product_id_unique ON public.products(ghl_product_id)
WHERE ghl_product_id IS NOT NULL;

-- Step 3: Add category_id FK to products (can be null for now)
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Step 4: Make product_images.product_id NOT NULL (require FK)
-- First, delete any rows with NULL product_id
DELETE FROM public.product_images WHERE product_id IS NULL;

-- Then make it required
ALTER TABLE IF EXISTS public.product_images
ALTER COLUMN product_id SET NOT NULL;

-- Step 5: Verify product_options constraints
-- Ensure product_options.product_id is NOT NULL
ALTER TABLE IF EXISTS public.product_options
ALTER COLUMN product_id SET NOT NULL;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON public.product_options(product_id);

-- Step 6: Add metadata columns to products (for future use, not blocking)
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

COMMENT ON TABLE public.categories IS 'Product categories (ramos, plantas, rosas-eternas, complementos, condolencias)';
COMMENT ON COLUMN public.products.category_id IS 'FK to categories table for better normalization';
COMMENT ON COLUMN public.products.ghl_product_id IS 'Legacy: GoHighLevel product ID (NULL for Supabase-only products)';
COMMENT ON COLUMN public.products.metadata IS 'Flexible JSON storage for product metadata';
