-- Actualizar URLs de /src/assets/ a /assets/
UPDATE product_images
SET image_url = REPLACE(image_url, '/src/assets/', '/assets/'),
    storage_path = REPLACE(storage_path, '/src/assets/', '/assets/')
WHERE storage_path LIKE '/src/assets/%';

-- Verificar
SELECT image_url FROM product_images WHERE storage_path LIKE '/assets/%' LIMIT 5;
