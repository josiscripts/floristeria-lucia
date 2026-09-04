-- Ver si hay productos viejos con categoría en el campo "category"
SELECT
  p.name,
  p.category,
  p.category_id,
  p.created_at
FROM products p
WHERE p.deleted_at IS NULL
  AND p.category IS NOT NULL
LIMIT 10;
