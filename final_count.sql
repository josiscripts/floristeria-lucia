-- Conteo final de productos
SELECT
  category,
  COUNT(*) as count
FROM products
WHERE deleted_at IS NULL AND active = true
GROUP BY category
ORDER BY category;

-- Total general
SELECT COUNT(*) as total_products FROM products WHERE deleted_at IS NULL AND active = true;
