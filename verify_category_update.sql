-- Verificar que el UPDATE de category se aplicó
SELECT name, category, category_id FROM products WHERE deleted_at IS NULL ORDER BY name LIMIT 20;
