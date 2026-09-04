-- Verificación de productos cargados

-- 1. Contar productos por categoría
SELECT
  c.name as category,
  COUNT(p.id) as product_count
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.deleted_at IS NULL
GROUP BY c.id, c.name;

-- 2. Listar todos los productos con opciones de precio
SELECT
  p.name,
  p.has_color_variants,
  COUNT(po.id) as option_count,
  STRING_AGG(DISTINCT po.name, ', ') as option_names,
  STRING_AGG(DISTINCT po.price_amount::text, ', ') as prices
FROM products p
LEFT JOIN product_options po ON p.id = po.product_id AND po.active = true
WHERE p.deleted_at IS NULL
  AND p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
GROUP BY p.id, p.name, p.has_color_variants
ORDER BY p.name;

-- 3. Validar duplicados
SELECT name, COUNT(*) as count
FROM products
WHERE deleted_at IS NULL
  AND category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
GROUP BY name
HAVING COUNT(*) > 1;
