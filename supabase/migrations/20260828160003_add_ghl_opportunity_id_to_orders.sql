-- ============================================
-- FASE 4.4: Add ghl_opportunity_id column to orders table
-- Date: 2026-08-28
-- Purpose: Store GoHighLevel opportunity ID for webhook deduplication and bidirectional sync
-- ============================================

-- Step 1: Add ghl_opportunity_id column to orders table
-- NULL by default to maintain backward compatibility with existing orders
ALTER TABLE public.orders
ADD COLUMN ghl_opportunity_id VARCHAR(255) NULL;

-- Step 2: Add documentation for the new column
COMMENT ON COLUMN public.orders.ghl_opportunity_id IS
  'Reference to GoHighLevel opportunity ID (external). '
  'Used for webhook deduplication and bidirectional sync between Supabase and HighLevel. '
  'Populated by background sync when order is created via createOrder(). '
  'Nullable: allows orders created before this column existed or when GHL sync fails.';

-- Step 3: Create filtered index for fast webhook lookups by opportunityId
-- Index is filtered (WHERE IS NOT NULL) to optimize for sparse column
-- Only indexes rows where sync was successful
CREATE INDEX idx_orders_ghl_opportunity
  ON public.orders(ghl_opportunity_id)
  WHERE ghl_opportunity_id IS NOT NULL;

-- Step 4: Add documentation for the index
COMMENT ON INDEX public.orders.idx_orders_ghl_opportunity IS
  'Filtered index for efficient webhook deduplication via opportunityId lookup. '
  'Only indexes non-NULL values to optimize for sparse column. '
  'Used by endpoint: GET /api/webhooks/ghl-opportunity to find orders by opportunity ID.';

-- ============================================
-- Migration Summary:
-- - Added 1 nullable VARCHAR(255) column: ghl_opportunity_id
-- - Added 1 filtered index: idx_orders_ghl_opportunity
-- - No data migration required (NULL is correct for legacy/failed-sync orders)
-- - No performance impact on existing queries (indexed column is sparse)
-- - Fully backward compatible (all existing orders remain valid)
-- - Reversible: DROP COLUMN ghl_opportunity_id if needed
--
-- Behavior after migration:
-- 1. New orders created will populate ghl_opportunity_id via background sync
-- 2. Webhook deduplication can now find orders by opportunityId
-- 3. Existing orders will have ghl_opportunity_id = NULL (expected)
-- 4. Optional: Backfill legacy orders using separate script
-- ============================================
