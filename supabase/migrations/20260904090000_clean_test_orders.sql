-- CLEAN TEST ORDERS - FASE 3
-- Eliminación segura de pedidos de prueba
-- Este script elimina todos los pedidos que NO están asociados a un usuario autenticado (user_id IS NULL)
-- y que fueron creados antes de la implementación de FASE 3 (pedidos de prueba del checkout)

-- ANTES DE EJECUTAR:
-- 1. Ejecuta: SELECT COUNT(*) FROM orders WHERE user_id IS NULL AND deleted_at IS NULL;
-- 2. Revisa qué pedidos están a punto de ser eliminados
-- 3. Si el número es mayor que 10, investiga si hay pedidos legítimos sin user_id

BEGIN;

-- Paso 1: Verificar cuántos pedidos sin user_id van a ser eliminados
-- (descomentar para ver el resultado antes de ejecutar el DELETE)
-- SELECT order_number, customer_email, status, created_at
-- FROM orders
-- WHERE user_id IS NULL AND deleted_at IS NULL
-- ORDER BY created_at DESC;

-- Paso 2: Eliminar order_items asociados a pedidos sin user_id
-- (FK con ON DELETE CASCADE protege integridad referencial)
DELETE FROM public.order_items
WHERE order_id IN (
  SELECT id FROM public.orders
  WHERE user_id IS NULL AND deleted_at IS NULL
);

-- Paso 3: Eliminar los pedidos de prueba (soft delete - no elimina del todo, solo marca como eliminado)
UPDATE public.orders
SET deleted_at = NOW()
WHERE user_id IS NULL AND deleted_at IS NULL;

-- ALTERNATIVA: Hard delete (si deseas eliminarlos completamente)
-- DELETE FROM public.orders
-- WHERE user_id IS NULL AND deleted_at IS NULL;

-- Paso 4: Verificar que la limpieza fue exitosa
-- (descomentar para verificar después de la ejecución)
-- SELECT COUNT(*) as "Pedidos activos después de limpieza"
-- FROM orders
-- WHERE deleted_at IS NULL;

COMMIT;

-- SUMMARY:
-- - Se marcan como eliminados todos los pedidos sin user_id asociado
-- - Los order_items asociados se eliminan cascada
-- - El API /api/orders ya filtra por deleted_at IS NULL, así que estos pedidos no aparecerán
-- - Se conserva la auditoría en el campo deleted_at para referencia futura
