import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Download, Package, Receipt } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/admin/KpiCard";
import { StatusDistributionChart } from "@/components/admin/StatusDistributionChart";
import { SalesEvolutionChart } from "@/components/admin/SalesEvolutionChart";
import { TopProductsTable } from "@/components/admin/TopProductsTable";
import { LoadingState } from "@/components/admin/LoadingState";
import { ErrorState } from "@/components/admin/ErrorState";
import { EmptyState } from "@/components/admin/EmptyState";
import { fetchAllOrdersInRange } from "@/lib/admin/api";
import { computeReportSummary } from "@/lib/admin/reports";
import { downloadCsv } from "@/lib/admin/csv";
import { formatPrice } from "@/data/catalog";

interface ReportsSearch {
  fromDate?: string;
  toDate?: string;
}

function defaultFromDate() {
  const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function defaultToDate() {
  return new Date().toISOString().slice(0, 10);
}

export const Route = createFileRoute("/_authenticated/admin/reports")({
  validateSearch: (search: Record<string, unknown>): ReportsSearch => ({
    fromDate: typeof search["fromDate"] === "string" ? search["fromDate"] : "",
    toDate: typeof search["toDate"] === "string" ? search["toDate"] : "",
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const rawFilters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const fromDate = rawFilters.fromDate || defaultFromDate();
  const toDate = rawFilters.toDate || defaultToDate();

  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "reports", fromDate, toDate],
    queryFn: () => fetchAllOrdersInRange(fromDate, toDate),
  });

  const summary = orders ? computeReportSummary(orders) : null;

  const handleExportCsv = () => {
    if (!orders || orders.length === 0) return;

    downloadCsv(
      `pedidos_${fromDate}_a_${toDate}.csv`,
      ["Número de pedido", "Cliente", "Email", "Total", "Estado", "Fecha"],
      orders.map((order) => [
        order.order_number,
        order.customer_name,
        order.customer_email,
        order.total,
        order.status,
        order.created_at,
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Rendimiento de ventas en el rango seleccionado.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={!orders || orders.length === 0}
        >
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="report-from">
            Desde
          </label>
          <Input
            id="report-from"
            type="date"
            value={fromDate}
            onChange={(e) => navigate({ search: { fromDate: e.target.value, toDate } })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="report-to">
            Hasta
          </label>
          <Input
            id="report-to"
            type="date"
            value={toDate}
            onChange={(e) => navigate({ search: { fromDate, toDate: e.target.value } })}
          />
        </div>
      </div>

      {isLoading && <LoadingState rows={4} />}

      {isError && (
        <ErrorState
          message={error instanceof Error ? error.message : "Error desconocido"}
          onRetry={() => void refetch()}
        />
      )}

      {summary && summary.orderCount === 0 && (
        <EmptyState title="Sin pedidos en este rango" description="Prueba a ampliar las fechas." />
      )}

      {summary && summary.orderCount > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Ingresos"
              value={formatPrice(summary.totalSales)}
              icon={CircleDollarSign}
              accent="primary"
            />
            <KpiCard label="Pedidos" value={String(summary.orderCount)} icon={Package} />
            <KpiCard
              label="Ticket promedio"
              value={formatPrice(summary.averageTicket)}
              icon={Receipt}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Evolución de ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesEvolutionChart data={summary.salesByDay} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Pedidos por estado</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusDistributionChart distribution={summary.statusDistribution} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Productos más vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <TopProductsTable products={summary.topProducts} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
