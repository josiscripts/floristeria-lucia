SELECT
  p.name,
  c.name as category,
  CASE WHEN p.has_color_variants THEN 'Sí' ELSE 'No' END as tiene_colores,
  COUNT(DISTINCT po.id) as num_opciones,
  COUNT(DISTINCT cv.id) as num_colores
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN product_options po ON p.id = po.product_id AND po.active = true
LEFT JOIN color_variants cv ON p.id = cv.product_id AND cv.active = true
WHERE p.deleted_at IS NULL
  AND p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
GROUP BY p.id, p.name, c.name, p.has_color_variants
ORDER BY c.name, p.name;
