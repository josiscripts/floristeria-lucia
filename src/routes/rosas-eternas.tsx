import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Gift, Sparkles, Sun, type LucideIcon } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { products } from "@/data/catalog";
import { useT } from "@/context/LanguageContext";
import rosasImage from "@/assets/cat-rosas-eternas.jpg";

export const Route = createFileRoute("/rosas-eternas")({
  head: () => ({
    meta: [
      { title: "Rosas Eternas · Flor preservada que dura 7-10 años" },
      {
        name: "description",
        content:
          "Rosas naturales preservadas que duran entre 7 y 10 años sin agua ni luz. Cajas de rosas, Caja Romántica, Cupido y Pecera Rosa Eterna.",
      },
      { property: "og:title", content: "Rosas Eternas · floristeria lucia" },
      {
        property: "og:description",
        content: "Flor natural preservada, sin agua ni luz, con una duración de 7 a 10 años.",
      },
    ],
  }),
  component: RosasEternasPage,
});

const stepKeys = ["selected", "sap", "noLight", "lifespan"] as const;
const stepIcons: LucideIcon[] = [Sparkles, Droplets, Sun, Gift];

function RosasEternasPage() {
  const t = useT();
  const eternas = products.filter((p) => p.category === "rosas-eternas");

  return (
    <>
      <section className="bg-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-xs tracking-[0.35em] text-primary uppercase">
              {t("pages.preserved.badge")}
            </p>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">
              {t("pages.preserved.title")}
              <span className="mt-2 block text-primary">{t("pages.preserved.titleHighlight")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-muted-foreground">{t("pages.preserved.intro")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/catalogo" search={{ categoria: "rosas-eternas" }}>
                  {t("pages.preserved.ctaSeeCollection")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contacto">{t("pages.preserved.ctaCustomBox")}</Link>
              </Button>
            </div>
          </div>
          <img
            src={rosasImage}
            alt={t("pages.preserved.imgAlt")}
            loading="lazy"
            width={1024}
            height={1024}
            className="w-full rounded-lg object-cover shadow-petal"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl">{t("pages.preserved.howTitle")}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stepKeys.map((key, i) => {
            const Icon = stepIcons[i]!;
            return (
              <article
                key={key}
                className="rounded-lg border border-border/70 bg-card p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-accent-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
                    {t("pages.preserved.step", { n: i + 1 })}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl">
                  {t(`pages.preserved.steps.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`pages.preserved.steps.${key}.text`)}
                </p>
              </article>
            );
          })}
        </div>

        <Accordion type="single" collapsible className="mx-auto mt-12 max-w-3xl">
          <AccordionItem value="cuidados">
            <AccordionTrigger>{t("pages.preserved.faq.careQ")}</AccordionTrigger>
            <AccordionContent>{t("pages.preserved.faq.careA")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="colores">
            <AccordionTrigger>{t("pages.preserved.faq.colorQ")}</AccordionTrigger>
            <AccordionContent>{t("pages.preserved.faq.colorA")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="duracion">
            <AccordionTrigger>{t("pages.preserved.faq.durationQ")}</AccordionTrigger>
            <AccordionContent>{t("pages.preserved.faq.durationA")}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl">
            {t("pages.preserved.collectionTitle")}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {eternas.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
