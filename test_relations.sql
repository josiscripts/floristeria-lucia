-- Probar si el select con relaciones anidadas funciona
-- Este es un test, Supabase CLI podría no soportar la sintaxis, necesitaríamos JavaScript
-- Pero podemos probar el join manual

SELECT
  p.id,
  p.name,
  jsonb_agg(
    jsonb_build_object(
      'id', po.id,
      'name', po.name,
      'price_amount', po.price_amount
    )
  ) FILTER (WHERE po.id IS NOT NULL) as product_options,
  (SELECT jsonb_agg(
    jsonb_build_object('id', cv.id, 'name', cv.name)
  ) FROM color_variants cv WHERE cv.product_id = p.id) as color_variants,
  (SELECT jsonb_agg(
    jsonb_build_object('id', pi.id, 'image_url', pi.image_url)
  ) FROM product_images pi WHERE pi.product_id = p.id) as product_images
FROM products p
LEFT JOIN product_options po ON p.id = po.product_id
WHERE p.active = true AND p.deleted_at IS NULL
GROUP BY p.id, p.name
LIMIT 1;
