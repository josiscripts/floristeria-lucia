import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useShop } from "@/context/ShopContext";
import { useCatalogText } from "@/i18n/catalog-text";
import {
  categoryLabels,
  formatPrice,
  priceTiers,
  type Product,
} from "@/data/catalog";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  hideTiers = false,
}: {
  product: Product;
  hideTiers?: boolean;
}) {
  const { addLine, toggleFavorite, isFavorite } = useShop();
  const { t } = useLanguage();
  const { productName, productDescription, productBadge, priceRange, tierLabel } =
    useCatalogText();
  const allTiers = priceTiers(product);
  const tiers = hideTiers ? allTiers.slice(0, 1) : allTiers;
  const [tierIndex, setTierIndex] = useState(0);
  const favorite = isFavorite(product.id);
  const name = productName(product);
  const badge = productBadge(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-petal">
      <div className="relative overflow-hidden">
        <Link
          to="/producto/$id"
          params={{ id: product.id }}
          aria-label={`${t("catalog.viewProduct")}: ${name}`}
          className="block"
        >
          <img
            src={product.image}
            alt={name}
            loading="lazy"
            width={1024}
            height={1024}
            className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        {badge && (
          <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-primary-foreground">
            {badge}
          </span>
        )}
        <button
          type="button"
          aria-label={favorite ? t("catalog.removeFavorite") : t("catalog.addFavorite")}
          onClick={() => toggleFavorite(product.id)}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:text-primary"
        >
          <Heart className={cn("size-4", favorite && "fill-primary text-primary")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-xl leading-tight">
            <Link
              to="/producto/$id"
              params={{ id: product.id }}
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{productDescription(product)}</p>
        </div>

        <p className="text-sm font-semibold text-primary">{priceRange(product)}</p>

        {tiers.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {tiers.map((tier, i) => (
              <button
                key={tier.label}
                type="button"
                onClick={() => setTierIndex(i)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  i === tierIndex
                    ? "border-primary bg-primary-soft text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-primary",
                )}
              >
                {tierLabel(tier.label)} · {formatPrice(tier.price)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-1">
          {product.quoteOnly ? (
            <Button asChild variant="outline" className="w-full">
              <Link to="/contacto">{t("catalog.requestQuoteButton")}</Link>
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                const tier = tiers[tierIndex] ?? tiers[0];
                if (!tier) return;
                addLine({
                  productId: product.id,
                  name: product.name,
                  size: tier.label,
                  category: categoryLabels[product.category],
                  price: tier.price,
                  image: product.image,
                });
                toast.success(t("catalog.addedToCart", { name }));
              }}
            >
              {t("catalog.addToCartButton")}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
