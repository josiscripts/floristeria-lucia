import { useMemo } from "react";
import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useT } from "@/context/LanguageContext";
import { products as fallbackProducts } from "@/data/catalog";

interface FavoritesTabProps {
  favorites: string[];
}

export function FavoritesTab({ favorites }: FavoritesTabProps) {
  const t = useT();

  const favoriteProducts = useMemo(() => {
    return fallbackProducts.filter((p) => favorites.includes(p.id));
  }, [favorites]);

  if (favoriteProducts.length === 0) {
    return (
      <Card className="border border-dashed border-border p-12 text-center">
        <Heart className="mx-auto size-8 text-primary/30" strokeWidth={1.5} />
        <h3 className="mt-4 font-display text-xl text-foreground">
          {t("auth.account.noFavorites.title")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.account.noFavorites.description")}
        </p>
        <Button asChild className="mt-6">
          <Link to="/catalogo">{t("auth.account.noFavorites.cta")}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {favoriteProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
