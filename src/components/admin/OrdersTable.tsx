import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/data/catalog";
import type { OrderRow } from "@/lib/admin/api";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="group">
              <TableCell className="font-medium text-foreground">
                <Link
                  to="/admin/orders/$id"
                  params={{ id: order.id }}
                  className="hover:text-primary hover:underline"
                >
                  {order.order_number}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-foreground">{order.customer_name}</span>
                  <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {formatPrice(order.total)}
              </TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell>
                <Link
                  to="/admin/orders/$id"
                  params={{ id: order.id }}
                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Ver detalle"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
