-- CARGA DE CATÁLOGO REAL - 15 PRODUCTOS
-- Ejecutar via: npx supabase db query --linked < scripts/load_catalog_final.sql

-- Categorías ya existen:
-- Plantas y Composiciones: 78a03925-63b1-43c2-aa9c-edcbbdc3ad53
-- Rosas eternas: ebcb68e3-12e2-417b-8ee0-df71d0cf63a9

-- ============================================================
-- INSERTS PRODUCTOS + OPTIONS DE PRECIO
-- ============================================================

WITH plantas_productos AS (
  INSERT INTO public.products (name, description, category_id, active, has_color_variants, ghl_product_id)
  VALUES
    ('Orquídea 2 varas', 'Orquídea de dos varas. Disponible en varios colores.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, true, gen_random_uuid()::text),
    ('Orquídea 3 varas', 'Orquídea de tres varas. Disponible en varios colores.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, true, gen_random_uuid()::text),
    ('Orquídea azul', 'Orquídea azul de gran belleza y elegancia.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Sanseviera', 'Planta resistente de hoja alargada y elegante.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Calathea', 'Planta de hojas decorativas. Disponible en varios tonos de hojas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, true, gen_random_uuid()::text),
    ('Dracaena', 'Planta de gran tamaño con hojas decorativas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Caja de plantas', 'Caja con composición variada de plantas decorativas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Cesta de plantas', 'Cesta decorativa con composición de plantas variadas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Anthurium grande', 'Anthurium de gran tamaño con flores exóticas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Anthurium', 'Planta de flores decorativas de colores vibrantes.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Kentia', 'Kentia de gran tamaño con altura aproximada de 1,70 a 1,80 m.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Schefflera', 'Planta de hoja elegante y resistente.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text),
    ('Terrario / Ecosistema', 'Ecosistema cerrado en cristal con plantas diversas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53'::uuid, true, false, gen_random_uuid()::text)
  RETURNING id, name, 30 as precio_1, 35 as precio_2, 37 as precio_3, 25 as precio_4, 27 as precio_5, 27 as precio_6, 59 as precio_7, 51 as precio_8, 33 as precio_9, 25 as precio_10, 90 as precio_11, 31 as precio_12, 38 as precio_13
),
rosas_productos AS (
  INSERT INTO public.products (name, description, category_id, active, has_color_variants, ghl_product_id)
  VALUES
    ('Rosas preservadas de tallo corto', 'Rosas preservadas de alta calidad con tallo corto. Larga durabilidad.', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9'::uuid, true, true, gen_random_uuid()::text),
    ('Rosas preservadas de tallo largo', 'Rosas preservadas de alta calidad con tallo largo. Elegancia y durabilidad.', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9'::uuid, true, true, gen_random_uuid()::text)
  RETURNING id, name, 13 as precio, 19 as precio_2
)
SELECT COUNT(*) as total_inserted FROM (
  SELECT * FROM plantas_productos
  UNION ALL
  SELECT id, name, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM rosas_productos
);
