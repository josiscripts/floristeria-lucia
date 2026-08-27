-- Create product_metadata table for GHL integration
-- Migration: 2026-08-26
-- Purpose: Store technical metadata for GHL products that cannot be stored as custom fields

CREATE TABLE public.product_metadata (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location & Foreign Keys
  location_id TEXT NOT NULL DEFAULT 'vOq7yOWR63XGU4qQ7XWd',
  ghl_product_id TEXT NOT NULL,
  legacy_catalog_id TEXT,

  -- Pricing metadata
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),

  -- Customization
  available_colors TEXT[],
  badge_label TEXT,

  -- Business logic
  rose_step INTEGER,
  requires_quote BOOLEAN DEFAULT false,

  -- Status & tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  auto_created BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT unique_ghl_product_id UNIQUE(location_id, ghl_product_id),
  CONSTRAINT unique_legacy_catalog_id UNIQUE(legacy_catalog_id),
  CONSTRAINT check_price_max CHECK (price_max IS NULL OR price_max > 0),
  CONSTRAINT check_price_min CHECK (price_min IS NULL OR price_min > 0),
  CONSTRAINT check_rose_step CHECK (rose_step IS NULL OR rose_step > 0)
);

-- Create indexes for performance
CREATE INDEX idx_ghl_product_id ON public.product_metadata(ghl_product_id);
CREATE INDEX idx_legacy_catalog_id ON public.product_metadata(legacy_catalog_id);
CREATE INDEX idx_status ON public.product_metadata(status);
CREATE INDEX idx_location_id ON public.product_metadata(location_id);
CREATE INDEX idx_created_at ON public.product_metadata(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_product_metadata_updated_at
BEFORE UPDATE ON public.product_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.product_metadata ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.product_metadata TO anon, authenticated;
GRANT ALL ON public.product_metadata TO service_role;

-- RLS Policies

-- Policy 1: Anon and authenticated users can SELECT active products
CREATE POLICY "read_active_product_metadata"
  ON public.product_metadata
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Policy 2: Service role (backend server-side) can INSERT
CREATE POLICY "insert_product_metadata_service_role"
  ON public.product_metadata
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy 3: Service role can UPDATE
CREATE POLICY "update_product_metadata_service_role"
  ON public.product_metadata
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 4: Service role can DELETE (soft delete via status)
CREATE POLICY "delete_product_metadata_service_role"
  ON public.product_metadata
  FOR DELETE
  TO service_role
  USING (true);

-- Add comment to table
COMMENT ON TABLE public.product_metadata IS 'Technical metadata for GHL products. Stores fields that GHL Products API cannot handle as custom fields.';
COMMENT ON COLUMN public.product_metadata.ghl_product_id IS 'Foreign key to GoHighLevel product ID (_id)';
COMMENT ON COLUMN public.product_metadata.legacy_catalog_id IS 'Reference to original catalog.ts product ID for migration';
COMMENT ON COLUMN public.product_metadata.price_max IS 'Maximum price for range pricing (priceMax in catalog.ts)';
COMMENT ON COLUMN public.product_metadata.available_colors IS 'JSON array of available colors for customization';
COMMENT ON COLUMN public.product_metadata.badge_label IS 'Visual badge/label for the product (Más vendido, Premium, etc.)';
COMMENT ON COLUMN public.product_metadata.rose_step IS 'Multiplier for rose products (e.g., 6 = 1 unit = 6 roses)';
COMMENT ON COLUMN public.product_metadata.status IS 'Soft delete status: active or deleted';
