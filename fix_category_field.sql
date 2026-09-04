-- Actualizar el campo "category" basándose en category_id
-- Mapear category_id → category (slug)

UPDATE products
SET category = c.slug
FROM categories c
WHERE products.category_id = c.id
  AND products.deleted_at IS NULL;

-- Verificar que se llenó correctamente
SELECT name, category, category_id FROM products WHERE deleted_at IS NULL LIMIT 20;
