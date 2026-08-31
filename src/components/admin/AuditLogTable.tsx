import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLogRow } from "@/lib/admin/api";

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

export function AuditLogTable({ logs }: { logs: AuditLogRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Recurso</TableHead>
            <TableHead>Registro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(log.created_at)}
              </TableCell>
              <TableCell className="font-medium text-foreground">{log.action}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{log.resource}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {log.record_id || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
