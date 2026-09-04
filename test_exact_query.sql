-- Simular el query exacto que usa useSupabaseProducts
-- NOTA: Supabase CLI no soporta relaciones anidadas en select()
-- Pero podemos ver si hay un problema con los datos base

SELECT 
  p.id,
  p.name,
  p.category,
  p.active,
  p.deleted_at,
  (SELECT COUNT(*) FROM product_options WHERE product_id = p.id) as option_count,
  (SELECT COUNT(*) FROM color_variants WHERE product_id = p.id) as variant_count,
  (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as image_count
FROM products p
WHERE p.active = true AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 5;
