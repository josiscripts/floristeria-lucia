-- Cargar 15 productos del catálogo en Supabase
-- Ejecutar: npx supabase db query --linked < load_products.sql

-- Plantas y Composiciones: 78a03925-63b1-43c2-aa9c-edcbbdc3ad53
-- Rosas eternas: ebcb68e3-12e2-417b-8ee0-df71d0cf63a9

INSERT INTO public.products (name, description, category_id, active, has_color_variants, ghl_product_id)
VALUES
  ('Orquídea 2 varas', 'Orquídea de dos varas. Disponible en varios colores.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, true, gen_random_uuid()::text),
  ('Orquídea 3 varas', 'Orquídea de tres varas. Disponible en varios colores.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, true, gen_random_uuid()::text),
  ('Orquídea azul', 'Orquídea azul de gran belleza y elegancia.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Sanseviera', 'Planta resistente de hoja alargada y elegante.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Calathea', 'Planta de hojas decorativas. Disponible en varios tonos de hojas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, true, gen_random_uuid()::text),
  ('Dracaena', 'Planta de gran tamaño con hojas decorativas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Caja de plantas', 'Caja con composición variada de plantas decorativas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Cesta de plantas', 'Cesta decorativa con composición de plantas variadas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Anthurium grande', 'Anthurium de gran tamaño con flores exóticas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Anthurium', 'Planta de flores decorativas de colores vibrantes.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Kentia', 'Kentia de gran tamaño con altura aproximada de 1,70 a 1,80 m.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Schefflera', 'Planta de hoja elegante y resistente.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Terrario / Ecosistema', 'Ecosistema cerrado en cristal con plantas diversas.', '78a03925-63b1-43c2-aa9c-edcbbdc3ad53', true, false, gen_random_uuid()::text),
  ('Rosas preservadas de tallo corto', 'Rosas preservadas de alta calidad con tallo corto. Larga durabilidad.', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9', true, true, gen_random_uuid()::text),
  ('Rosas preservadas de tallo largo', 'Rosas preservadas de alta calidad con tallo largo. Elegancia y durabilidad.', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9', true, true, gen_random_uuid()::text);

-- Crear producto_options con los precios correspondientes
-- Los IDs de productos se crearán automáticamente con gen_random_uuid()
-- Por lo que necesitamos obtener los IDs creados arriba

INSERT INTO public.product_options (product_id, name, price_amount, active, sku)
SELECT p.id, 'Estándar', CASE p.name
  WHEN 'Orquídea 2 varas' THEN 30
  WHEN 'Orquídea 3 varas' THEN 35
  WHEN 'Orquídea azul' THEN 37
  WHEN 'Sanseviera' THEN 25
  WHEN 'Calathea' THEN 27
  WHEN 'Dracaena' THEN 27
  WHEN 'Caja de plantas' THEN 59
  WHEN 'Cesta de plantas' THEN 51
  WHEN 'Anthurium grande' THEN 33
  WHEN 'Anthurium' THEN 25
  WHEN 'Kentia' THEN 90
  WHEN 'Schefflera' THEN 31
  WHEN 'Terrario / Ecosistema' THEN 38
  WHEN 'Rosas preservadas de tallo corto' THEN 13
  WHEN 'Rosas preservadas de tallo largo' THEN 19
  ELSE 0
END as price, true, CONCAT(REPLACE(LOWER(p.name), ' ', '-'), '-std')
FROM public.products p
WHERE p.deleted_at IS NULL
  AND p.category_id IN ('78a03925-63b1-43c2-aa9c-edcbbdc3ad53', 'ebcb68e3-12e2-417b-8ee0-df71d0cf63a9')
ORDER BY p.created_at DESC
LIMIT 15;
