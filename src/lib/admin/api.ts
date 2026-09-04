import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { GHLProduct } from "@/lib/ghl/types";

export interface CreateProductRequest {
  name: string;
  description?: string;
  category?: string;
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
  options: Array<{
    name: string;
    price_amount: number;
    discount_percent?: number;
    stock_quantity?: number | null;
  }>;
  color_variants?: string[];
}

export type OrderRow = Tables<"orders">;
export type OrderItemRow = Tables<"order_items">;
export type WebhookEventRow = Tables<"webhook_events">;
export type ProductMetadataRow = Tables<"product_metadata">;
export type AuditLogRow = Tables<"audit_logs">;

export interface OrdersListParams {
  page: number;
  limit?: number;
  status?: string;
  search?: string;
  fromDate?: string | undefined;
  toDate?: string | undefined;
}

export interface OrdersListResponse {
  orders: (OrderRow & { items: OrderItemRow[] })[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface OrderDetailResponse {
  order: OrderRow;
  items: OrderItemRow[];
  events: WebhookEventRow[];
}

export interface DashboardStatsResponse {
  today: { orders: number; sales: number };
  last7Days: { orders: number; sales: number };
  last30Days: { orders: number; sales: number };
  statusDistribution: Record<string, number>;
  recentOrders: OrderRow[];
}

/**
 * Adjunta el access token de la sesión admin actual como Bearer.
 * Las APIs administrativas lo requieren (ver src/lib/admin/guard.server.ts).
 */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Error ${response.status}`);
  }
  return response.json();
}

export function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  return fetchJson<DashboardStatsResponse>("/api/dashboard/stats");
}

export function fetchOrders(params: OrdersListParams): Promise<OrdersListResponse> {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit ?? 20));
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  if (params.fromDate) search.set("fromDate", params.fromDate);
  if (params.toDate) search.set("toDate", params.toDate);

  return fetchJson<OrdersListResponse>(`/api/orders?${search.toString()}`);
}

export function fetchOrderById(id: string): Promise<OrderDetailResponse> {
  return fetchJson<OrderDetailResponse>(`/api/orders/${encodeURIComponent(id)}`);
}

/**
 * Fetches every order in a date range by paging through GET /api/orders (max page size).
 * Reused for reports instead of adding a new aggregation endpoint — fine for a shop-sized
 * order volume, since each page already includes items for revenue/top-product breakdowns.
 */
export async function fetchAllOrdersInRange(
  fromDate?: string,
  toDate?: string,
): Promise<OrdersListResponse["orders"]> {
  const limit = 100;
  let page = 1;
  let all: OrdersListResponse["orders"] = [];

  while (true) {
    const response = await fetchOrders({ page, limit, fromDate, toDate });
    all = all.concat(response.orders);
    if (page >= response.pagination.totalPages || response.orders.length === 0) break;
    page += 1;
  }

  return all;
}

// --- Products ---

export type AdminProduct = GHLProduct & { metadata: ProductMetadataRow | null };

export interface ProductsListParams {
  page: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface ProductsListResponse {
  products: AdminProduct[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface ProductFormInput {
  name: string;
  description: string | undefined;
  price: number | undefined;
  category: string | undefined;
  image: string | undefined;
  sku: string | undefined;
  price_max: number | undefined;
  available_colors: string[] | undefined;
  badge_label: string | undefined;
  rose_step: number | undefined;
}

export function fetchProducts(params: ProductsListParams): Promise<ProductsListResponse> {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit ?? 20));
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);

  return fetchJson<ProductsListResponse>(`/api/products?${search.toString()}`);
}

export function fetchProductById(
  id: string,
): Promise<{ product: GHLProduct; metadata: ProductMetadataRow | null }> {
  return fetchJson(`/api/products/${encodeURIComponent(id)}`);
}

export function createProduct(input: ProductFormInput) {
  return fetchJson<{ success: boolean; product: GHLProduct }>("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateProduct(id: string, input: Partial<ProductFormInput>) {
  return fetchJson<{ success: boolean; product: GHLProduct }>(
    `/api/products/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function deactivateProduct(id: string) {
  return fetchJson<{ success: boolean }>(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * Create a new product using the BLOQUE 4 redesigned schema
 * POST /api/admin/products
 * Supabase-only, no GHL
 */
export function createProductNew(input: CreateProductRequest) {
  return fetchJson<{ success: boolean; product: any }>("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/**
 * Fetch a product using the new Supabase schema
 * GET /api/admin/products/{id}
 * Supabase-only
 */
export function fetchProductByIdNew(id: string) {
  return fetchJson<{
    success: boolean;
    product: {
      id: string;
      name: string;
      description: string | null;
      category_id: string | null;
      active: boolean;
      cover_image_url: string | null;
      has_color_variants: boolean;
      product_options: Array<{
        id: string;
        name: string;
        price_amount: number;
        discount_percent: number;
        price_final: number;
        stock_quantity: number | null;
        sku: string | null;
        active: boolean;
      }>;
      color_variants: Array<{
        id: string;
        name: string;
        sort_order: number;
        active: boolean | null;
      }>;
      product_images: Array<{
        id: string;
        image_url: string | null;
        is_primary: boolean;
        sort_order: number;
        alt_text: string | null;
      }>;
    };
  }>(`/api/admin/products/${encodeURIComponent(id)}`);
}

/**
 * Update a product using the new Supabase schema
 * PUT /api/admin/products/{id}
 * Supabase-only
 */
export function updateProductNew(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    category_id: string | null;
    active: boolean;
    cover_image_url: string;
    has_color_variants: boolean;
  }>,
) {
  return fetchJson<{ success: boolean; product: any }>(
    `/api/admin/products/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

/**
 * Deactivate a product using the new Supabase schema
 * DELETE /api/admin/products/{id} (soft delete)
 * Supabase-only
 */
export function deactivateProductNew(id: string) {
  return fetchJson<{ success: boolean; message: string }>(
    `/api/admin/products/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}

/**
 * Create a new product image
 * POST /api/admin/products/{id}/images
 */
export function createProductImage(
  productId: string,
  imageUrl: string,
  isPrimary: boolean = false,
) {
  return fetchJson<{ success: boolean; image: any }>(
    `/api/admin/products/${encodeURIComponent(productId)}/images`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, is_primary: isPrimary }),
    },
  );
}

/**
 * Update a product image
 * PUT /api/admin/products/{id}/images/{imageId}
 */
export function updateProductImage(
  productId: string,
  imageId: string,
  updates: { image_url?: string; is_primary?: boolean; sort_order?: number },
) {
  return fetchJson<{ success: boolean; image: any }>(
    `/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
  );
}

/**
 * Delete a product image
 * DELETE /api/admin/products/{id}/images/{imageId}
 */
export function deleteProductImage(productId: string, imageId: string) {
  return fetchJson<{ success: boolean; message: string }>(
    `/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
    {
      method: "DELETE",
    },
  );
}

// --- Webhook events ---

export interface WebhookEventsListParams {
  page: number;
  limit?: number;
  eventType?: string;
  processed?: "true" | "false" | undefined;
  search?: string;
}

export interface WebhookEventsListResponse {
  events: WebhookEventRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export function fetchWebhookEvents(
  params: WebhookEventsListParams,
): Promise<WebhookEventsListResponse> {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit ?? 20));
  if (params.eventType) search.set("eventType", params.eventType);
  if (params.processed) search.set("processed", params.processed);
  if (params.search) search.set("search", params.search);

  return fetchJson<WebhookEventsListResponse>(`/api/webhook-events?${search.toString()}`);
}

export function retryWebhookEvent(id: string) {
  return fetchJson<{ success: boolean; result: { success: boolean; error?: string } }>(
    `/api/webhook-events/${encodeURIComponent(id)}/retry`,
    { method: "POST" },
  );
}

// --- Audit logs ---

export interface AuditLogsListParams {
  page: number;
  limit?: number;
}

export interface AuditLogsListResponse {
  logs: AuditLogRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export function fetchAuditLogs(params: AuditLogsListParams): Promise<AuditLogsListResponse> {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit ?? 20));

  return fetchJson<AuditLogsListResponse>(`/api/audit-logs?${search.toString()}`);
}
