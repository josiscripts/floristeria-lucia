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
import { WebhookEventsTable } from "@/components/admin/WebhookEventsTable";
import { AdminPagination } from "@/components/admin/Pagination";
import { LoadingState } from "@/components/admin/LoadingState";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState } from "@/components/admin/ErrorState";
import { fetchWebhookEvents } from "@/lib/admin/api";

interface WebhooksSearch {
  page?: number;
  eventType?: string;
  processed?: string;
  search?: string;
}

const EVENT_TYPES = [
  "opportunity.stage_change",
  "opportunity.updated",
  "opportunity.status_change",
];

export const Route = createFileRoute("/_authenticated/admin/webhooks")({
  validateSearch: (search: Record<string, unknown>): WebhooksSearch => ({
    page: Number(search["page"]) > 0 ? Number(search["page"]) : 1,
    eventType: typeof search["eventType"] === "string" ? search["eventType"] : "",
    processed: typeof search["processed"] === "string" ? search["processed"] : "",
    search: typeof search["search"] === "string" ? search["search"] : "",
  }),
  component: WebhooksPage,
});

function WebhooksPage() {
  const rawFilters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filters = {
    page: rawFilters.page ?? 1,
    eventType: rawFilters.eventType ?? "",
    processed: rawFilters.processed ?? "",
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
    queryKey: ["admin", "webhook-events", filters],
    queryFn: () =>
      fetchWebhookEvents({
        ...filters,
        processed:
          filters.processed === "true" || filters.processed === "false"
            ? filters.processed
            : undefined,
      }),
  });

  const hasActiveFilters = filters.eventType || filters.processed || filters.search;

  const clearFilters = () => {
    setSearchInput("");
    navigate({ search: { page: 1, eventType: "", processed: "", search: "" } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Webhooks</h1>
        <p className="text-sm text-muted-foreground">
          Historial de eventos recibidos desde GoHighLevel.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por opportunity ID"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.eventType || "all"}
          onValueChange={(value) =>
            navigate({ search: { ...filters, eventType: value === "all" ? "" : value, page: 1 } })
          }
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los eventos</SelectItem>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.processed || "all"}
          onValueChange={(value) =>
            navigate({ search: { ...filters, processed: value === "all" ? "" : value, page: 1 } })
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Procesado</SelectItem>
            <SelectItem value="false">Pendiente</SelectItem>
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

      {data && data.events.length === 0 && (
        <EmptyState
          title="No se encontraron eventos"
          description={
            hasActiveFilters
              ? "Prueba a ajustar los filtros de búsqueda."
              : "Todavía no se ha recibido ningún webhook."
          }
        />
      )}

      {data && data.events.length > 0 && (
        <div className="space-y-4">
          <WebhookEventsTable events={data.events} />
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
