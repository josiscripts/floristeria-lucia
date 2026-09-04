SELECT id, name, category, category_id, active, deleted_at FROM products WHERE category = 'condolencias' AND deleted_at IS NULL LIMIT 1;
