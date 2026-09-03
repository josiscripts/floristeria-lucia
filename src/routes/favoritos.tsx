import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Heart } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import { useShop } from "@/context/ShopContext";
import { products } from "@/data/catalog";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Mis favoritos · floristeria lucia" },
      {
        name: "description",
        content:
          "Tus flores, plantas y detalles guardados en floristeria lucia, listos para añadir al carrito cuando quieras.",
      },
      { property: "og:title", content: "Mis favoritos · floristeria lucia" },
      {
        property: "og:description",
        content:
          "Guarda tus ramos, plantas y rosas eternas favoritas y recupéralas cuando quieras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const t = useT();
  const { favorites } = useShop();
  const items = useMemo(() => products.filter((p) => favorites.includes(p.id)), [favorites]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <p className="text-xs tracking-[0.35em] text-primary uppercase">{t("nav.favorites")}</p>
        <h1 className="mt-4 flex items-center gap-3 font-display text-4xl sm:text-5xl">
          <Heart className="size-7 text-primary" /> {t("nav.favorites")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("catalog.general.description")}</p>
      </header>

      {items.length === 0 ? (
        <div className="mt-16 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="font-display text-2xl">{t("catalog.noResults.title")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("catalog.noResults.description")}</p>
          <Button asChild className="mt-6">
            <Link to="/catalogo">{t("catalog.title")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
