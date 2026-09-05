import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useShop } from "@/context/ShopContext";
import { useT } from "@/context/LanguageContext";
import { formatPrice } from "@/data/catalog";

export const Route = createFileRoute("/carrito")({
  head: () => ({
    meta: [
      { title: "Tu carrito · floristeria lucia" },
      {
        name: "description",
        content:
          "Revisa los productos, cantidades y el total de tu pedido antes de continuar con floristeria lucia.",
      },
      { property: "og:title", content: "Tu carrito · floristeria lucia" },
      {
        property: "og:description",
        content: "Revisa tus flores, cantidades y total antes de continuar con tu pedido.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const t = useT();
  const navigate = useNavigate({ from: "/carrito" });
  const { lines, setQty, removeLine, total, clearCart } = useShop();

  return (
    <div className="bg-background">
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">
          {t("cart.pageEyebrow")}
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          {t("cart.pageTitle")}
        </h1>
        <div className="mt-6 h-px w-16 bg-[var(--gold,#BC9047)]/60" />
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("cart.pageIntro")}
        </p>

        {lines.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-5 border-t border-border/60 py-20 text-center">
            <ShoppingBag className="size-8 text-muted-foreground" strokeWidth={1.2} />
            <h2 className="font-display text-2xl text-foreground">{t("cart.emptyTitle")}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">{t("cart.emptySubtitle")}</p>
            <Link
              to="/catalogo"
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--gold,#BC9047)]/50 px-7 py-3 text-[0.7rem] uppercase tracking-[0.25em] text-foreground transition-colors duration-300 hover:bg-surface"
            >
              {t("cart.addProducts")} <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <div className="mt-14 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            <div>
              <div className="hidden border-b border-border/60 pb-3 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground sm:grid sm:grid-cols-[1fr_auto_auto]">
                <span>{t("cart.product")}</span>
                <span className="px-8">{t("cart.quantity")}</span>
                <span className="text-right">{t("cart.subtotalLine")}</span>
              </div>

              <ul className="divide-y divide-border/60">
                {lines.map((line) => (
                  <li
                    key={line.key}
                    className="flex flex-col gap-5 py-7 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                  >
                    <div className="flex gap-4">
                      <img
                        src={line.image}
                        alt={line.name}
                        loading="lazy"
                        width={112}
                        height={140}
                        className="h-32 w-24 shrink-0 rounded-sm object-cover sm:h-36 sm:w-28"
                      />
                      <div className="min-w-0">
                        <p className="font-display text-lg leading-snug text-foreground">
                          {line.name}
                        </p>
                        {line.size && (
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {line.size}
                          </p>
                        )}
                        {line.category && (
                          <p className="mt-1 text-xs text-muted-foreground">{line.category}</p>
                        )}
                        <p className="mt-3 text-sm text-primary">{formatPrice(line.price)}</p>
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.4} />
                          {t("cart.removeFromCart")}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:px-8">
                      <button
                        type="button"
                        aria-label={t("cart.removeOne")}
                        onClick={() => setQty(line.key, line.qty - 1)}
                        className="flex size-9 items-center justify-center rounded-full border border-border/70 text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Minus className="size-3.5" strokeWidth={1.5} />
                      </button>
                      <span className="w-6 text-center text-sm">{line.qty}</span>
                      <button
                        type="button"
                        aria-label={t("cart.addOne")}
                        onClick={() => setQty(line.key, line.qty + 1)}
                        className="flex size-9 items-center justify-center rounded-full border border-border/70 text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Plus className="size-3.5" strokeWidth={1.5} />
                      </button>
                    </div>

                    <p className="text-sm font-medium text-foreground sm:text-right">
                      {formatPrice(line.price * line.qty)}
                    </p>
                  </li>
                ))}
              </ul>

              <Link
                to="/catalogo"
                className="mt-10 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-primary"
              >
                ← {t("cart.keepShoppingLink")}
              </Link>
            </div>

            <aside className="h-fit border border-border/60 bg-surface/60 p-7 lg:sticky lg:top-28">
              <h2 className="font-display text-2xl text-foreground">{t("cart.summary")}</h2>
              <div className="mt-6 space-y-3 border-t border-border/60 pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-4 text-base">
                  <span className="font-display text-lg">{t("cart.total")}</span>
                  <span className="font-semibold">{formatPrice(total)}</span>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {t("cart.shippingNote")}
              </p>
              <Button
                size="lg"
                className="mt-7 w-full rounded-full text-[0.7rem] uppercase tracking-[0.2em]"
                onClick={() => navigate({ to: "/checkout" })}
              >
                {t("cart.continueStep")}
              </Button>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
