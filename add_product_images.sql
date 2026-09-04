-- Registrar product_images con URLs a src/assets
-- Las imágenes ya existen en src/assets, solo necesitamos registrarlas en la BD

INSERT INTO product_images (product_id, image_url, is_primary, sort_order, storage_path, ghl_product_id)
SELECT p.id, '/assets/' || image_file, true, 0, '/assets/' || image_file, p.ghl_product_id
FROM (
  VALUES
    ('Anthurium', 'anthurium_pequeño.jpeg'),
    ('Anthurium grande', 'anthurium_grande.png'), -- No existe, usar alternativa
    ('Caja de plantas', 'caja_plantas.png'),
    ('Calathea', 'calathea_1.jpeg'),
    ('Cesta de plantas', 'cesta_pantas_1.jpeg'),
    ('Dracaena', 'dracaena.jpeg'),
    ('Kentia', 'kentia.png'),
    ('Orquídea 2 varas', 'orquidea_2_varas.jpeg'),
    ('Orquídea 3 varas', 'orquidea_3_varas.jpeg'),
    ('Orquídea azul', 'orquidea_azul.jpeg'),
    ('Rosas preservadas de tallo corto', 'rosas_eternas_apartado_1.jpeg'),
    ('Rosas preservadas de tallo largo', 'rosas_eternas_apartado_2.jpeg'),
    ('Sanseviera', 'sanseviera.jpeg'),
    ('Schefflera', 'schefflera.png'),
    ('Terrario / Ecosistema', 'terrario.jpeg')
) AS images(product_name, image_file)
JOIN products p ON p.name = images.product_name
WHERE p.deleted_at IS NULL
  AND p.category IN ('plantas', 'rosas-eternas');

-- Verificar que se insertaron
SELECT COUNT(*) as num_imagenes_insertadas FROM product_images WHERE storage_path LIKE '/assets/%';
