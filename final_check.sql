-- Verificación FINAL de todo
SELECT
  p.id,
  p.name,
  p.category,
  p.active,
  (SELECT COUNT(*) FROM product_options WHERE product_id = p.id) as opciones,
  (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as imagenes,
  (SELECT COUNT(*) FROM color_variants WHERE product_id = p.id) as colores
FROM products p
WHERE p.active = true
  AND p.deleted_at IS NULL
  AND p.category IN ('plantas', 'rosas-eternas')
ORDER BY p.category, p.name;
