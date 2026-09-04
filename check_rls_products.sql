-- Verificar políticas RLS en products
SELECT tablename, policyname, roles, qual, permissive FROM pg_policies WHERE tablename = 'products';
