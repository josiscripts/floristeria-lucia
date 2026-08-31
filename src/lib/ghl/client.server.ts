import type { GHLProduct, GHLProductsResponse, GHLError, GHLContact, GHLContactsResponse, GHLOpportunity, GHLOpportunitiesResponse } from "./types";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "v3";
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
  headers.set("Version", GHL_API_VERSION);

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
    if (locationId) params.append("locationId", locationId);
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.skip) params.append("skip", String(options.skip));
    if (options?.filter?.status) params.append("status", String(options.filter.status));

    // API v3 uses /products/ endpoint with locationId as query parameter
    const queryString = params.toString();
    const fullEndpoint = queryString ? `/products/?${queryString}` : "/products/";

    const response = await ghlFetch<GHLProductsResponse>(fullEndpoint);

    const rawProducts = (response as any).items || response.products || [];
    console.log(`[GHL] Successfully fetched ${rawProducts.length} products from GHL`);

    // API v3 returns items array, normalize to products array for compatibility
    const rawTotal = (response as any).total;
    const normalizedTotal = Array.isArray(rawTotal)
      ? Number(rawTotal[0]?.total ?? 0)
      : Number(rawTotal ?? 0);

    // Normalize _id → id for each product immediately
    // GHL API returns _id as the primary ID field, but our codebase expects id
    const normalizedProducts = rawProducts.map((product: any) => ({
      ...product,
      id: product.id ?? product._id,
    }));

    const normalizedResponse: GHLProductsResponse = {
      products: normalizedProducts,
      total: normalizedTotal,
      pageSize: (response as any).pageSize || 0,
      currentPage: (response as any).currentPage || 0,
    };
    return normalizedResponse;
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
    const params = new URLSearchParams();
    params.append("id", productId);
    if (locationId) params.append("locationId", locationId);

    const endpoint = `/products/?${params.toString()}`;

    const response = await ghlFetch<any>(endpoint);
    const product = (response.items && response.items[0]) || (response.products && response.products[0]);

    if (!product) {
      return { message: "Product not found", code: "NOT_FOUND" };
    }

    // Normalize ID field (GHL may return id or _id)
    const normalizedProduct = {
      ...product,
      id: product.id ?? product._id,
    };

    console.log(`[GHL] Successfully fetched product ${productId}`);
    return normalizedProduct;
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
    const response = await ghlFetch<{ status?: string }>("/products/?limit=1");

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

/**
 * Create a new product in GHL
 * WRITE operation - server-side only
 */
export async function createGHLProduct(
  productData: {
    name: string;
    description?: string;
    price?: number;
    category?: string;
    image?: string;
    sku?: string;
    status?: "active" | "inactive";
    [key: string]: unknown; // Allow custom fields
  },
  locationId?: string
): Promise<GHLProduct | GHLError> {
  try {
    const finalLocationId = locationId || process.env["GHL_LOCATION_ID"];
    const endpoint = `/products/?locationId=${finalLocationId}`;

    // GHL v3 requires productType enum (must be uppercase)
    const payload = {
      locationId: finalLocationId,
      ...productData,
      productType: "PHYSICAL",
    };

    const response = await ghlFetch<any>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Normalize response: ensure id field exists, fallback to input name if missing
    const normalizedProduct: GHLProduct = {
      ...response,
      id: response.id ?? response._id,
      name: response.name ?? productData.name,
    };

    console.log(`[GHL] Successfully created product: ${normalizedProduct.id}`);
    return normalizedProduct;
  } catch (error) {
    const ghlError: GHLError = {
      message:
        error instanceof Error ? error.message : "Unknown error creating GHL product",
      code: "GHL_CREATE_PRODUCT_FAILED",
    };
    console.error(`[GHL] Error creating product:`, ghlError);
    return ghlError;
  }
}

/**
 * Update an existing product in GHL
 * WRITE operation - server-side only
 */
export async function updateGHLProduct(
  productId: string,
  productData: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    image?: string;
    sku?: string;
    status?: "active" | "inactive";
    [key: string]: unknown; // Allow custom fields
  },
  locationId?: string
): Promise<GHLProduct | GHLError> {
  try {
    const endpoint = locationId
      ? `/locations/${locationId}/products/${productId}`
      : `/products/${productId}`;

    const response = await ghlFetch<GHLProduct>(endpoint, {
      method: "PUT",
      body: JSON.stringify(productData),
    });

    console.log(`[GHL] Successfully updated product: ${productId}`);
    return response;
  } catch (error) {
    const ghlError: GHLError = {
      message:
        error instanceof Error ? error.message : "Unknown error updating GHL product",
      code: "GHL_UPDATE_PRODUCT_FAILED",
    };
    console.error(`[GHL] Error updating product ${productId}:`, ghlError);
    return ghlError;
  }
}

/**
 * Delete (soft delete via status) a product in GHL
 * WRITE operation - server-side only
 * Uses status='inactive' as soft delete to preserve data
 */
export async function deleteGHLProduct(
  productId: string,
  locationId?: string
): Promise<GHLProduct | GHLError> {
  try {
    const endpoint = locationId
      ? `/locations/${locationId}/products/${productId}`
      : `/products/${productId}`;

    // Use soft delete by setting status to inactive
    const response = await ghlFetch<GHLProduct>(endpoint, {
      method: "PUT",
      body: JSON.stringify({ status: "inactive" }),
    });

    console.log(`[GHL] Successfully deactivated product: ${productId}`);
    return response;
  } catch (error) {
    const ghlError: GHLError = {
      message:
        error instanceof Error ? error.message : "Unknown error deleting GHL product",
      code: "GHL_DELETE_PRODUCT_FAILED",
    };
    console.error(`[GHL] Error deleting product ${productId}:`, ghlError);
    return ghlError;
  }
}

/**
 * Fetch all contacts from GHL location
 * READ-ONLY operation for querying existing contacts
 */
export async function getGHLContacts(
  locationId: string,
  options?: {
    limit?: number;
    startAfter?: [number, string];
  }
): Promise<GHLContactsResponse | GHLError> {
  try {
    const params = new URLSearchParams();
    params.append("locationId", locationId);
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.startAfter) {
      params.append("startAfter", String(options.startAfter[0]));
      params.append("startAfterId", options.startAfter[1]);
    }

    const endpoint = `/contacts/?${params.toString()}`;
    const response = await ghlFetch<GHLContactsResponse>(endpoint);

    console.log(`[GHL] Successfully fetched ${response.contacts?.length || 0} contacts from GHL`);
    return response;
  } catch (error) {
    const ghlError: GHLError = {
      message:
        error instanceof Error ? error.message : "Unknown error fetching GHL contacts",
      code: "GHL_FETCH_CONTACTS_FAILED",
    };
    console.error(`[GHL] Error fetching contacts:`, ghlError);
    return ghlError;
  }
}

/**
 * Find a contact in GHL by email
 * Searches through contacts list by email field
 * Returns null if not found
 */
export async function findGHLContactByEmail(
  email: string,
  locationId: string
): Promise<GHLContact | null> {
  try {
    const response = await getGHLContacts(locationId, { limit: 100 });

    if (!("contacts" in response)) {
      console.error(`[GHL] Failed to fetch contacts for search:`, response);
      return null;
    }

    const contact = response.contacts?.find(
      (c: GHLContact) => c.email?.toLowerCase() === email.toLowerCase()
    );

    if (contact) {
      console.log(`[GHL] Found existing contact by email: ${email} (ID: ${contact.id})`);
    } else {
      console.log(`[GHL] No contact found with email: ${email}`);
    }

    return contact || null;
  } catch (error) {
    console.error(`[GHL] Error searching for contact by email:`, error);
    return null;
  }
}

/**
 * Create a new contact in GHL
 * WRITE operation - server-side only
 */
export async function createGHLContact(
  contactData: {
    locationId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  }
): Promise<GHLContact | GHLError> {
  try {
    const response = await ghlFetch<{ contact: GHLContact }>(
      "/contacts",
      {
        method: "POST",
        body: JSON.stringify(contactData),
      }
    );

    const contact = (response as any).contact || response;
    console.log(`[GHL] Successfully created contact: ${contact.id} (${contact.email})`);
    return contact as GHLContact;
  } catch (error) {
    const ghlError: GHLError = {
      message:
        error instanceof Error ? error.message : "Unknown error creating GHL contact",
      code: "GHL_CREATE_CONTACT_FAILED",
    };
    console.error(`[GHL] Error creating contact:`, ghlError);
    return ghlError;
  }
}

/**
 * Sync customer to GHL: find existing contact by email or create new one
 * Non-blocking operation - returns contact ID on success, null on graceful failure
 * Will not throw - errors are logged but do not propagate
 */
export async function syncGHLContact(
  customerEmail: string,
  customerData: {
    firstName: string;
    lastName: string;
    phone?: string;
  },
  locationId: string
): Promise<string | null> {
  try {
    // Step 1: Try to find existing contact by email
    const existingContact = await findGHLContactByEmail(customerEmail, locationId);

    if (existingContact) {
      console.log(`[GHL] Reusing existing contact ID: ${existingContact.id}`);
      return existingContact.id;
    }

    // Step 2: Create new contact if not found
    const contactPayload: {
      locationId: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    } = {
      locationId,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerEmail,
    };

    if (customerData.phone) {
      contactPayload.phone = customerData.phone;
    }

    const newContact = await createGHLContact(contactPayload);

    if (!("id" in newContact)) {
      console.error(`[GHL] Failed to create contact:`, newContact);
      return null;
    }

    console.log(`[GHL] Created new contact ID: ${newContact.id}`);
    return newContact.id;
  } catch (error) {
    console.error(`[GHL] Unexpected error in syncGHLContact:`, error);
    return null;
  }
}

/**
 * Find an existing Opportunity by order number
 * Used for idempotency - avoid creating duplicate opportunities
 */
export async function findGHLOpportunityByName(
  orderNumber: string,
  locationId: string
): Promise<GHLOpportunity | null> {
  try {
    const response = await ghlFetch<any>(
      `/opportunities/?locationId=${locationId}&name=${encodeURIComponent(orderNumber)}&limit=10`
    );

    if ("code" in response) {
      console.log(`[GHL] Opportunity search returned no results for: ${orderNumber}`);
      return null;
    }

    const opportunities = response.opportunities || [];
    const match = opportunities.find((opp: any) => opp.name === orderNumber);

    if (match) {
      console.log(`[GHL] Found existing opportunity: ${match.id}`);
      return match;
    }

    return null;
  } catch (error) {
    console.error(`[GHL] Error searching for opportunity:`, error);
    return null;
  }
}

/**
 * Create a new Opportunity in GHL
 * Associates opportunity with contact, pipeline, and stage
 */
export async function createGHLOpportunity(
  opportunityData: {
    locationId: string;
    contactId: string;
    pipelineId: string;
    name: string;
    monetaryValue?: number;
    customFields?: Array<{ fieldId: string; value: string | number | boolean | null }>;
  }
): Promise<GHLOpportunity | GHLError> {
  try {
    // GHL API v3 requires status field (open, won, lost, abandoned)
    const payload = {
      ...opportunityData,
      status: "open",
    };

    const response = await ghlFetch<{ opportunity: GHLOpportunity }>(
      "/opportunities/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    const opportunity = (response as any).opportunity || response;
    console.log(`[GHL] Successfully created opportunity: ${opportunity.id}`);
    return opportunity as GHLOpportunity;
  } catch (error) {
    const ghlError: GHLError = {
      message:
        error instanceof Error ? error.message : "Unknown error creating GHL opportunity",
      code: "GHL_CREATE_OPPORTUNITY_FAILED",
    };
    console.error(`[GHL] Error creating opportunity:`, ghlError);
    return ghlError;
  }
}

/**
 * Sync order to GHL: find or create Opportunity
 * Non-blocking - if GHL fails, order creation in Supabase still succeeds
 */
export async function syncGHLOpportunity(
  orderNumber: string,
  orderData: {
    id: string;
    total: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    address: string;
    city: string;
    postal_code: string;
    delivery_date?: string | null;
    dedicatory?: string | null;
    notes?: string | null;
  },
  ghlContactId: string,
  locationId: string
): Promise<string | null> {
  try {
    // Constants for GHL pipeline
    const PIPELINE_ID = "KHKXOKLuYXPLQlkjc0aq";

    // Custom field mappings
    const customFields: Array<{ fieldId: string; value: string | number | boolean | null }> = [
      { fieldId: "8eLnIjuKBbd6DMwysl0M", value: orderNumber }, // Número de pedido
      { fieldId: "WWKLWHR7EUDeGPi7zlOH", value: orderData.id }, // ID pedido Supabase
      { fieldId: "rXM9yMbgg5JaevJyVCXY", value: orderData.delivery_date || "" }, // Fecha de entrega
      { fieldId: "UwE0cVM9RTH1ZnSINMoq", value: orderData.total }, // Total del pedido
      { fieldId: "jeQFSOGG7H0kZEpHnfsz", value: orderData.address }, // Dirección de entrega
      { fieldId: "kBnxxaULHnZXT723jzSB", value: orderData.city }, // Ciudad
      { fieldId: "BY5x3DugugfPH3JYTIuu", value: orderData.postal_code }, // Código postal
      { fieldId: "ll9L1SW3tGONid8GnXzT", value: orderData.dedicatory || "" }, // Dedicatoria
      { fieldId: "O3uXs2omCM74sXUtn4uP", value: orderData.notes || "" }, // Notas del pedido
    ];

    // Step 1: Check if opportunity already exists
    const existing = await findGHLOpportunityByName(orderNumber, locationId);
    if (existing) {
      console.log(`[GHL] Reusing existing opportunity ID: ${existing.id}`);
      return existing.id;
    }

    // Step 2: Create new opportunity
    const newOpp = await createGHLOpportunity({
      locationId,
      contactId: ghlContactId,
      pipelineId: PIPELINE_ID,
      name: orderNumber,
      monetaryValue: orderData.total,
      customFields,
    });

    if (!("id" in newOpp)) {
      console.error(`[GHL] Failed to create opportunity:`, newOpp);
      return null;
    }

    console.log(`[GHL] Created new opportunity ID: ${newOpp.id}`);
    return newOpp.id;
  } catch (error) {
    console.error(`[GHL] Unexpected error in syncGHLOpportunity:`, error);
    return null;
  }
}

