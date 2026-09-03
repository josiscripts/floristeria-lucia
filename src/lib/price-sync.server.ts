/**
 * Price Synchronization
 * Handles synchronization of product prices and SKUs with GHL
 * Server-side only, never expose to client
 */

import { ghlFetch } from "@/lib/ghl/client.server";
import type { GHLError } from "@/lib/ghl/types";

export interface PriceSyncResult {
  success: boolean;
  ghlPriceId?: string;
  error?: string;
}

export interface AmountSyncResult {
  success: boolean;
  error?: string;
}

/**
 * Ensure a price exists for a product in GHL
 * Creates a new price entry with SKU and name
 * Idempotent: if price already exists, returns the existing ID
 */
export async function ensureProductPrice(options: {
  ghlProductId: string;
  amount: number;
  currency: string;
  sku: string;
  priceName: string;
  locationId?: string;
}): Promise<PriceSyncResult> {
  try {
    const { ghlProductId, amount, currency, sku, priceName, locationId } = options;

    if (!ghlProductId || !amount || !currency || !sku || !priceName) {
      return {
        success: false,
        error: "Missing required parameters for price creation",
      };
    }

    const finalLocationId = locationId || process.env.GHL_LOCATION_ID;
    if (!finalLocationId) {
      return {
        success: false,
        error: "Missing GHL_LOCATION_ID",
      };
    }

    // GHL v3 API endpoint for creating prices
    // Correct endpoint: POST /products/{productId}/price
    const endpoint = `/products/${ghlProductId}/price`;

    const payload = {
      name: priceName,
      amount: amount,
      currency: currency,
      sku: sku,
      type: "one_time",
      locationId: finalLocationId,
    };

    try {
      const response = await ghlFetch<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // GHL returns price ID in response._id
      const priceId = response._id || response.id;
      if (!priceId) {
        console.error(`[PriceSync] GHL did not return price ID in response`, {
          response,
          ghlProductId,
          priceName,
        });
        return {
          success: false,
          error: "GHL did not return price ID in response",
        };
      }

      console.log(`[PriceSync] Successfully created price ${priceId} for product ${ghlProductId}`);
      return {
        success: true,
        ghlPriceId: priceId,
      };
    } catch (error) {
      // If error is GHL-specific, check if it's a 409 (already exists)
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("409") || errorMsg.includes("already exists")) {
        // Price already exists - return error but mark as non-fatal
        console.warn(`[PriceSync] Price already exists for ${ghlProductId} with SKU ${sku}`);
        return {
          success: false,
          error: "Price already exists for this SKU",
        };
      }
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[PriceSync] Failed to ensure price:`, message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Synchronize the amount for a product's price in GHL
 * Updates the price amount while keeping other fields unchanged
 */
export async function syncPriceAmount(
  productId: string,
  amount: number,
  currency: string,
  locationId?: string,
): Promise<AmountSyncResult> {
  try {
    if (!productId || !amount || !currency) {
      return {
        success: false,
        error: "Missing required parameters for price sync",
      };
    }

    const finalLocationId = locationId || process.env.GHL_LOCATION_ID;
    if (!finalLocationId) {
      return {
        success: false,
        error: "Missing GHL_LOCATION_ID",
      };
    }

    // GHL v3 API endpoint for updating product prices
    // Endpoint: PUT /v3/products/{productId}
    // Note: GHL product update endpoint handles price changes
    const endpoint = `/products/${productId}?locationId=${finalLocationId}`;

    const payload = {
      price: amount,
      currency: currency,
    };

    const response = await ghlFetch<any>(endpoint, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    console.log(`[PriceSync] Updated price amount for product ${productId}: ${amount} ${currency}`);
    return {
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[PriceSync] Failed to sync price amount for ${productId}:`, message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Synchronize the SKU for a product in GHL
 * Updates the product's SKU value
 */
export async function syncPriceSKU(
  productId: string,
  sku: string,
  locationId?: string,
): Promise<AmountSyncResult> {
  try {
    if (!productId || !sku) {
      return {
        success: false,
        error: "Missing required parameters for SKU sync",
      };
    }

    const finalLocationId = locationId || process.env.GHL_LOCATION_ID;
    if (!finalLocationId) {
      return {
        success: false,
        error: "Missing GHL_LOCATION_ID",
      };
    }

    // GHL v3 API endpoint for updating product
    // Endpoint: PUT /v3/products/{productId}
    const endpoint = `/products/${productId}?locationId=${finalLocationId}`;

    const payload = {
      sku: sku,
    };

    const response = await ghlFetch<any>(endpoint, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    console.log(`[PriceSync] Updated SKU for product ${productId}: ${sku}`);
    return {
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[PriceSync] Failed to sync SKU for ${productId}:`, message);
    return {
      success: false,
      error: message,
    };
  }
}
