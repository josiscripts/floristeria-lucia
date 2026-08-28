export type GHLProduct = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  cost?: number;
  image?: string;
  images?: string[];
  sku?: string;
  category?: string;
  status?: "active" | "inactive";
  inventory?: number;
  [key: string]: unknown; // Allow custom fields
};

export type GHLProductsResponse = {
  products: GHLProduct[];
  total: number;
  pageSize: number;
  currentPage: number;
};

export type GHLError = {
  message: string;
  code?: string;
  statusCode?: number;
};

export type GHLContact = {
  id: string;
  locationId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  type: "lead" | "customer";
  dateAdded: string;
  dateUpdated: string;
  customFields?: Record<string, unknown>[];
  [key: string]: unknown;
};

export type GHLContactsResponse = {
  contacts: GHLContact[];
  meta: {
    total: number;
    currentPage: number;
    nextPageUrl?: string;
    startAfter?: [number, string];
  };
};

export type GHLOpportunity = {
  id: string;
  locationId: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  name: string;
  monetaryValue?: number;
  customFields?: Array<{
    fieldId: string;
    value: string | number | boolean | null;
  }>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type GHLOpportunitiesResponse = {
  opportunities: GHLOpportunity[];
  meta?: {
    total: number;
    currentPage: number;
  };
};

/**
 * GHL to Supabase Order Status Mapping
 * Maps GHL pipeline stage IDs to corresponding Supabase order status values
 */
export const GHL_STAGE_TO_ORDER_STATUS = {
  // Recibido - Initial stage when order is received
  "1de8d7dc-deac-45a6-a87e-e7198c3ef4a5": "pending",

  // Confirmado - Order confirmed
  "a737a3b9-98fd-4446-8f15-eb26333cc6f3": "confirmed",

  // Preparando - Order being prepared
  "72c6b0eb-a0ae-4cd5-b122-482add4dd6c7": "preparing",

  // Listo - Ready for delivery
  "ba7e6913-7173-43cd-9d94-bf66e2add4a1": "ready",

  // Entregado - Delivered
  "910fc366-8299-49a0-aaf4-99e15558fd07": "delivered",

  // Cancelado - Cancelled
  "bedbab33-62f0-41fd-b51e-a6b2ad0aa8ed": "cancelled",
} as const;

/**
 * Valid Supabase order status values
 * Must match what the frontend (confirmation.$orderId.tsx) expects
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

/**
 * GHL Opportunity Webhook Payload for stage_change event
 * Represents the data sent by GHL when an opportunity changes stage
 *
 * Official HighLevel webhook format (Ed25519 signed)
 * @see https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/
 */
export type GHLOpportunityStageChangeWebhook = {
  event: "opportunity.stage_change";
  webhookId: string; // Official HighLevel unique identifier for deduplication (always present)
  timestamp?: string;
  locationId: string;
  data: {
    id: string;
    contactId: string;
    pipelineId: string;
    oldStageId: string;
    newStageId: string;
    stageName?: string;
    name: string;
    monetaryValue?: number;
    status?: string;
    customFields?: Array<{
      fieldId: string;
      value: string | number | boolean | null;
    }>;
  };
};

/**
 * GHL Opportunity Webhook Payload for generic updated event
 * Represents the data sent by GHL when an opportunity is updated
 *
 * Official HighLevel webhook format (Ed25519 signed)
 * @see https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/
 */
export type GHLOpportunityUpdatedWebhook = {
  event: "opportunity.updated";
  webhookId: string; // Official HighLevel unique identifier for deduplication (always present)
  timestamp?: string;
  locationId: string;
  data: GHLOpportunity;
};

/**
 * GHL Opportunity Webhook Payload for status_change event
 * Represents the data sent by GHL when opportunity status changes
 *
 * Official HighLevel webhook format (Ed25519 signed)
 * @see https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/
 */
export type GHLOpportunityStatusChangeWebhook = {
  event: "opportunity.status_change";
  webhookId: string; // Official HighLevel unique identifier for deduplication (always present)
  timestamp?: string;
  locationId: string;
  data: {
    id: string;
    contactId: string;
    pipelineId: string;
    stageId: string;
    oldStatus?: string;
    newStatus?: string;
    name: string;
    monetaryValue?: number;
    customFields?: Array<{
      fieldId: string;
      value: string | number | boolean | null;
    }>;
  };
};

/**
 * Union type for all GHL Opportunity webhook events
 */
export type GHLOpportunityWebhookPayload =
  | GHLOpportunityStageChangeWebhook
  | GHLOpportunityUpdatedWebhook
  | GHLOpportunityStatusChangeWebhook;

/**
 * Get Supabase order status from GHL stage ID
 * Returns the corresponding status value or undefined if stage ID is not mapped
 */
export function getOrderStatusFromGHLStage(stageId: string): OrderStatus | undefined {
  return GHL_STAGE_TO_ORDER_STATUS[stageId as keyof typeof GHL_STAGE_TO_ORDER_STATUS] as OrderStatus | undefined;
}

/**
 * Validate if a string is a valid order status
 */
export function isValidOrderStatus(status: unknown): status is OrderStatus {
  return typeof status === "string" &&
    ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].includes(status);
}
