-- DIAGNÓSTICO DE PEDIDOS - FASE 3
-- Investigar y limpiar pedidos de prueba

-- 1. Contar pedidos totales (incluyendo eliminados)
SELECT COUNT(*) as "Total orders (all):" FROM public.orders;

-- 2. Contar pedidos activos (no eliminados)
SELECT COUNT(*) as "Active orders (deleted_at IS NULL):" FROM public.orders WHERE deleted_at IS NULL;

-- 3. Listar todos los pedidos activos con detalles
SELECT
  id,
  order_number,
  customer_name,
  customer_email,
  status,
  created_at,
  user_id,
  deleted_at
FROM public.orders
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- 4. Contar pedidos por estado
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count
FROM public.orders
GROUP BY status
ORDER BY status;

-- 5. Verificar si hay order_items para cada orden activa
SELECT
  o.id as order_id,
  o.order_number,
  COUNT(oi.id) as item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.order_number
ORDER BY o.created_at DESC;
