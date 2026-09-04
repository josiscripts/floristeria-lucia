-- Clean up all product data for FASE 2 restart
-- This removes all local products to start fresh
-- Product tables and structure are preserved
-- GHL integration remains intact

-- Delete in correct order to respect FK constraints

-- 1. Delete product_images (has FK to products/color_variants)
DELETE FROM public.product_images;

-- 2. Delete color_variants (has FK to products)
DELETE FROM public.color_variants;

-- 3. Delete product_options (has FK to products)
DELETE FROM public.product_options;

-- 4. Delete product_metadata (has GHL references)
DELETE FROM public.product_metadata;

-- 5. Finally, delete products
DELETE FROM public.products;

-- Verify deletions
-- SELECT COUNT(*) FROM public.products; -- Should be 0
-- SELECT COUNT(*) FROM public.product_options; -- Should be 0
-- SELECT COUNT(*) FROM public.color_variants; -- Should be 0
-- SELECT COUNT(*) FROM public.product_images; -- Should be 0
-- SELECT COUNT(*) FROM public.product_metadata; -- Should be 0
