-- ============================================
-- FASE 4.2: Create webhook_events table
-- Date: 2026-08-28
-- Purpose: Store GHL webhook events for deduplication and audit
-- ============================================

CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook identification (for deduplication)
  -- UNIQUE constraint automatically creates an index
  delivery_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  -- GHL resource identifiers
  opportunity_id VARCHAR(255) NOT NULL,
  location_id VARCHAR(255) NOT NULL,
  contact_id VARCHAR(255) NULL,

  -- Link to orders table (nullable)
  order_id UUID NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Complete webhook payload (for audit trail)
  payload JSONB NOT NULL,

  -- Processing state
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP NULL,
  error_message TEXT NULL,

  -- Timestamps
  received_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Event type constraint
  CONSTRAINT webhook_events_event_type_check
    CHECK (event_type IN (
      'opportunity.stage_change',
      'opportunity.updated',
      'opportunity.status_change',
      'opportunity.created',
      'opportunity.deleted'
    ))
);

-- Additional index: find unprocessed webhooks efficiently
CREATE INDEX idx_webhook_processed ON public.webhook_events(processed);

-- Enable Row-Level Security
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: service_role has full access
CREATE POLICY webhook_events_service_role_all
  ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant all permissions to service_role
GRANT ALL PRIVILEGES ON public.webhook_events TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.webhook_events IS
  'Stores incoming GHL webhook events for deduplication, audit, and idempotent processing. '
  'Deduplication key: delivery_id (UNIQUE constraint prevents duplicates).';

COMMENT ON COLUMN public.webhook_events.delivery_id IS
  'Unique event ID from GHL (always present, guaranteed by GHL). '
  'UNIQUE constraint automatically creates index and prevents duplicate processing.';

COMMENT ON COLUMN public.webhook_events.order_id IS
  'Foreign key to orders table. Nullable because webhook may arrive before order is matched.';
