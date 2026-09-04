-- Verificación final de la carga de catálogo

-- 1. Productos con todas sus relaciones
SELECT
  p.id,
  p.name,
  c.name as category,
  p.has_color_variants,
  COUNT(DISTINCT po.id) as num_opciones,
  COUNT(DISTINCT cv.id) as num_colores
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN product_options po ON p.id = po.product_id AND po.active = true
LEFT JOIN color_variants cv ON p.id = cv.product_id AND cv.active = true
WHERE p.deleted_at IS NULL
  AND p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
GROUP BY p.id, p.name, c.name, p.has_color_variants
ORDER BY p.name;

-- 2. Detalle de precios
SELECT
  p.name,
  po.name as option_name,
  po.price_amount,
  po.sku
FROM products p
JOIN product_options po ON p.id = po.product_id
WHERE p.deleted_at IS NULL
  AND p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
  AND po.active = true
ORDER BY p.name, po.name;

-- 3. Color variants disponibles
SELECT
  p.name as producto,
  cv.name as color,
  cv.active
FROM products p
JOIN color_variants cv ON p.id = cv.product_id
WHERE p.deleted_at IS NULL
  AND p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
  AND cv.active = true
ORDER BY p.name, cv.name;
