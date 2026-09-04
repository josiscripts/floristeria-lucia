SELECT
  p.name,
  po.name as opcion,
  po.price_amount::numeric(10,2) as precio_eur,
  po.sku
FROM products p
JOIN product_options po ON p.id = po.product_id
WHERE p.deleted_at IS NULL
  AND p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
  AND po.active = true
ORDER BY p.name, po.name;
