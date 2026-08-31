import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { AdminPagination } from "@/components/admin/Pagination";
import { LoadingState } from "@/components/admin/LoadingState";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState } from "@/components/admin/ErrorState";
import { fetchOrders } from "@/lib/admin/api";
import { ORDER_STATUSES, orderStatusLabel } from "@/lib/admin/status";

interface OrdersSearch {
  page?: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  validateSearch: (search: Record<string, unknown>): OrdersSearch => ({
    page: Number(search["page"]) > 0 ? Number(search["page"]) : 1,
    status: typeof search["status"] === "string" ? search["status"] : "",
    search: typeof search["search"] === "string" ? search["search"] : "",
    fromDate: typeof search["fromDate"] === "string" ? search["fromDate"] : "",
    toDate: typeof search["toDate"] === "string" ? search["toDate"] : "",
  }),
  component: OrdersListPage,
});

function OrdersListPage() {
  const rawFilters = Route.useSearch();
  const navigate = useNavigate();

  const filters = {
    page: rawFilters.page ?? 1,
    status: rawFilters.status ?? "",
    search: rawFilters.search ?? "",
    fromDate: rawFilters.fromDate ?? "",
    toDate: rawFilters.toDate ?? "",
  };

  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        navigate({ search: { ...filters, search: searchInput, page: 1 } });
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "orders", filters],
    queryFn: () => fetchOrders(filters),
  });

  const hasActiveFilters = filters.status || filters.search || filters.fromDate || filters.toDate;

  const clearFilters = () => {
    setSearchInput("");
    navigate({ search: { page: 1, status: "", search: "", fromDate: "", toDate: "" } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Consulta y filtra todos los pedidos de la tienda.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o nº pedido"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            navigate({ search: { ...filters, status: value === "all" ? "" : value, page: 1 } })
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {orderStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.fromDate}
          onChange={(e) => navigate({ search: { ...filters, fromDate: e.target.value, page: 1 } })}
          className="w-full sm:w-auto"
          aria-label="Desde"
        />
        <Input
          type="date"
          value={filters.toDate}
          onChange={(e) => navigate({ search: { ...filters, toDate: e.target.value, page: 1 } })}
          className="w-full sm:w-auto"
          aria-label="Hasta"
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {isLoading && <LoadingState rows={6} />}

      {isError && (
        <ErrorState
          message={error instanceof Error ? error.message : "Error desconocido"}
          onRetry={() => void refetch()}
        />
      )}

      {data && data.orders.length === 0 && (
        <EmptyState
          title="No se encontraron pedidos"
          description={
            hasActiveFilters
              ? "Prueba a ajustar los filtros de búsqueda."
              : "Todavía no se ha registrado ningún pedido."
          }
        />
      )}

      {data && data.orders.length > 0 && (
        <div className="space-y-4">
          <OrdersTable orders={data.orders} />
          <AdminPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onPageChange={(page) => navigate({ search: { ...filters, page } })}
          />
        </div>
      )}
    </div>
  );
}
