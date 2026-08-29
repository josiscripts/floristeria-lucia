import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/catalog";
import type { Tables } from "@/integrations/supabase/types";

type OrderRow = Tables<"orders">;
type OrderItemRow = Tables<"order_items">;

interface ConfirmationLoaderData {
  order: OrderRow;
  items: OrderItemRow[];
}

export const Route = createFileRoute("/confirmation/$orderId")({
  loader: async ({ params }): Promise<ConfirmationLoaderData> => {
    const orderId = (params as unknown as { orderId: string }).orderId;

    if (!orderId || typeof orderId !== "string") {
      throw notFound();
    }

    try {
      const response = await fetch(`/api/confirmation?orderId=${encodeURIComponent(orderId)}`);

      if (!response.ok) {
        console.error("[Confirmation] API returned error:", response.status);
        throw notFound();
      }

      return await response.json();
    } catch (error) {
      console.error("[Confirmation] Loader error:", error);
      throw notFound();
    }
  },
  head: () => ({
    meta: [
      { title: "Pedido confirmado · floristeria lucia" },
      {
        name: "description",
        content: "Tu pedido ha sido confirmado correctamente.",
      },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const loaderData = Route.useLoaderData() as ConfirmationLoaderData;
  const { order, items } = loaderData;

  const deliveryDate = order.delivery_date
    ? new Date(order.delivery_date).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const createdDate = new Date(order.created_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-background">
      <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
        {/* Success Badge */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
            <Check className="size-8 text-green-600" strokeWidth={3} />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-center font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Pedido confirmado
        </h1>
        <p className="mt-6 text-center text-sm text-muted-foreground max-w-xl mx-auto">
          Gracias por tu compra. Tu pedido ha sido registrado correctamente y te enviaremos un email
          de confirmación.
        </p>

        <div className="mt-12 border-t border-border/60" />

        {/* Order Details */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {/* Left Column */}
          <div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Número de pedido
              </p>
              <p className="font-display text-2xl text-foreground">{order.order_number}</p>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Fecha de pedido
              </p>
              <p className="text-sm text-foreground">{createdDate}</p>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Estado</p>
              <p className="text-sm font-medium text-foreground capitalize">
                {order.status === "pending" && "Pendiente de procesar"}
                {order.status === "confirmed" && "Confirmado"}
                {order.status === "preparing" && "En preparación"}
                {order.status === "ready" && "Listo para envío"}
                {order.status === "delivered" && "Entregado"}
                {order.status === "cancelled" && "Cancelado"}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total</p>
              <p className="font-display text-3xl text-primary">{formatPrice(order.total)}</p>
            </div>

            {deliveryDate && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Fecha de entrega
                </p>
                <p className="text-sm text-foreground">{deliveryDate}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-border/60" />

        {/* Customer Details */}
        <div className="mt-12">
          <h2 className="font-display text-xl text-foreground mb-6">Datos de entrega</h2>
          <div className="space-y-3 text-sm">
            <p className="text-foreground">
              <span className="text-muted-foreground">Nombre:</span> {order.customer_name}
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Email:</span>{" "}
              <a href={`mailto:${order.customer_email}`} className="text-primary hover:underline">
                {order.customer_email}
              </a>
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Teléfono:</span>{" "}
              <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                {order.customer_phone}
              </a>
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Dirección:</span> {order.address}
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Ciudad:</span> {order.city},{" "}
              {order.postal_code} ({order.country})
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-12 border-t border-border/60" />
        <div className="mt-12">
          <h2 className="font-display text-xl text-foreground mb-6">Productos</h2>

          {items.length > 0 ? (
            <div className="space-y-6">
              {items.map((item: OrderItemRow, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between pb-6 border-b border-border/60 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Tamaño: {item.size}</p>
                    {item.color && (
                      <p className="text-xs text-muted-foreground">Color: {item.color}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {item.quantity} × {formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-medium text-foreground whitespace-nowrap">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No se encontraron productos en la orden.
            </p>
          )}

          {/* Subtotal/Total */}
          <div className="mt-8 space-y-2 text-sm border-t border-border/60 pt-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-display">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Special Notes */}
        {(order.dedicatory || order.notes) && (
          <>
            <div className="mt-12 border-t border-border/60" />
            <div className="mt-12">
              {order.dedicatory && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Dedicatoria
                  </p>
                  <p className="text-sm text-foreground italic">"{order.dedicatory}"</p>
                </div>
              )}

              {order.notes && (
                <div className={order.dedicatory ? "mt-6" : ""}>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Notas especiales
                  </p>
                  <p className="text-sm text-foreground">{order.notes}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center gap-4 border-t border-border/60 pt-12">
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Recibirás un email de confirmación en breve. Si tienes alguna pregunta, no dudes en
            contactarnos.
          </p>
          <Link to="/catalogo">
            <Button variant="outline" size="lg" className="mt-4">
              <Home className="mr-2 size-4" />
              Volver al catálogo
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
