import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Fragment, useMemo } from "react";
import { Euro, Ribbon, Ruler, Search, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { useShop } from "@/context/ShopContext";
import { useCatalogText } from "@/i18n/catalog-text";
import { categories, products as fallbackProducts, type CategoryId } from "@/data/catalog";
import { useGHLProducts } from "@/hooks/useGHLProducts";
import { legacyCategoryToService } from "@/data/services";
import { cn } from "@/lib/utils";

type CatalogTab = CategoryId;


type CatalogSearch = {
  categoria?: CatalogTab | undefined;
  q?: string | undefined;
  favoritos?: boolean | undefined;
};

export const Route = createFileRoute("/catalogo")({
  // Las categorías que se han convertido en servicios (bodas, eventos,
  // composiciones) mantienen sus enlaces antiguos redirigiendo al servicio.
  beforeLoad: ({ search }) => {
    const legacy = (search as Record<string, unknown>)["categoria"];
    if (typeof legacy === "string" && legacyCategoryToService[legacy]) {
      throw redirect({
        to: "/servicios/$slug",
        params: { slug: legacyCategoryToService[legacy]! },
      });
    }
  },
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
    const raw = search["categoria"];
    const categoria: CatalogTab | undefined = categories.find((c) => c.id === raw)?.id as
      | CategoryId
      | undefined;

    return {
      categoria,
      q: typeof search["q"] === "string" ? search["q"] : undefined,
      favoritos: search["favoritos"] === true || search["favoritos"] === "true" ? true : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Catálogo de flores y plantas · floristeria lucia" },
      {
        name: "description",
        content:
          "Ramos de temporada, plantas, rosas eternas, condolencias y complementos con precio fijo y entrega propia en San Fernando de Henares.",
      },
      { property: "og:title", content: "Catálogo · floristeria lucia" },
      {
        property: "og:description",
        content:
          "Flores, plantas, rosas eternas, condolencias y complementos de regalo en San Fernando de Henares.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatalogPage,
});

const headerKeys: Record<CategoryId, string> = {
  ramos: "catalog.ramos",
  plantas: "catalog.plantas",
  "rosas-eternas": "catalog.rosasEternas",
  complementos: "catalog.complementos",
  condolencias: "catalog.condolencias",
};

function CatalogPage() {
  const { categoria, q, favoritos } = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo" });
  const { favorites } = useShop();
  const { t } = useLanguage();
  const { categoryLabelOf } = useCatalogText();

  // Fetch products from GHL with fallback to local catalog
  const { data: ghlData } = useGHLProducts({
    limit: 500,
  });

  const activeCategory = categoria;

  // Use GHL products if available, fallback to local catalog
  const productsToUse = (ghlData && "products" in ghlData && ghlData.products) || fallbackProducts;

  const filtered = useMemo(() => {
    const query = (q ?? "").trim().toLowerCase();
    return productsToUse.filter((p) => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (favoritos && !favorites.includes(p.id)) return false;
      if (query && !`${p.name} ${p.description}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [activeCategory, q, favoritos, favorites, productsToUse]);


  const isCondolencias = activeCategory === "condolencias";
  const headerKey = activeCategory ? headerKeys[activeCategory] : "catalog.general";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <p className="text-xs tracking-[0.35em] text-primary uppercase">{t("catalog.title")}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{t(`${headerKey}.title`)}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t(`${headerKey}.description`)}</p>


        {/* Acciones contextuales: solo las que pertenecen a la categoría activa. */}
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <FilterChip active={!categoria} onClick={() => navigate({ search: {} })}>
          {t("catalog.all")}
        </FilterChip>
        {categories.map((cat, index) => (
          <Fragment key={cat.id}>
            {/* Insert "Bodas y eventos" after Rosas eternas (before Complementos) */}
            {cat.id === "complementos" && (
              <Link to="/servicios" className={chipClassName(false)}>
                {t("catalog.bodasEventosLink")}
              </Link>
            )}
            <FilterChip
              active={categoria === cat.id}
              onClick={() =>
                navigate({ search: (prev: CatalogSearch) => ({ ...prev, categoria: cat.id }) })
              }
            >
              {categoryLabelOf(cat)}
            </FilterChip>
          </Fragment>
        ))}


        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q ?? ""}
            onChange={(e) =>
              navigate({
                search: (prev: CatalogSearch) => ({ ...prev, q: e.target.value || undefined }),
              })
            }
            placeholder={t("catalog.searchPlaceholder")}
            aria-label={t("catalog.searchAriaLabel")}
            className="pl-9"
          />
        </div>
      </div>

      {isCondolencias && (
        <>
          {/* Mensaje comercial de la cinta decorativa, antes del grid. */}
          <div className="mt-10 flex flex-col gap-4 rounded-lg border border-primary/25 bg-primary-soft/30 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background/80 text-primary">
              <Ribbon className="size-5" />
            </span>
            <div>
              <p className="font-display text-xl sm:text-2xl">
                {t("catalog.condolencias.ribbonTitle")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t("catalog.condolencias.ribbonText")}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoBlock
              icon={<Ruler className="size-4" />}
              title={t("catalog.condolencias.sizesTitle")}
              text={t("catalog.condolencias.sizesText")}
            />
            <InfoBlock
              icon={<Euro className="size-4" />}
              title={t("catalog.condolencias.pricesTitle")}
              text={t("catalog.condolencias.pricesText")}
            />
          </div>
        </>
      )}

      {filtered.length === 0 ? (

        <div className="mt-16 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="font-display text-2xl">{t("catalog.noResults.title")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("catalog.noResults.description")}</p>
          <Button asChild className="mt-6">
            <Link to="/contacto">{t("catalog.noResults.contact")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} hideTiers={isCondolencias} />
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBlock({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-5">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid size-8 place-items-center rounded-full bg-primary-soft/60 text-primary">
          {icon}
        </span>
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function chipClassName(active: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border text-muted-foreground hover:border-primary hover:text-primary",
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={chipClassName(active)}>
      {children}
    </button>
  );
}
