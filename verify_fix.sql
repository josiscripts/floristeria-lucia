-- Verificar que el query ahora retorna categorías correctas
SELECT
  p.id,
  p.name,
  p.category,
  p.active,
  COUNT(DISTINCT po.id) as num_opciones,
  COUNT(DISTINCT cv.id) as num_colores,
  COUNT(DISTINCT pi.id) as num_imagenes
FROM products p
LEFT JOIN product_options po ON p.id = po.product_id
LEFT JOIN color_variants cv ON p.id = cv.product_id
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.active = true
  AND p.deleted_at IS NULL
  AND p.category IN ('plantas', 'rosas-eternas')
GROUP BY p.id, p.name, p.category, p.active
ORDER BY p.category, p.name;
