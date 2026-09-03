-- DEPRECATED: This migration is no longer needed
-- The creation migration (20260901120000_create_category_to_ghl_collection.sql)
-- has been updated to NOT include 'coronas' in the initial INSERT.
--
-- Historical context:
-- - 'coronas' is not a valid category in catalog.ts (TypeScript type: CategoryId)
-- - Products labeled "Corona" (F23, F25, F26) belong to "condolencias" category
-- - The constraint CHECK now only allows the 5 valid categories:
--   'ramos', 'plantas', 'complementos', 'condolencias', 'rosas-eternas'
--
-- This migration is safe to execute (DELETE will have no effect if table is empty of 'coronas')
-- but is not required for BLOQUE 2 completion.

DELETE FROM category_to_ghl_collection
WHERE category = 'coronas';
