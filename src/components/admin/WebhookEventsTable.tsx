import { useState } from "react";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { WebhookPayloadDialog } from "@/components/admin/WebhookPayloadDialog";
import { retryWebhookEvent, type WebhookEventRow } from "@/lib/admin/api";

const RETRYABLE_EVENT_TYPES = new Set(["opportunity.stage_change"]);

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RetryButton({ event }: { event: WebhookEventRow }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const canRetry = RETRYABLE_EVENT_TYPES.has(event.event_type);

  const mutation = useMutation({
    mutationFn: () => retryWebhookEvent(event.id),
    onMutate: () => setPending(true),
    onSuccess: (data) => {
      if (data.result.success) {
        toast.success("Evento reprocesado correctamente");
      } else {
        toast.error(data.result.error || "El reintento no tuvo éxito");
      }
      void queryClient.invalidateQueries({ queryKey: ["admin", "webhook-events"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "No se pudo reintentar el evento");
    },
    onSettled: () => setPending(false),
  });

  if (!canRetry) {
    return (
      <span
        className="text-xs text-muted-foreground"
        title="Solo se puede reintentar opportunity.stage_change"
      >
        No disponible
      </span>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => mutation.mutate()}>
      <RotateCw className={pending ? "size-4 animate-spin" : "size-4"} />
      Reintentar
    </Button>
  );
}

export function WebhookEventsTable({ events }: { events: WebhookEventRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evento</TableHead>
            <TableHead>Opportunity</TableHead>
            <TableHead>Recibido</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Payload</TableHead>
            <TableHead>Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium text-foreground">{event.event_type}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {event.opportunity_id}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(event.received_at)}
              </TableCell>
              <TableCell>
                {event.processed ? (
                  <span className="text-xs font-medium text-green-700">Procesado</span>
                ) : (
                  <span className="text-xs font-medium text-amber-700">Pendiente</span>
                )}
                {event.error_message && (
                  <p
                    className="mt-1 max-w-xs truncate text-xs text-destructive"
                    title={event.error_message}
                  >
                    {event.error_message}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <WebhookPayloadDialog payload={event.payload} />
              </TableCell>
              <TableCell>
                <RetryButton event={event} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
