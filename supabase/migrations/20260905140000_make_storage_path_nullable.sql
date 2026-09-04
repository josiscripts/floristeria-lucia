-- Make storage_path nullable in product_images
-- Reason: For Supabase-only products, image_url is sufficient; storage_path is optional
-- This allows more flexibility in image management

ALTER TABLE IF EXISTS public.product_images
ALTER COLUMN storage_path DROP NOT NULL;

-- Add default empty string if needed for backward compatibility
ALTER TABLE IF EXISTS public.product_images
ALTER COLUMN storage_path SET DEFAULT '';
