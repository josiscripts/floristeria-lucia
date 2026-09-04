SELECT category, COUNT(*) FROM products WHERE deleted_at IS NULL AND active = true GROUP BY category;
