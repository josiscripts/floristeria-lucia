SELECT 
  COUNT(*) as total_products,
  array_agg(DISTINCT category) as categories,
  array_agg(DISTINCT active) as active_statuses
FROM products 
WHERE deleted_at IS NULL;
