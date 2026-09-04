/**
 * Catalog Migration Card
 * Settings card for admin panel to trigger catalog migration from hardcoded data
 * Shows current migration status and migration history
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertCircle, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogMigrationDialog } from "@/components/admin/CatalogMigrationDialog";
import { LoadingState } from "@/components/admin/LoadingState";
import { ErrorState } from "@/components/admin/ErrorState";

interface MigrationStatus {
  endpoint: string;
  catalogSize: number;
  supabaseProducts: number;
  supabaseOptions: number;
  condolenciasOrdersFound: number;
  migrationNeeded: boolean;
  ready: boolean;
}

export function CatalogMigrationCard() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: status, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "migration-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/migrate-catalog", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch migration status");
      return res.json() as Promise<MigrationStatus>;
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const migrationProgress =
    status && status.catalogSize > 0
      ? ((status.supabaseProducts / status.catalogSize) * 100).toFixed(0)
      : "0";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Package className="size-4 text-primary" />
            Migración de catálogo
          </CardTitle>
          <CardDescription>
            Migra los 54 productos de catalog.ts a la base de datos Supabase
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLoading && <LoadingState rows={3} />}

          {isError && (
            <ErrorState
              message={error instanceof Error ? error.message : "Error desconocido"}
              onRetry={() => void refetch()}
            />
          )}

          {status && (
            <>
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={status.ready ? "outline" : "secondary"}>
                  Endpoint: {status.ready ? "✓ Listo" : "✗ No disponible"}
                </Badge>
                <Badge variant={status.migrationNeeded ? "secondary" : "outline"}>
                  {status.migrationNeeded ? "Migración pendiente" : "Migración completada"}
                </Badge>
              </div>

              {/* Migration Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Productos migrados</span>
                  <span className="font-mono font-semibold">
                    {status.supabaseProducts} / {status.catalogSize}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${migrationProgress}%`,
                      backgroundColor:
                        status.supabaseProducts === status.catalogSize
                          ? "rgb(34, 197, 94)" // green-500
                          : "rgb(59, 130, 246)", // blue-500
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Catálogo total</p>
                  <p className="text-lg font-semibold">{status.catalogSize}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Productos BD</p>
                  <p className="text-lg font-semibold">{status.supabaseProducts}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Opciones</p>
                  <p className="text-lg font-semibold">{status.supabaseOptions}</p>
                </div>
              </div>

              {/* Condolencias Warning */}
              {status.condolenciasOrdersFound > 0 && (
                <div className="flex gap-3 rounded-lg bg-yellow-50 p-3 text-sm dark:bg-yellow-950">
                  <AlertCircle className="size-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                  <div className="text-yellow-800 dark:text-yellow-200">
                    <strong>Advertencia:</strong> Hay {status.condolenciasOrdersFound} pedido(s)
                    que referencian productos de condolencias. Requiere confirmación para migrar.
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setDialogOpen(true)}
                  disabled={!status.ready}
                  variant={status.migrationNeeded ? "default" : "secondary"}
                >
                  {status.migrationNeeded ? "Iniciar migración" : "Ver estado"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void refetch()}
                  disabled={isLoading}
                  size="sm"
                >
                  Actualizar
                </Button>
              </div>

              {/* Helper Text */}
              <div className="text-xs text-muted-foreground">
                {status.migrationNeeded ? (
                  <p>
                    <strong>Próximos pasos:</strong> Haz clic en "Iniciar migración" para comenzar
                    el proceso. Se recomienda usar "Prueba seca" primero.
                  </p>
                ) : (
                  <p className="flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Todos los productos han sido migrados correctamente.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Migration Dialog */}
      <CatalogMigrationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
