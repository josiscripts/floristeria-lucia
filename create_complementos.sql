-- Crear productos de complementos
INSERT INTO products (name, description, category_id, category, active, has_color_variants, ghl_product_id)
VALUES
  ('Globo felicidades', 'Globo decorativo con mensaje de felicidades.', 'ac0ea013-dfd8-416b-a003-1a9ad8bbcc53', 'complementos', true, false, gen_random_uuid()::text),
  ('Bombones Nestlé o Ferrero Rocher', 'Caja de bombones de calidad Nestlé o Ferrero Rocher.', 'ac0ea013-dfd8-416b-a003-1a9ad8bbcc53', 'complementos', true, false, gen_random_uuid()::text),
  ('Vino blanco o rosado Alma', 'Vino blanco o rosado de la marca Alma.', 'ac0ea013-dfd8-416b-a003-1a9ad8bbcc53', 'complementos', true, true, gen_random_uuid()::text),
  ('Oso corazón', 'Peluche de oso con corazón, regalo tierno y adorable.', 'ac0ea013-dfd8-416b-a003-1a9ad8bbcc53', 'complementos', true, false, gen_random_uuid()::text),
  ('Oso niño/niña', 'Peluche de oso disponible en versión niño o niña.', 'ac0ea013-dfd8-416b-a003-1a9ad8bbcc53', 'complementos', true, false, gen_random_uuid()::text),
  ('Pick decoración', 'Pick de madera o plástico para decorar ramos y arreglos.', 'ac0ea013-dfd8-416b-a003-1a9ad8bbcc53', 'complementos', true, false, gen_random_uuid()::text);

-- Crear opciones de precio para cada complemento
INSERT INTO product_options (product_id, name, price_amount, active, sku)
SELECT p.id, 'Estándar', CASE p.name
  WHEN 'Globo felicidades' THEN 5
  WHEN 'Bombones Nestlé o Ferrero Rocher' THEN 10
  WHEN 'Vino blanco o rosado Alma' THEN 10
  WHEN 'Oso corazón' THEN 8
  WHEN 'Oso niño/niña' THEN 11
  WHEN 'Pick decoración' THEN 2
  ELSE 0
END, true, LOWER(REPLACE(p.name, ' ', '-')) || '-std'
FROM products p
WHERE p.category = 'complementos'
  AND p.deleted_at IS NULL
  AND p.name IN ('Globo felicidades', 'Bombones Nestlé o Ferrero Rocher', 'Vino blanco o rosado Alma', 'Oso corazón', 'Oso niño/niña', 'Pick decoración');

-- Verificar
SELECT name, category FROM products WHERE category = 'complementos' AND deleted_at IS NULL;
