-- CARGA DE CATÁLOGO REAL - 15 PRODUCTOS
-- Categoría: Plantas y Composiciones (ID: 78a03925-63b1-43c2-aa9c-edcbbdc3ad53)
-- Categoría: Rosas eternas (ID: ebcb68e3-12e2-417b-8ee0-df71d0cf63a9)

-- Función auxiliar para generar UUIDs internos (no GHL)
-- Usaremos UUIDs v4 aleatorios para productos que no tienen GHL ID

-- ============================================================
-- PRODUCTOS CATEGORÍA: PLANTAS Y COMPOSICIONES
-- ============================================================

-- 1. Orquídea 2 varas
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Orquídea 2 varas', 'Orquídea de dos varas. Disponible en varios colores.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, true, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 2. Orquídea 3 varas
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Orquídea 3 varas', 'Orquídea de tres varas. Disponible en varios colores.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, true, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 3. Orquídea azul
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Orquídea azul', 'Orquídea azul de gran belleza y elegancia.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 4. Sanseviera
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Sanseviera', 'Planta resistente de hoja alargada y elegante.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 5. Calathea
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Calathea', 'Planta de hojas decorativas. Disponible en varios tonos de hojas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, true, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 6. Dracaena
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Dracaena', 'Planta de gran tamaño con hojas decorativas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 7. Caja de plantas
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Caja de plantas', 'Caja con composición variada de plantas decorativas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 8. Cesta de plantas
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Cesta de plantas', 'Cesta decorativa con composición de plantas variadas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 9. Anthurium grande
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Anthurium grande', 'Anthurium de gran tamaño con flores exóticas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 10. Anthurium
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Anthurium', 'Planta de flores decorativas de colores vibrantes.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 11. Kentia
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Kentia', 'Kentia de gran tamaño con altura aproximada de 1,70 a 1,80 m.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 12. Schefflera
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Schefflera', 'Planta de hoja elegante y resistente.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 13. Terrario / Ecosistema
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Terrario / Ecosistema', 'Ecosistema cerrado en cristal con plantas diversas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- ============================================================
-- PRODUCTOS CATEGORÍA: ROSAS ETERNAS
-- ============================================================

-- 14. Rosas preservadas de tallo corto
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Rosas preservadas de tallo corto', 'Rosas preservadas de alta calidad con tallo corto. Larga durabilidad.', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9', true, true, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- 15. Rosas preservadas de tallo largo
INSERT INTO products (id, name, description, category_id, active, has_color_variants, ghl_product_id, cover_image_url)
VALUES
  (gen_random_uuid(), 'Rosas preservadas de tallo largo', 'Rosas preservadas de alta calidad con tallo largo. Elegancia y durabilidad.', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9', true, true, gen_random_uuid()::text, NULL)
RETURNING id INTO temp_product_id;

-- ============================================================
-- NOTA IMPORTANTE: Este script genera UUIDs en tiempo de inserción
-- Para usar este script, copiar y ejecutar directamente en Supabase SQL editor
-- O ejecutar via CLI:
-- npx supabase db query --linked < scripts/load_catalog.sql
-- ============================================================
