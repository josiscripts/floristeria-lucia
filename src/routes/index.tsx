import { createFileRoute } from "@tanstack/react-router";

import { AboutEditorial } from "@/components/AboutEditorial";
import { AnimatedFlowerHero } from "@/components/AnimatedFlowerHero";
import { CollectionsCarousel } from "@/components/CollectionsCarousel";
import { ProductsServicesEditorial } from "@/components/ProductsServicesEditorial";
import { StoreHighlights } from "@/components/StoreHighlights";
import { SeasonalCollection } from "@/components/SeasonalCollection";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "floristeria lucia · Flores, plantas y emociones" },
      {
        name: "description",
        content:
          "floristeria lucia en San Fernando de Henares: ramos, plantas, cestas, flores preservadas y composiciones personalizadas con entrega en Madrid y Guadalajara.",
      },
      { property: "og:title", content: "floristeria lucia · Flores · Plantas · Emociones" },
      {
        property: "og:description",
        content:
          "Ramos, plantas, cestas, complementos y flores preservadas con diseño único y personalizado.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <AnimatedFlowerHero />

      <ProductsServicesEditorial />


      <CollectionsCarousel />


      <SeasonalCollection />


      <StoreHighlights />

      <AboutEditorial />

    </>
  );
}
