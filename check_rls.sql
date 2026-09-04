-- Verificar si hay RLS policies que bloqueen lectura
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('products', 'categories', 'product_options', 'product_images')
ORDER BY tablename, policyname;
