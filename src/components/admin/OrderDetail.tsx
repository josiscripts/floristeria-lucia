import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/data/catalog";
import type { OrderDetailResponse } from "@/lib/admin/api";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetail({ order, items, events }: OrderDetailResponse) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-xl">Productos</CardTitle>
            <StatusBadge status={order.status} />
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No se encontraron productos en este pedido.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Tamaño: {item.size}
                        {item.color ? ` · Color: ${item.color}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                      {item.special_instructions && (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          "{item.special_instructions}"
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-medium text-foreground">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between font-display text-base text-foreground">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {(order.dedicatory || order.notes) && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.dedicatory && <p className="italic text-foreground">"{order.dedicatory}"</p>}
              {order.notes && <p className="text-muted-foreground">{order.notes}</p>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Eventos relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay eventos de webhook registrados para este pedido.
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between gap-3 border-b border-border pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{event.event_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.received_at)}
                      </p>
                      {event.error_message && (
                        <p className="mt-1 text-xs text-destructive">{event.error_message}</p>
                      )}
                    </div>
                    <span
                      className={
                        event.processed
                          ? "text-xs font-medium text-green-700"
                          : "text-xs font-medium text-amber-700"
                      }
                    >
                      {event.processed ? "Procesado" : "Pendiente"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Pedido {order.order_number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Creado</p>
              <p className="text-foreground">{formatDateTime(order.created_at)}</p>
            </div>
            {order.delivery_date && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fecha de entrega
                </p>
                <p className="text-foreground">
                  {new Date(order.delivery_date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium text-foreground">{order.customer_name}</p>
            <p className="text-muted-foreground">
              <a
                href={`mailto:${order.customer_email}`}
                className="hover:text-primary hover:underline"
              >
                {order.customer_email}
              </a>
            </p>
            <p className="text-muted-foreground">
              <a
                href={`tel:${order.customer_phone}`}
                className="hover:text-primary hover:underline"
              >
                {order.customer_phone}
              </a>
            </p>
            <div className="border-t border-border pt-2">
              <p className="text-foreground">{order.address}</p>
              <p className="text-muted-foreground">
                {order.city}, {order.postal_code} ({order.country})
              </p>
            </div>
          </CardContent>
        </Card>

        {(order.ghl_contact_id || order.ghl_opportunity_id) && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Integración GHL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {order.ghl_contact_id && <p>Contact ID: {order.ghl_contact_id}</p>}
              {order.ghl_opportunity_id && <p>Opportunity ID: {order.ghl_opportunity_id}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
