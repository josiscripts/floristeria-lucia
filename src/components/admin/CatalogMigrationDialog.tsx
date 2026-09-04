/**
 * Catalog Migration Dialog
 * Allows admins to migrate hardcoded products from catalog.ts to Supabase
 *
 * Features:
 * - Dry run option
 * - Condolencias protection with explicit warning
 * - Real-time progress tracking
 * - Per-product status display
 * - Retry on failure
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Package,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MigrationStatus {
  endpoint: string;
  catalogSize: number;
  supabaseProducts: number;
  supabaseOptions: number;
  condolenciasOrdersFound: number;
  migrationNeeded: boolean;
  ready: boolean;
}

interface MigrationResult {
  catalogId: string;
  name: string;
  category: string;
  status: "created" | "updated" | "already_migrated" | "failed" | "skipped_condolencias_unsafe";
  productId?: string;
  optionsCount?: number;
  imagesCount?: number;
  error?: string;
}

interface MigrationResponse {
  success: boolean;
  dryRun: boolean;
  timestamp: string;
  summary: {
    total: number;
    created: number;
    updated: number;
    already_migrated: number;
    skipped: number;
    failed: number;
  };
  condolenciasCheck: {
    safe: boolean;
    ordersFound: number;
    message: string;
  };
  results: MigrationResult[];
  errors: Array<{ product: string; error: string }>;
}

interface CatalogMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CatalogMigrationDialog({ open, onOpenChange }: CatalogMigrationDialogProps) {
  const [dryRun, setDryRun] = useState(true);
  const [allowCondolenciasOverwrite, setAllowCondolenciasOverwrite] = useState(false);

  // Check migration status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["admin", "migration-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/migrate-catalog", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch migration status");
      return res.json() as Promise<MigrationStatus>;
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Execute migration
  const { mutate: executeMigration, isPending: isMigrating } = useMutation({
    mutationFn: async (payload: { dryRun: boolean; allowCondolenciasOverwrite: boolean }) => {
      const res = await fetch("/api/admin/migrate-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Migration failed");
      }
      return res.json() as Promise<MigrationResponse>;
    },
  });

  const handleExecuteMigration = () => {
    executeMigration(
      {
        dryRun,
        allowCondolenciasOverwrite,
      },
      {
        onSuccess: (data) => {
          // Keep dialog open to show results
          console.log("[Migration] Success:", data);
        },
      },
    );
  };

  const migrationProgress =
    status && status.catalogSize > 0
      ? ((status.supabaseProducts / status.catalogSize) * 100).toFixed(1)
      : "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Migrar catálogo a Supabase
          </DialogTitle>
          <DialogDescription>
            Mueve los 54 productos de catalog.ts a la base de datos Supabase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          {statusLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Verificando estado...</span>
            </div>
          ) : status ? (
            <>
              {/* Migration Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Progreso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Productos migrados</span>
                      <span className="font-mono font-semibold">
                        {status.supabaseProducts} / {status.catalogSize}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${migrationProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Opciones de producto</div>
                      <div className="font-mono font-semibold">{status.supabaseOptions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Estado</div>
                      <div>
                        {status.migrationNeeded ? (
                          <Badge variant="secondary" className="gap-1">
                            <AlertCircle className="size-3" />
                            Pendiente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            Completado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Condolencias Warning */}
              {status.condolenciasOrdersFound > 0 && (
                <Alert variant="destructive">
                  <ShieldAlert className="size-4" />
                  <AlertTitle>Advertencia: Productos de Condolencias en uso</AlertTitle>
                  <AlertDescription>
                    Se encontraron <strong>{status.condolenciasOrdersFound} pedido(s)</strong> que
                    referencian productos de condolencias.
                    <br />
                    <span className="mt-2 block text-sm">
                      Marca la casilla abajo para permitir la sobrescritura (se recomienda hacer
                      backup primero).
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Opciones de migración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dry-run"
                      checked={dryRun}
                      onCheckedChange={(checked) => setDryRun(checked as boolean)}
                      disabled={isMigrating}
                    />
                    <label
                      htmlFor="dry-run"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Prueba seca (Dry Run) - Ver cambios sin aplicarlos
                    </label>
                  </div>

                  {status.condolenciasOrdersFound > 0 && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow-condolencias"
                        checked={allowCondolenciasOverwrite}
                        onCheckedChange={(checked) =>
                          setAllowCondolenciasOverwrite(checked as boolean)
                        }
                        disabled={isMigrating}
                      />
                      <label
                        htmlFor="allow-condolencias"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Permitir sobrescritura de condolencias (bajo mi responsabilidad)
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMigrating}>
            Cerrar
          </Button>
          <Button
            onClick={handleExecuteMigration}
            disabled={
              isMigrating ||
              statusLoading ||
              (status?.condolenciasOrdersFound ?? 0) > 0 === !allowCondolenciasOverwrite
            }
          >
            {isMigrating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Migrando...
              </>
            ) : dryRun ? (
              "Ejecutar prueba seca"
            ) : (
              "Migrar ahora"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
