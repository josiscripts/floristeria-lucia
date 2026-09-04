-- Exactamente lo que hace useSupabaseProducts.ts con relaciones anidadas
-- Esta es la query que el catálogo usa
SELECT
  p.id,
  p.ghl_product_id,
  p.name,
  p.description,
  p.category,
  p.active,
  p.cover_image_url,
  p.has_color_variants,
  -- Relaciones: product_options
  COALESCE(
    jsonb_agg(
      CASE WHEN po.id IS NOT NULL THEN
        jsonb_build_object(
          'id', po.id,
          'name', po.name,
          'price_amount', po.price_amount,
          'discount_percent', po.discount_percent,
          'price_final', po.price_final,
          'stock_quantity', po.stock_quantity,
          'sku', po.sku,
          'ghl_price_id', po.ghl_price_id
        )
      END
    ) FILTER (WHERE po.id IS NOT NULL),
    '[]'::jsonb
  ) as product_options,
  -- Relaciones: color_variants
  COALESCE(
    jsonb_agg(
      CASE WHEN cv.id IS NOT NULL THEN
        jsonb_build_object(
          'id', cv.id,
          'name', cv.name,
          'sort_order', cv.sort_order
        )
      END
    ) FILTER (WHERE cv.id IS NOT NULL),
    '[]'::jsonb
  ) as color_variants,
  -- Relaciones: product_images
  COALESCE(
    jsonb_agg(
      CASE WHEN pi.id IS NOT NULL THEN
        jsonb_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'color_variant_id', pi.color_variant_id,
          'is_primary', pi.is_primary,
          'sort_order', pi.sort_order
        )
      END
    ) FILTER (WHERE pi.id IS NOT NULL),
    '[]'::jsonb
  ) as product_images
FROM products p
LEFT JOIN product_options po ON p.id = po.product_id
LEFT JOIN color_variants cv ON p.id = cv.product_id
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.active = true
  AND p.deleted_at IS NULL
GROUP BY p.id, p.ghl_product_id, p.name, p.description, p.category, p.active, p.cover_image_url, p.has_color_variants
ORDER BY p.name ASC
LIMIT 500;
