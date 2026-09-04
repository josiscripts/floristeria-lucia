SELECT 'TOTAL' as metric, COUNT(*)::text as value FROM products WHERE deleted_at IS NULL AND category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
UNION ALL
SELECT 'Plantas y Composiciones', COUNT(*)::text FROM products WHERE deleted_at IS NULL AND category_id = '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'
UNION ALL
SELECT 'Rosas eternas', COUNT(*)::text FROM products WHERE deleted_at IS NULL AND category_id = 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9'
UNION ALL
SELECT 'Total opciones de precio', COUNT(*)::text FROM product_options WHERE active = true
UNION ALL
SELECT 'Con color_variants', COUNT(DISTINCT p.id)::text FROM products p WHERE p.has_color_variants = true AND p.deleted_at IS NULL AND p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9');
