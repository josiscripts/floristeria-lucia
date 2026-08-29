import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { AdminPagination } from "@/components/admin/Pagination";
import { LoadingState } from "@/components/admin/LoadingState";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState } from "@/components/admin/ErrorState";
import { fetchProducts } from "@/lib/admin/api";

interface ProductsSearch {
  page?: number;
  status?: string;
  search?: string;
}

export const Route = createFileRoute("/_authenticated/admin/products/")({
  validateSearch: (search: Record<string, unknown>): ProductsSearch => ({
    page: Number(search["page"]) > 0 ? Number(search["page"]) : 1,
    status: typeof search["status"] === "string" ? search["status"] : "",
    search: typeof search["search"] === "string" ? search["search"] : "",
  }),
  component: ProductsListPage,
});

function ProductsListPage() {
  const rawFilters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filters = {
    page: rawFilters.page ?? 1,
    status: rawFilters.status ?? "",
    search: rawFilters.search ?? "",
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
    queryKey: ["admin", "products", filters],
    queryFn: () => fetchProducts(filters),
  });

  const hasActiveFilters = filters.status || filters.search;

  const clearFilters = () => {
    setSearchInput("");
    navigate({ search: { page: 1, status: "", search: "" } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">Catálogo sincronizado con GoHighLevel.</p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="size-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU"
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
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>

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

      {data && data.products.length === 0 && (
        <EmptyState
          title="No se encontraron productos"
          description={
            hasActiveFilters
              ? "Prueba a ajustar los filtros de búsqueda."
              : "Todavía no hay productos en el catálogo."
          }
        />
      )}

      {data && data.products.length > 0 && (
        <div className="space-y-4">
          <ProductsTable products={data.products} />
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
