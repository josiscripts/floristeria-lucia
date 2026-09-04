-- Actualizar URLs para que funcionen en desarrollo con Vite
UPDATE product_images
SET image_url = '/src/assets/' || SUBSTRING(image_url FROM 9), -- Cambia /assets/ a /src/assets/
    storage_path = '/src/assets/' || SUBSTRING(storage_path FROM 9)
WHERE storage_path LIKE '/assets/%';

-- Verificar
SELECT image_url, storage_path FROM product_images WHERE storage_path LIKE '/src/assets/%' LIMIT 5;
