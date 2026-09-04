-- Ver qué contiene el campo "category" vs "category_id"
SELECT
  p.id,
  p.name,
  p.category,
  p.category_id,
  c.name as category_name,
  c.slug as category_slug,
  p.active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 30;
