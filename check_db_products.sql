-- Verificar los 15 productos cargados
SELECT
  p.id,
  p.name,
  p.active,
  p.category_id,
  c.name as category_name,
  COUNT(DISTINCT po.id) as num_opciones,
  COUNT(DISTINCT pi.id) as num_imagenes,
  COUNT(DISTINCT cv.id) as num_colores
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_options po ON p.id = po.product_id
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN color_variants cv ON p.id = cv.product_id
WHERE p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
  AND p.deleted_at IS NULL
GROUP BY p.id, p.name, p.active, p.category_id, c.name
ORDER BY p.name;
