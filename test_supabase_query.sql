-- Exactamente lo que hace useSupabaseProducts.ts
SELECT
  id,
  ghl_product_id,
  name,
  description,
  category,
  active,
  cover_image_url,
  has_color_variants
FROM products
WHERE active = true
  AND deleted_at IS NULL
ORDER BY name ASC
LIMIT 500;
