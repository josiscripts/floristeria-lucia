import type { Tables } from "@/integrations/supabase/types";

export type OrderRow = Tables<"orders">;
export type OrderItemRow = Tables<"order_items">;
export type WebhookEventRow = Tables<"webhook_events">;

export interface OrdersListParams {
  page: number;
  limit?: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
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
