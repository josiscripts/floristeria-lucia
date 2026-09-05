import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Heart, Minus, Plus, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useShop } from "@/context/ShopContext";
import { useCatalogText } from "@/i18n/catalog-text";
import {
  categoryLabels,
  formatPrice,
  isRibbonFree,
  RIBBON_PRICE,
  ribbonCost,
  supportsRibbon,
} from "@/data/catalog";
import { useSupabaseProduct } from "@/hooks/useSupabaseProduct";
import { useSupabaseProductsByCategory } from "@/hooks/useSupabaseProductsByCategory";
import {
  supabaseProductToLegacy,
  getSupabasePriceTiers,
  getImageForColor,
} from "@/lib/convert-supabase-product";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producto/$id")({
  head: () => ({
    meta: [
      { title: "Producto · floristeria lucia" },
      { name: "description", content: "Producto de nuestra floristería en San Fernando de Henares." },
      { property: "og:title", content: "Producto · floristeria lucia" },
      { property: "og:description", content: "Descubre nuestro producto especial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { productName, productDescription, productBadge, tierLabel } = useCatalogText();
  const { addLine, setCartOpen, toggleFavorite, isFavorite } = useShop();

  // FASE 5.1: Fetch product from Supabase only (no fallback to hardcoded data)
  const { data: supabaseProduct } = useSupabaseProduct(id);

  // Use Supabase product only
  const product = supabaseProduct ? supabaseProductToLegacy(supabaseProduct) : null;

  // Get tiers from Supabase product options
  const tiers = useMemo(() => {
    if (supabaseProduct) {
      return getSupabasePriceTiers(supabaseProduct.product_options);
    }
    return [];
  }, [supabaseProduct]);

  // Get related products from same category
  const { data: categoryProducts = [] } = useSupabaseProductsByCategory(
    product?.category as any,
    { enabled: !!product }
  );
  const related = useMemo(() => {
    return categoryProducts
      .map(supabaseProductToLegacy)
      .filter((p) => p.id !== product?.id)
      .slice(0, 4);
  }, [categoryProducts, product?.id]);

  const [tierIndex, setTierIndex] = useState(0);
  const [colorVariantId, setColorVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [ribbonSelected, setRibbonSelected] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl">{t("product.notFoundTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("product.notFoundText")}</p>
        <Button asChild className="mt-8">
          <Link to="/catalogo">{t("product.back")}</Link>
        </Button>
      </div>
    );
  }

  const tier = tiers[tierIndex] ?? tiers[0];
  const unitPrice = tier?.price ?? product.priceMin;
  const favorite = isFavorite(product.id);
  const name = productName(product);
  const badge = productBadge(product);
  const canRibbon = supportsRibbon(product);
  const subtotal = unitPrice * qty;
  const ribbonFree = isRibbonFree(subtotal);
  const ribbonPrice = ribbonSelected ? ribbonCost(subtotal) : 0;
  const orderTotal = subtotal + ribbonPrice;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <Link
        to="/catalogo"
        search={{ categoria: product.category }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {t("product.back")}
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card">
          <img
            src={
              supabaseProduct
                ? getImageForColor(supabaseProduct, colorVariantId)
                : product.image
            }
            alt={name}
            width={1024}
            height={1024}
            className="aspect-square w-full object-cover"
          />
          {badge && (
            <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-primary-foreground">
              {badge}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-xs tracking-[0.35em] text-primary uppercase">
            {categoryLabels[product.category]}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{name}</h1>
          <p className="mt-4 text-muted-foreground">{productDescription(product)}</p>

          <p className="mt-6 font-display text-3xl text-primary">{formatPrice(unitPrice)}</p>

          {tiers.length > 1 && (
            <div className="mt-6">
              <p className="text-sm font-medium">{t("product.size")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tiers.map((item, i) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTierIndex(i)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      i === tierIndex
                        ? "border-primary bg-primary-soft text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    {tierLabel(item.label)} · {formatPrice(item.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {supabaseProduct && supabaseProduct && supabaseProduct.color_variants.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium">{t("product.color")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {supabaseProduct.color_variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() =>
                      setColorVariantId(colorVariantId === variant.id ? undefined : variant.id)
                    }
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      colorVariantId === variant.id
                        ? "border-primary bg-primary-soft text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && !supabaseProduct && (
            <div className="mt-6">
              <p className="text-sm font-medium">{t("product.color")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorVariantId(colorVariantId === c ? undefined : c)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      colorVariantId === c
                        ? "border-primary bg-primary-soft text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!product.quoteOnly && (
            <div className="mt-6">
              <p className="text-sm font-medium">{t("product.quantity")}</p>
              <div className="mt-2 flex items-center gap-4">
                <div className="inline-flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    aria-label="-"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                  <button
                    type="button"
                    aria-label="+"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                {product.roseStep ? (
                  <span className="text-sm text-muted-foreground">
                    {t("product.rosesNote", { count: qty * product.roseStep })}
                  </span>
                ) : null}
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {t("product.productLine")} · {formatPrice(unitPrice)} × {qty}
                  </dt>
                  <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                {canRibbon && ribbonSelected && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">{t("product.ribbonLine")}</dt>
                    <dd className="tabular-nums">
                      {ribbonFree ? t("product.ribbonIncluded") : `+${formatPrice(RIBBON_PRICE)}`}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-2 text-base">
                  <dt className="font-medium">{t("product.total")}</dt>
                  <dd className="font-semibold tabular-nums">{formatPrice(orderTotal)}</dd>
                </div>
              </dl>
            </div>
          )}

          {canRibbon && !product.quoteOnly && (
            <div className="mt-6 rounded-lg border border-border/70 bg-card p-5">
              <p className="text-sm font-medium">{t("product.ribbonSectionTitle")}</p>
              <div className="mt-3 flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="cinta"
                    className="size-4 accent-[var(--color-primary)]"
                    checked={!ribbonSelected}
                    onChange={() => setRibbonSelected(false)}
                  />
                  {t("product.ribbonNone")}
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="cinta"
                    className="size-4 accent-[var(--color-primary)]"
                    checked={ribbonSelected}
                    onChange={() => setRibbonSelected(true)}
                  />
                  {ribbonFree ? t("product.ribbonIncludedOption") : t("product.ribbonAdd")}
                </label>
              </div>
              <div className="mt-4 rounded-md bg-primary-soft/40 p-4">
                <p className="text-sm font-medium">
                  {ribbonFree ? t("product.ribbonFreeTitle") : t("product.ribbonPaidTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground italic">
                  {ribbonFree ? t("product.ribbonFreeText") : t("product.ribbonPaidText")}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {product.quoteOnly ? (
              <Button asChild size="lg">
                <Link to="/contacto">{t("product.requestQuote")}</Link>
              </Button>
            ) : (
              <Button
                size="lg"
                className="min-w-56 flex-1"
                onClick={() => {
                  // Get color name if using Supabase color variant
                  let colorLabel: string | undefined = undefined;
                  if (supabaseProduct && supabaseProduct && colorVariantId) {
                    colorLabel = supabaseProduct.color_variants.find(
                      (v) => v.id === colorVariantId,
                    )?.name;
                  } else if (!supabaseProduct && colorVariantId) {
                    colorLabel = colorVariantId;
                  }

                  const displayImage =
                    supabaseProduct && supabaseProduct
                      ? getImageForColor(supabaseProduct, colorVariantId)
                      : product.image;

                  addLine(
                    {
                      productId: product.id,
                      name: product.name,
                      size: [tier?.label ?? "Estándar", colorLabel].filter(Boolean).join(" · "),
                      category: categoryLabels[product.category],
                      price: unitPrice,
                      image: displayImage,
                    },
                    qty,
                  );
                  if (canRibbon && ribbonSelected) {
                    addLine({
                      productId: `${product.id}-cinta`,
                      name: t("product.ribbonCartName"),
                      size: ribbonFree
                        ? t("product.ribbonIncluded")
                        : t("product.ribbonSectionTitle"),
                      category: categoryLabels[product.category],
                      price: ribbonCost(subtotal),
                      image: displayImage,
                    });
                  }
                  setJustAdded(true);
                }}
              >
                {t("product.addToCart")}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => toggleFavorite(product.id)}
              aria-label={favorite ? t("catalog.removeFavorite") : t("catalog.addFavorite")}
            >
              <Heart className={cn("size-4", favorite && "fill-primary text-primary")} />
            </Button>
          </div>

          {justAdded && (
            <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-primary/30 bg-primary-soft/50 p-4 duration-500">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Check className="size-4 text-primary" /> {t("product.added")}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate({ to: "/catalogo" })}>
                  {t("product.keepShopping")}
                </Button>
                <Button size="sm" onClick={() => setCartOpen(true)}>
                  {t("product.viewCart")}
                </Button>
              </div>
            </div>
          )}

          <Accordion type="single" collapsible className="mt-10">
            <AccordionItem value="descripcion">
              <AccordionTrigger>{t("product.descriptionTitle")}</AccordionTrigger>
              <AccordionContent>{productDescription(product)}</AccordionContent>
            </AccordionItem>
            {product.roseStep ? (
              <AccordionItem value="rosas">
                <AccordionTrigger>{t("product.rosesTitle")}</AccordionTrigger>
                <AccordionContent>{t("product.rosesText")}</AccordionContent>
              </AccordionItem>
            ) : null}
            {canRibbon ? (
              <AccordionItem value="cinta">
                <AccordionTrigger>{t("product.ribbonTitle")}</AccordionTrigger>
                <AccordionContent>{t("product.ribbonText")}</AccordionContent>
              </AccordionItem>
            ) : null}
            <AccordionItem value="entrega">
              <AccordionTrigger>{t("product.deliveryTitle")}</AccordionTrigger>
              <AccordionContent>
                <p className="flex items-start gap-2">
                  <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
                  {t("product.deliveryText")}
                </p>
                <Link
                  to="/envios"
                  className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t("product.deliveryLink")}
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl sm:text-3xl">{t("product.related")}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
