import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Package, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useShop } from "@/context/ShopContext";
import { useT } from "@/context/LanguageContext";
import { formatPrice } from "@/data/catalog";
import type { CreateOrderRequest } from "@/lib/orders.server";

export const Route = createFileRoute("/checkout")({
  beforeLoad: ({ context }) => {
    // This will be checked client-side too, but redirect early if possible
  },
  head: () => ({
    meta: [
      { title: "Checkout · floristeria lucia" },
      {
        name: "description",
        content: "Completa tu pedido con floristeria lucia.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const t = useT();
  const navigate = useNavigate({ from: "/checkout" });
  const { lines, total, clearCart } = useShop();

  // Redirect if cart is empty
  if (lines.length === 0) {
    return (
      <div className="bg-background">
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-col items-center gap-5 border-t border-border/60 py-20 text-center">
            <Package className="size-8 text-muted-foreground" strokeWidth={1.2} />
            <h2 className="font-display text-2xl text-foreground">Carrito vacío</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              No hay productos en tu carrito. Vuelve al catálogo para añadir productos.
            </p>
            <Button onClick={() => navigate({ to: "/catalogo" })} className="mt-4">
              Volver al catálogo
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return <CheckoutForm lines={lines} total={total} clearCart={clearCart} />;
}

interface CheckoutFormProps {
  lines: typeof useShop extends () => infer R ? (R extends { lines: infer L } ? L : never) : never;
  total: number;
  clearCart: () => void;
}

function CheckoutForm({ lines, total, clearCart }: CheckoutFormProps) {
  const t = useT();
  const navigate = useNavigate({ from: "/checkout" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "ES",
    deliveryDate: "",
    dedicatory: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      setError("El nombre es obligatorio");
      return false;
    }
    if (!formData.customerEmail.trim()) {
      setError("El email es obligatorio");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      setError("El email no es válido");
      return false;
    }
    if (!formData.customerPhone.trim()) {
      setError("El teléfono es obligatorio");
      return false;
    }
    if (!formData.address.trim()) {
      setError("La dirección es obligatoria");
      return false;
    }
    if (!formData.city.trim()) {
      setError("La ciudad es obligatoria");
      return false;
    }
    if (!formData.postalCode.trim()) {
      setError("El código postal es obligatorio");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const orderRequest: CreateOrderRequest = {
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country,
        deliveryDate: formData.deliveryDate || null,
        dedicatory: formData.dedicatory.trim() || null,
        notes: formData.notes.trim() || null,
        cartLines: lines,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderRequest),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear la orden");
      }

      const data = await response.json();

      if (!data.success || !data.orderId) {
        throw new Error("No se pudo crear la orden");
      }

      // Success - clear cart and redirect
      clearCart();
      toast.success("Orden creada correctamente");

      // Navigate to confirmation page
      await navigate({
        to: "/confirmation/$orderId",
        params: { orderId: data.orderId },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background">
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Paso final</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Confirma tu pedido
        </h1>
        <div className="mt-6 h-px w-16 bg-[var(--gold,#BC9047)]/60" />
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Completa los datos de tu envío para finalizar tu compra.
        </p>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
                <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Customer Info */}
            <div>
              <h2 className="font-display text-xl text-foreground mb-5">Datos personales</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName" className="text-xs uppercase tracking-widest">
                    Nombre *
                  </Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail" className="text-xs uppercase tracking-widest">
                    Email *
                  </Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone" className="text-xs uppercase tracking-widest">
                    Teléfono *
                  </Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div>
              <h2 className="font-display text-xl text-foreground mb-5">Dirección de entrega</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="text-xs uppercase tracking-widest">
                    Dirección *
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-2"
                    placeholder="Calle, número, piso..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-xs uppercase tracking-widest">
                      Ciudad *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode" className="text-xs uppercase tracking-widest">
                      Código postal *
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country" className="text-xs uppercase tracking-widest">
                    País
                  </Label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-2 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="ES">España</option>
                    <option value="PT">Portugal</option>
                    <option value="FR">Francia</option>
                    <option value="IT">Italia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div>
              <h2 className="font-display text-xl text-foreground mb-5">Detalles del pedido</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deliveryDate" className="text-xs uppercase tracking-widest">
                    Fecha de entrega preferida
                  </Label>
                  <Input
                    id="deliveryDate"
                    name="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="dedicatory" className="text-xs uppercase tracking-widest">
                    Dedicatoria (opcional)
                  </Label>
                  <Textarea
                    id="dedicatory"
                    name="dedicatory"
                    value={formData.dedicatory}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-2"
                    placeholder="Dedica tu regalo..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-xs uppercase tracking-widest">
                    Notas especiales (opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-2"
                    placeholder="Indica tus preferencias o instrucciones..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creando pedido...
                </>
              ) : (
                "Confirmar pedido"
              )}
            </Button>
          </form>

          {/* Summary */}
          <aside className="h-fit border border-border/60 bg-surface/60 p-7 lg:sticky lg:top-28">
            <h2 className="font-display text-2xl text-foreground">Resumen</h2>

            {/* Items */}
            <div className="mt-6 space-y-4 border-t border-border/60 pt-5">
              {lines.map((line) => (
                <div key={line.key} className="flex justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{line.name}</p>
                    <p className="text-xs text-muted-foreground">{line.size}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.qty} × {formatPrice(line.price)}
                    </p>
                  </div>
                  <p className="ml-2 font-medium text-foreground whitespace-nowrap">
                    {formatPrice(line.price * line.qty)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 space-y-3 border-t border-border/60 pt-5">
              <div className="flex items-center justify-between border-t border-border/60 pt-4 text-base">
                <span className="font-display text-foreground">Total</span>
                <span className="font-display text-lg text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Los costos de envío se confirmarán según la dirección y disponibilidad.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
