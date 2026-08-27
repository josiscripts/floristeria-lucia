import type { GHLProduct, GHLProductsResponse, GHLError } from "./types";

const GHL_API_BASE = "https://api.gohighlevel.com/v1";
const GHL_TIMEOUT = 10000; // 10 seconds

function getGHLToken(): string {
  const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
  if (!token) {
    throw new Error(
      "GHL_PRIVATE_INTEGRATION_TOKEN not configured. Add it to .env/.env.local"
    );
  }
  return token;
}

async function ghlFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getGHLToken();
  const url = `${GHL_API_BASE}${endpoint}`;
  const headers = new Headers(options?.headers || {});

  // Set authorization header (token in header, not exposed to client)
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GHL_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error: GHLError = {
        message: `GHL API error: ${response.statusText}`,
        code: `GHL_${response.status}`,
        statusCode: response.status,
      };

      console.error(`[GHL] ${error.message}`, { endpoint, status: response.status });
      throw error;
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch all products from GoHighLevel subcuenta
 * READ-ONLY operation for testing GHL connectivity
 */
export async function getGHLProducts(
  locationId?: string,
  options?: {
    limit?: number;
    skip?: number;
    filter?: Record<string, unknown>;
  }
): Promise<GHLProductsResponse | GHLError> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.skip) params.append("skip", String(options.skip));
    if (options?.filter?.status) params.append("status", String(options.filter.status));

    // Note: locationId is required for GoHighLevel API
    const endpoint = locationId ? `/locations/${locationId}/products` : "/products";
    const queryString = params.toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await ghlFetch<GHLProductsResponse>(fullEndpoint);

    console.log(`[GHL] Successfully fetched ${response.products.length} products from GHL`);
    return response;
  } catch (error) {
    const ghlError: GHLError = {
      message:
        error instanceof Error ? error.message : "Unknown error fetching GHL products",
      code: "GHL_FETCH_PRODUCTS_FAILED",
    };
    console.error(`[GHL] Error fetching products:`, ghlError);
    return ghlError;
  }
}

/**
 * Fetch a single product from GHL by ID
 * READ-ONLY operation
 */
export async function getGHLProduct(
  productId: string,
  locationId?: string
): Promise<GHLProduct | GHLError> {
  try {
    const endpoint = locationId
      ? `/locations/${locationId}/products/${productId}`
      : `/products/${productId}`;

    const response = await ghlFetch<GHLProduct>(endpoint);
    console.log(`[GHL] Successfully fetched product ${productId}`);
    return response;
  } catch (error) {
    const ghlError: GHLError = {
      message:
        error instanceof Error ? error.message : "Unknown error fetching GHL product",
      code: "GHL_FETCH_PRODUCT_FAILED",
    };
    console.error(`[GHL] Error fetching product ${productId}:`, ghlError);
    return ghlError;
  }
}

/**
 * Test GHL connectivity and token validity
 * Simple health check without fetching actual data
 */
export async function testGHLConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  try {
    // Get token to validate it exists
    getGHLToken();

    // Try a simple API call with minimal payload
    const response = await ghlFetch<{ status?: string }>("/contacts?limit=1");

    return {
      connected: true,
      message: "GHL connection successful",
    };
  } catch (error) {
    return {
      connected: false,
      message: "GHL connection failed",
      error:
        error instanceof Error
          ? error.message
          : "Unknown connection error",
    };
  }
}
