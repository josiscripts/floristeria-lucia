import { Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShop } from "@/context/ShopContext";
import { useT } from "@/context/LanguageContext";
import { useCatalogText } from "@/i18n/catalog-text";
import { categoryLabels, formatPrice, products } from "@/data/catalog";

const addOnIds = ["jarron-cristal-2", "chocolate-belga-pequena", "oso-peluche", "piruletas"];

export function CartDrawer() {
  const t = useT();
  const { productName } = useCatalogText();
  const { cartOpen, setCartOpen, lines, setQty, removeLine, total, addLine } = useShop();
  const navigate = useNavigate();
  const addOns = products.filter((p) => addOnIds.includes(p.id));

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">{t("cart.title")}</SheetTitle>
          <SheetDescription>{t("cart.description")}</SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("cart.emptyMessage")}</p>
            <Button asChild onClick={() => setCartOpen(false)}>
              <Link to="/catalogo">{t("common.seeCatalog")}</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4">
            <ul className="divide-y divide-border/70">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-3 py-4">
                  <img
                    src={line.image}
                    alt={line.name}
                    loading="lazy"
                    width={80}
                    height={80}
                    className="size-20 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">{line.size}</p>
                    {line.category && (
                      <p className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] text-secondary-foreground">
                        {line.category}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {formatPrice(line.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7"
                        aria-label={t("cart.removeOne")}
                        onClick={() => setQty(line.key, line.qty - 1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm">{line.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7"
                        aria-label={t("cart.addOne")}
                        onClick={() => setQty(line.key, line.qty + 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-7 text-muted-foreground"
                        aria-label={t("cart.removeFromCart")}
                        onClick={() => removeLine(line.key)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg bg-surface p-4">
              <p className="text-sm font-medium">{t("cart.addDetail")}</p>
              <div className="mt-3 flex flex-col gap-2">
                {addOns.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      addLine({
                        productId: p.id,
                        name: p.name,
                        size: t("cart.standardSize"),
                        category: categoryLabels[p.category],
                        price: p.priceMin,
                        image: p.image,
                      })
                    }
                    className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    <span className="min-w-0 truncate">{productName(p)}</span>
                    <span className="shrink-0 text-muted-foreground">
                      +{formatPrice(p.priceMin)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {lines.length > 0 && (
          <div className="mt-auto flex flex-col gap-3 border-t border-border/70 p-4">
            <div className="flex w-full items-center justify-between text-base">
              <span className="text-muted-foreground">{t("cart.total")}</span>
              <span className="font-semibold">{formatPrice(total)}</span>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setCartOpen(false);
                void navigate({ to: "/carrito" });
              }}
            >
              {t("cart.finishOrder")}
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => setCartOpen(false)}>
              {t("cart.keepShopping")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
