-- Agregar color_variants para productos con múltiples colores
-- Solo para productos que tienen has_color_variants = true

INSERT INTO public.color_variants (product_id, name, active)
SELECT p.id, color, true
FROM (
  SELECT id, name FROM products WHERE name = 'Orquídea 2 varas' AND deleted_at IS NULL LIMIT 1
) p
CROSS JOIN (
  VALUES ('Blanco'), ('Morado'), ('Rojo'), ('Rosa'), ('Amarillo')
) AS colors(color)

UNION ALL

SELECT p.id, color, true
FROM (
  SELECT id, name FROM products WHERE name = 'Orquídea 3 varas' AND deleted_at IS NULL LIMIT 1
) p
CROSS JOIN (
  VALUES ('Blanco'), ('Morado'), ('Rojo'), ('Rosa'), ('Amarillo')
) AS colors(color)

UNION ALL

SELECT p.id, color, true
FROM (
  SELECT id, name FROM products WHERE name = 'Calathea' AND deleted_at IS NULL LIMIT 1
) p
CROSS JOIN (
  VALUES ('Verde oscuro'), ('Verde claro'), ('Tonos mixtos')
) AS colors(color)

UNION ALL

SELECT p.id, color, true
FROM (
  SELECT id, name FROM products WHERE name = 'Rosas preservadas de tallo corto' AND deleted_at IS NULL LIMIT 1
) p
CROSS JOIN (
  VALUES ('Roja'), ('Blanca'), ('Rosa'), ('Salmón'), ('Champagne')
) AS colors(color)

UNION ALL

SELECT p.id, color, true
FROM (
  SELECT id, name FROM products WHERE name = 'Rosas preservadas de tallo largo' AND deleted_at IS NULL LIMIT 1
) p
CROSS JOIN (
  VALUES ('Roja'), ('Blanca'), ('Rosa'), ('Salmón'), ('Champagne')
) AS colors(color);
