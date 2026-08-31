-- FASE 3A MIGRATION - Execute in Supabase SQL Editor
-- Project: leksmflinhohnekbgmgj
-- URL: https://leksmflinhohnekbgmgj.supabase.co
--
-- INSTRUCCIONES:
-- 1. Ve a https://app.supabase.com/project/leksmflinhohnekbgmgj/sql/new
-- 2. Copia y pega TODO este archivo
-- 3. Haz clic en "Run" o presiona Ctrl+Enter
-- 4. Espera a que termine
-- 5. Ejecuta scripts/check-supabase-data.cjs para verificar

-- Add category column
ALTER TABLE product_metadata ADD COLUMN IF NOT EXISTS category varchar;

-- Add sku column with UNIQUE constraint
ALTER TABLE product_metadata ADD COLUMN IF NOT EXISTS sku varchar UNIQUE;

-- Create index on category for performance
CREATE INDEX IF NOT EXISTS idx_product_metadata_category ON product_metadata(category);

-- Create index on sku for lookups
CREATE INDEX IF NOT EXISTS idx_product_metadata_sku ON product_metadata(sku);

-- Add comments for documentation
COMMENT ON COLUMN product_metadata.category IS 'Product category: ramos, plantas, rosas-eternas, complementos, condolencias';
COMMENT ON COLUMN product_metadata.sku IS 'Unique product SKU: FL-{CAT}-{NUM}';

-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'product_metadata' AND column_name IN ('category', 'sku')
ORDER BY ordinal_position;
