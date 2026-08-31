-- Migration: Add category and sku to product_metadata
-- Date: 2026-08-31
-- Purpose: Store product categorization and SKU in Supabase

-- Add category column (nullable, will be populated)
ALTER TABLE IF EXISTS product_metadata
ADD COLUMN IF NOT EXISTS category varchar;

-- Add sku column (unique, nullable)
ALTER TABLE IF EXISTS product_metadata
ADD COLUMN IF NOT EXISTS sku varchar UNIQUE;

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_product_metadata_category
ON product_metadata(category);

-- Create index on sku for lookups
CREATE INDEX IF NOT EXISTS idx_product_metadata_sku
ON product_metadata(sku);

-- Comment on columns for documentation
COMMENT ON COLUMN product_metadata.category IS 'Product category: ramos, plantas, rosas-eternas, complementos, condolencias';
COMMENT ON COLUMN product_metadata.sku IS 'Unique product SKU: FL-{CAT}-{NUM}';
