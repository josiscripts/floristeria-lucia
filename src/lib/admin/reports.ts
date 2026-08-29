import type { OrdersListResponse } from "@/lib/admin/api";

type OrderWithItems = OrdersListResponse["orders"][number];

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface SalesByDay {
  date: string;
  sales: number;
  orders: number;
}

export interface ReportSummary {
  totalSales: number;
  orderCount: number;
  averageTicket: number;
  statusDistribution: Record<string, number>;
  topProducts: TopProduct[];
  salesByDay: SalesByDay[];
}

export function computeReportSummary(orders: OrderWithItems[]): ReportSummary {
  const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const orderCount = orders.length;
  const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;

  const statusDistribution: Record<string, number> = {};
  const productTotals = new Map<string, TopProduct>();
  const dayTotals = new Map<string, SalesByDay>();

  for (const order of orders) {
    statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;

    for (const item of order.items || []) {
      const existing = productTotals.get(item.product_name) || {
        name: item.product_name,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.subtotal;
      productTotals.set(item.product_name, existing);
    }

    if (order.created_at) {
      const day = order.created_at.slice(0, 10);
      const existing = dayTotals.get(day) || { date: day, sales: 0, orders: 0 };
      existing.sales += order.total || 0;
      existing.orders += 1;
      dayTotals.set(day, existing);
    }
  }

  const topProducts = Array.from(productTotals.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const salesByDay = Array.from(dayTotals.values()).sort((a, b) => a.date.localeCompare(b.date));

  return { totalSales, orderCount, averageTicket, statusDistribution, topProducts, salesByDay };
}
