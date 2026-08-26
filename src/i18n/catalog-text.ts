import { useCallback } from "react";

import { useLanguage } from "@/context/LanguageContext";
import {
  categories,
  categoryLabels,
  formatPrice,
  type CategoryId,
  type Product,
} from "@/data/catalog";
import { catalogTextCa } from "./catalog-text.ca";
import { catalogTextEn } from "./catalog-text.en";
import type { Locale } from "./types";

export type ProductText = { name: string; description: string };
export type CategoryText = { label: string; blurb: string; headline?: string };

export type CatalogTextMap = {
  products: Record<string, ProductText>;
  categories: Partial<Record<CategoryId, CategoryText>>;
};

const maps: Record<Exclude<Locale, "es">, CatalogTextMap> = {
  en: catalogTextEn,
  ca: catalogTextCa,
};

const badgeKeys: Record<string, string> = {
  "Más vendido": "common.bestseller",
  "A medida": "common.madeToMeasure",
  Premium: "common.premium",
  "7-10 años": "common.years710",
};

const tierKeys: Record<string, string> = {
  Estándar: "common.sizeStandard",
  Especial: "common.sizeSpecial",
  Premium: "common.sizePremium",
};

export function useCatalogText() {
  const { language, t } = useLanguage();
  const map = language === "es" ? null : maps[language];

  const productName = useCallback(
    (product: Product) => map?.products[product.id]?.name ?? product.name,
    [map],
  );

  const productDescription = useCallback(
    (product: Product) => map?.products[product.id]?.description ?? product.description,
    [map],
  );

  const productBadge = useCallback(
    (product: Product) => {
      if (!product.badge) return undefined;
      const key = badgeKeys[product.badge];
      return key ? t(key) : product.badge;
    },
    [t],
  );

  const categoryLabel = useCallback(
    (id: CategoryId) => map?.categories[id]?.label ?? categoryLabels[id],
    [map],
  );

  const categoryLabelOf = useCallback(
    (category: (typeof categories)[number]) =>
      map?.categories[category.id]?.label ?? category.label,
    [map],
  );

  const categoryBlurb = useCallback(
    (category: (typeof categories)[number]) =>
      map?.categories[category.id]?.blurb ?? category.blurb,
    [map],
  );

  const categoryHeadline = useCallback(
    (category: (typeof categories)[number]) =>
      map?.categories[category.id]?.headline ?? category.headline,
    [map],
  );

  const tierLabel = useCallback(
    (label: string) => {
      const key = tierKeys[label];
      return key ? t(key) : label;
    },
    [t],
  );

  const priceRange = useCallback(
    (product: Product) => {
      if (product.quoteOnly) return t("common.quotePrice");
      if (product.priceMax === undefined || product.priceMax === product.priceMin) {
        return formatPrice(product.priceMin);
      }
      return `${formatPrice(product.priceMin)} – ${formatPrice(product.priceMax)}`;
    },
    [t],
  );

  return {
    productName,
    productDescription,
    productBadge,
    categoryLabel,
    categoryLabelOf,
    categoryBlurb,
    categoryHeadline,
    tierLabel,
    priceRange,
  };
}
