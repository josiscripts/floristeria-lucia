import { createFileRoute, Link } from "@tanstack/react-router";

import { CustomOrderBuilder } from "@/components/CustomOrderBuilder";
import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";

export const Route = createFileRoute("/personalizar-ramo")({
  head: () => ({
    meta: [
      { title: "Personalizar mi ramo de flores · floristeria lucia" },
      {
        name: "description",
        content:
          "Configura tu ramo a medida: rosas en medias docenas, flor de temporada, colores y complementos. Te confirmamos el precio final antes de prepararlo.",
      },
      { property: "og:title", content: "Personalizar mi ramo · floristeria lucia" },
      {
        property: "og:description",
        content:
          "Elige flores, colores y complementos y envíanos tu diseño: lo montamos a mano en nuestra floristería.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomBouquetPage,
});

function CustomBouquetPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-3xl">
        <p className="text-xs tracking-[0.35em] text-primary uppercase">{t("services.eyebrow")}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{t("services.ctaBouquet")}</h1>
        <p className="mt-4 text-muted-foreground">{t("custom.selectHint")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/catalogo">{t("catalog.title")}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/servicios">{t("services.title")}</Link>
          </Button>
        </div>
      </header>

      <div className="mt-12">
        <CustomOrderBuilder kind="ramo" />
      </div>
    </div>
  );
}
