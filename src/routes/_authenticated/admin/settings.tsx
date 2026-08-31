import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { AdminPagination } from "@/components/admin/Pagination";
import { LoadingState } from "@/components/admin/LoadingState";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState } from "@/components/admin/ErrorState";
import { useAuth } from "@/hooks/useAuth";
import { fetchAuditLogs } from "@/lib/admin/api";

interface SettingsSearch {
  page?: number;
}

export const Route = createFileRoute("/_authenticated/admin/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    page: Number(search["page"]) > 0 ? Number(search["page"]) : 1,
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const rawFilters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = rawFilters.page ?? 1;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "audit-logs", page],
    queryFn: () => fetchAuditLogs({ page, limit: 20 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Información de la cuenta administrativa y registro de auditoría.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <ShieldCheck className="size-4 text-primary" />
            Cuenta administrativa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {user?.email ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Rol: </span>
            admin
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Registro de auditoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <LoadingState rows={6} />}

          {isError && (
            <ErrorState
              message={error instanceof Error ? error.message : "Error desconocido"}
              onRetry={() => void refetch()}
            />
          )}

          {data && data.logs.length === 0 && (
            <EmptyState
              title="Sin actividad registrada"
              description="Las acciones administrativas sensibles aparecerán aquí."
            />
          )}

          {data && data.logs.length > 0 && (
            <div className="space-y-4">
              <AuditLogTable logs={data.logs} />
              <AdminPagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                total={data.pagination.total}
                onPageChange={(newPage) => navigate({ search: { page: newPage } })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
