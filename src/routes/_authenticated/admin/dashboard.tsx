import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CircleDollarSign, Package, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/admin/KpiCard";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { StatusDistributionChart } from "@/components/admin/StatusDistributionChart";
import { SalesChart } from "@/components/admin/SalesChart";
import { LoadingState } from "@/components/admin/LoadingState";
import { ErrorState } from "@/components/admin/ErrorState";
import { EmptyState } from "@/components/admin/EmptyState";
import { fetchDashboardStats } from "@/lib/admin/api";
import { formatPrice } from "@/data/catalog";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visión general de la actividad de la tienda.
        </p>
      </div>

      {isLoading && <LoadingState rows={4} />}

      {isError && (
        <ErrorState
          message={error instanceof Error ? error.message : "Error desconocido"}
          onRetry={() => void refetch()}
        />
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Ventas de hoy"
              value={formatPrice(data.today.sales)}
              sublabel={`${data.today.orders} pedido${data.today.orders !== 1 ? "s" : ""}`}
              icon={CircleDollarSign}
              accent="primary"
            />
            <KpiCard label="Pedidos de hoy" value={String(data.today.orders)} icon={Package} />
            <KpiCard
              label="Ventas últimos 7 días"
              value={formatPrice(data.last7Days.sales)}
              sublabel={`${data.last7Days.orders} pedidos`}
              icon={CalendarDays}
            />
            <KpiCard
              label="Ventas últimos 30 días"
              value={formatPrice(data.last30Days.sales)}
              sublabel={`${data.last30Days.orders} pedidos`}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Ventas por periodo</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesChart
                  today={data.today.sales}
                  last7Days={data.last7Days.sales}
                  last30Days={data.last30Days.sales}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Pedidos por estado</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusDistributionChart distribution={data.statusDistribution} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-display text-lg">Últimos pedidos</CardTitle>
              <Link to="/admin/orders" className="text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </CardHeader>
            <CardContent>
              {data.recentOrders.length === 0 ? (
                <EmptyState title="Todavía no hay pedidos registrados." />
              ) : (
                <OrdersTable orders={data.recentOrders} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
