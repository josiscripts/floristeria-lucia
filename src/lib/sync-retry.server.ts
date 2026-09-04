/**
 * Product Sync Retry Management
 * Handles failed GHL synchronizations with exponential backoff
 * Non-blocking: doesn't prevent product creation, just queues retry
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type SyncOperation = "create" | "update" | "delete";

export interface SyncRetryRecord {
  productId: string;
  operation: SyncOperation;
  errorMessage: string;
  attemptCount: number;
  nextRetryAt: Date;
}

/**
 * Calculate next retry time with exponential backoff
 * Attempt 1: 1 min
 * Attempt 2: 5 min
 * Attempt 3: 15 min
 * Attempt 4: 1 hour
 * Attempt 5+: 4 hours
 */
function getNextRetryTime(attemptCount: number): Date {
  const now = new Date();
  const backoffMs =
    attemptCount === 1
      ? 60 * 1000
      : attemptCount === 2
        ? 5 * 60 * 1000
        : attemptCount === 3
          ? 15 * 60 * 1000
          : attemptCount === 4
            ? 60 * 60 * 1000
            : 4 * 60 * 60 * 1000;

  return new Date(now.getTime() + backoffMs);
}

/**
 * Queue a sync retry for a product
 * Called when GHL sync fails during product create/update
 */
export async function queueSyncRetry(
  productId: string,
  operation: SyncOperation,
  errorMessage: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const nextRetry = getNextRetryTime(1);

    // Store retry record in audit_logs with metadata (not a dedicated table yet)
    // This allows tracking without adding schema complexity
    const { error } = await supabase.from("audit_logs").insert({
      action: "sync_retry_queued",
      resource: "products",
      record_id: productId,
      metadata: {
        operation,
        errorMessage,
        attemptCount: 1,
        nextRetryAt: nextRetry.toISOString(),
      },
    });

    if (error) throw error;

    console.log(
      `[SyncRetry] Queued ${operation} for product ${productId}, next retry at ${nextRetry.toISOString()}`,
    );
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[SyncRetry] Failed to queue retry for product ${productId}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Update sync status for a product
 * Used after successful or failed sync attempts
 */
export async function updateSyncStatus(
  productId: string,
  syncStatus: "pending" | "synced" | "error",
  syncError?: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("products")
      .update({
        sync_status: syncStatus,
        sync_error: syncError || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) throw error;

    console.log(`[SyncStatus] Updated product ${productId}: ${syncStatus}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[SyncStatus] Failed to update sync status for product ${productId}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Mark a product as successfully synced
 * Clears any error message
 */
export async function markSyncedSuccess(
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  return updateSyncStatus(productId, "synced", null);
}

/**
 * Mark a product as sync failed
 * Sets error message (without exposing secrets)
 */
export async function markSyncFailed(
  productId: string,
  errorMessage: string,
  shouldRetry: boolean = true,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update product status
    const statusRes = await updateSyncStatus(
      productId,
      "error",
      sanitizeErrorMessage(errorMessage),
    );
    if (!statusRes.success) return statusRes;

    // Queue retry if requested
    if (shouldRetry) {
      await queueSyncRetry(productId, "create", errorMessage);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Sanitize error message to remove sensitive information
 * Removes: API keys, tokens, URLs with credentials, etc.
 */
function sanitizeErrorMessage(message: string): string {
  const sanitized = message
    // Remove common patterns of API keys/tokens
    .replace(/([A-Za-z_-]+[_-]?[Kk]ey|[Tt]oken|[Ss]ecret|[Pp]assword)[\s:=]+[\S]+/g, "[REDACTED]")
    // Remove full URLs (they might contain embedded credentials)
    .replace(/https?:\/\/\S+/g, "[URL_REDACTED]")
    // Keep only first 200 chars to avoid massive error strings
    .substring(0, 200);

  return sanitized;
}

/**
 * Get pending sync retries for a product
 * Used by retry cron job or manual retry endpoint
 */
export async function getPendingSyncRetries(
  limit: number = 10,
): Promise<{ success: boolean; retries?: SyncRetryRecord[]; error?: string }> {
  try {
    const now = new Date();

    const { data, error } = await supabase
      .from("audit_logs")
      .select("record_id, metadata")
      .eq("action", "sync_retry_queued")
      .lte("created_at", now.toISOString())
      .limit(limit);

    if (error) throw error;

    const retries: SyncRetryRecord[] = (data || [])
      .filter((row) => row.metadata && typeof row.metadata === "object")
      .map((row) => ({
        productId: row.record_id || "",
        operation: (row.metadata as any).operation || "create",
        errorMessage: (row.metadata as any).errorMessage || "Unknown error",
        attemptCount: (row.metadata as any).attemptCount || 1,
        nextRetryAt: new Date((row.metadata as any).nextRetryAt || new Date()),
      }));

    return { success: true, retries };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[SyncRetry] Failed to get pending retries:", message);
    return { success: false, error: message };
  }
}
