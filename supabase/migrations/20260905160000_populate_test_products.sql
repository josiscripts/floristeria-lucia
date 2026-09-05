-- FASE 5.1: Populate Supabase with test products to demonstrate unified source of truth
-- Simple migration: insert test products with their price options
-- Products are Supabase-only (ghl_product_id is NULL)

BEGIN;

-- Clean up existing test data (idempotent)
DELETE FROM color_variants WHERE product_id IN (
  SELECT id FROM products WHERE ghl_product_id IS NULL AND name IN (
    'Ramo Silvestre', 'Ramo Felicidad', 'Ramo Alegría', 'Ramo de Girasoles',
    'Ramo Belleza', 'Ramo de Rosas', 'Anthurium', 'Taza de Plantas',
    'Cesta de Mimbre', 'Bonsai Ficus Ginseng', 'Calathea', 'Caja de Rosas Eternas',
    'Arco de Rosas Eternas', 'Jarrón de Cristal', 'Caja de Bombones',
    'Cruz de Flores', 'Ramo de Condolencias'
  )
);

DELETE FROM product_options WHERE product_id IN (
  SELECT id FROM products WHERE ghl_product_id IS NULL AND name IN (
    'Ramo Silvestre', 'Ramo Felicidad', 'Ramo Alegría', 'Ramo de Girasoles',
    'Ramo Belleza', 'Ramo de Rosas', 'Anthurium', 'Taza de Plantas',
    'Cesta de Mimbre', 'Bonsai Ficus Ginseng', 'Calathea', 'Caja de Rosas Eternas',
    'Arco de Rosas Eternas', 'Jarrón de Cristal', 'Caja de Bombones',
    'Cruz de Flores', 'Ramo de Condolencias'
  )
);

DELETE FROM products WHERE ghl_product_id IS NULL AND name IN (
  'Ramo Silvestre', 'Ramo Felicidad', 'Ramo Alegría', 'Ramo de Girasoles',
  'Ramo Belleza', 'Ramo de Rosas', 'Anthurium', 'Taza de Plantas',
  'Cesta de Mimbre', 'Bonsai Ficus Ginseng', 'Calathea', 'Caja de Rosas Eternas',
  'Arco de Rosas Eternas', 'Jarrón de Cristal', 'Caja de Bombones',
  'Cruz de Flores', 'Ramo de Condolencias'
);

-- Insert test products (UUIDs auto-generated)
INSERT INTO products (name, description, category, active, cover_image_url, has_color_variants, ghl_product_id)
VALUES
  ('Ramo Silvestre', 'Flor variada de temporada con aire campestre y mucho movimiento.', 'ramos', true, null, false, null),
  ('Ramo Felicidad', 'Tonos luminosos en rosa y blanco para celebrar buenas noticias.', 'ramos', true, null, false, null),
  ('Ramo Alegría', 'Colores vivos y contrastados, un ramo que se ve desde lejos.', 'ramos', true, null, false, null),
  ('Ramo de Girasoles', 'Girasoles frescos combinados con verdes de temporada.', 'ramos', true, null, false, null),
  ('Ramo Belleza', 'Composición romántica en gamas rosadas y blancas.', 'ramos', true, null, false, null),
  ('Ramo de Rosas', 'Ramo de rosas frescas. La cantidad se monta en múltiplos de 6 rosas (1 = 6 rosas).', 'ramos', true, null, true, null),
  ('Anthurium', 'Planta de interior de flor duradera y hoja brillante.', 'plantas', true, null, false, null),
  ('Taza de Plantas', 'Composición de plantas variadas en taza de cerámica.', 'plantas', true, null, false, null),
  ('Cesta de Mimbre', 'Cesta con plantas de interior variadas y arreglo floral.', 'plantas', true, null, false, null),
  ('Bonsai Ficus Ginseng', 'Pequeño árbol decorativo, fácil cuidado, ideal para escritorio.', 'plantas', true, null, false, null),
  ('Calathea', 'Planta de hojas grandes y vistosas, requiere humedad.', 'plantas', true, null, false, null),
  ('Caja de Rosas Eternas', 'Caja con rosas preservadas que duran 7-10 años.', 'rosas-eternas', true, null, true, null),
  ('Arco de Rosas Eternas', 'Arco decorativo con rosas preservadas.', 'rosas-eternas', true, null, true, null),
  ('Jarrón de Cristal', 'Jarrón decorativo para flores cortadas.', 'complementos', true, null, false, null),
  ('Caja de Bombones', 'Bombones artesanales de chocolate belga.', 'complementos', true, null, false, null),
  ('Cruz de Flores', 'Cruz floral para ceremonias y despedidas.', 'condolencias', true, null, false, null),
  ('Ramo de Condolencias', 'Ramo blanco y lila para expresar condolencias.', 'condolencias', true, null, false, null);

-- Get the IDs of newly inserted products and create options with prices
-- Use gen_random_uuid() for unique SKUs to avoid conflicts
INSERT INTO product_options (product_id, name, price_amount, discount_percent, stock_quantity, sku, active)
SELECT id, 'Estándar', price, 0, null, 'FL-' || gen_random_uuid()::text, true
FROM (
  SELECT (SELECT id FROM products WHERE name = 'Ramo Silvestre' LIMIT 1) as id, 37.50::numeric as price
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Ramo Felicidad' LIMIT 1), 42.50
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Ramo Alegría' LIMIT 1), 42.50
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Ramo de Girasoles' LIMIT 1), 37.50
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Ramo Belleza' LIMIT 1), 37.50
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Ramo de Rosas' LIMIT 1), 36.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Anthurium' LIMIT 1), 25.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Taza de Plantas' LIMIT 1), 48.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Cesta de Mimbre' LIMIT 1), 55.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Bonsai Ficus Ginseng' LIMIT 1), 45.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Calathea' LIMIT 1), 40.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Caja de Rosas Eternas' LIMIT 1), 120.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Arco de Rosas Eternas' LIMIT 1), 150.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Jarrón de Cristal' LIMIT 1), 35.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Caja de Bombones' LIMIT 1), 28.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Cruz de Flores' LIMIT 1), 85.00
  UNION ALL SELECT (SELECT id FROM products WHERE name = 'Ramo de Condolencias' LIMIT 1), 60.00
) AS prices;

-- Insert color variants for products with has_color_variants = true
INSERT INTO color_variants (product_id, name, sort_order, active)
SELECT (SELECT id FROM products WHERE name = 'Ramo de Rosas' LIMIT 1), name, sort_order, true
FROM (VALUES
  ('Rojo', 1),
  ('Rosa', 2),
  ('Blanco', 3),
  ('Azul', 4),
  ('Lila', 5),
  ('Amarillo', 6)
) AS colors(name, sort_order)
UNION ALL
SELECT (SELECT id FROM products WHERE name = 'Caja de Rosas Eternas' LIMIT 1), name, sort_order, true
FROM (VALUES
  ('Rojo', 1),
  ('Rosa', 2),
  ('Blanco', 3),
  ('Lila', 4)
) AS colors(name, sort_order)
UNION ALL
SELECT (SELECT id FROM products WHERE name = 'Arco de Rosas Eternas' LIMIT 1), name, sort_order, true
FROM (VALUES
  ('Rojo', 1),
  ('Rosa', 2),
  ('Blanco', 3)
) AS colors(name, sort_order);

-- Verify results
SELECT COUNT(*) as total_products FROM products WHERE active = true AND deleted_at IS NULL;
SELECT COUNT(*) as total_options FROM product_options WHERE active = true;
SELECT COUNT(*) as total_colors FROM color_variants WHERE active = true;

COMMIT;
