import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Phone } from "lucide-react";

import { company } from "@/data/company";
import { useT } from "@/context/LanguageContext";
import aboutImage from "@/assets/sobre-nosotros.jpg";
import bodasImage from "@/assets/bodas.jpg";



export const Route = createFileRoute("/sobre-nosotros")({
  head: () => ({
    meta: [
      { title: "Sobre nosotros · floristeria lucia" },
      {
        name: "description",
        content:
          "floristeria lucia: flores, plantas y emociones con diseño único y personalizado en San Fernando de Henares. Nos adaptamos a todos los gustos y necesidades.",
      },
      { property: "og:title", content: "Sobre nosotros · floristeria lucia" },
      {
        property: "og:description",
        content: "Servicio cercano, máxima calidad y composiciones personalizadas para cada emoción.",
      },
    ],
  }),
  component: SobreNosotrosPage,
});

function SobreNosotrosPage() {
  const t = useT();

  return (
    <>
      {/* 1. Presentación */}
      <section className="mx-auto flex max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 lg:min-h-[calc(100svh-6rem)] lg:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
          <div className="lg:pr-12">
            <p className="text-xs tracking-[0.35em] text-primary uppercase">{t("pages.about.badge")}</p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] text-balance-tight sm:text-5xl lg:text-6xl">
              {t("pages.about.title")}
              <span className="mt-1 block">{t("pages.about.titleHighlight")}</span>
            </h1>
            <div className="mt-6 rule-gold" />
            <p className="mt-6 max-w-xl text-muted-foreground lg:text-lg lg:leading-relaxed">{t("pages.about.intro")}</p>
          </div>
          <img
            src={aboutImage}
            alt={t("pages.about.imgAlt1")}
            loading="lazy"
            width={1280}
            height={960}
            className="w-full rounded-lg object-cover shadow-soft lg:h-[min(70svh,38rem)]"
          />
        </div>
      </section>

      {/* 2. Nuestra forma de trabajar — manifiesto editorial */}
      <section className="relative overflow-hidden bg-background py-24 lg:py-36">
        <svg
          aria-hidden
          viewBox="0 0 160 260"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="pointer-events-none absolute -right-6 bottom-6 hidden h-[300px] w-[160px] text-gold/25 lg:block"
        >
          <path d="M80 255C80 180 76 110 44 20" />
          {Array.from({ length: 6 }).map((_, i) => {
            const y = 215 - i * 32;
            return (
              <g key={i}>
                <path d={`M${78 - i * 4} ${y} C ${52 - i * 4} ${y - 6}, ${36 - i * 3} ${y - 24}, ${42 - i * 3} ${y - 36}`} />
                <path d={`M${78 - i * 4} ${y} C ${104 - i * 4} ${y - 8}, ${120 - i * 3} ${y - 22}, ${114 - i * 3} ${y - 38}`} />
              </g>
            );
          })}
        </svg>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl lg:ml-[8%]">
            <p className="text-xs tracking-[0.35em] text-primary uppercase">{t("pages.about.workEyebrow")}</p>
            <h2 className="mt-6 font-display text-3xl leading-[1.15] text-balance-tight sm:text-4xl lg:text-5xl">
              {t("pages.about.workTitleA")}
              <span className="mt-1 block">{t("pages.about.workTitleB")}</span>
            </h2>
            <div className="mt-8 rule-gold" />
            <p className="mt-10 max-w-2xl text-muted-foreground lg:text-lg lg:leading-[1.9]">{t("pages.about.workP1")}</p>
            <p className="mt-12 max-w-xl text-muted-foreground lg:text-lg lg:leading-[1.9]">{t("pages.about.workP2")}</p>
          </div>
        </div>
      </section>

      {/* 3. Nuestra esencia */}
      <section className="bg-surface py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div>
            <p className="text-xs tracking-[0.35em] text-primary uppercase">{t("pages.about.essenceBadge")}</p>
            <h2 className="mt-6 font-display text-3xl leading-[1.15] text-balance-tight sm:text-4xl lg:text-[2.9rem]">
              {t("pages.about.essenceTitleA")}
              <span className="mt-1 block italic text-primary">{t("pages.about.essenceTitleB")}</span>
            </h2>
            <div className="mt-8 rule-gold" />
            <p className="mt-8 max-w-xl text-muted-foreground lg:leading-[1.9]">{t("pages.about.nearText")}</p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-gold" /> {company.address}
              </span>
              <a href={`tel:${company.phoneLink}`} className="flex items-center gap-2 font-display text-xl text-primary transition-colors duration-300 hover:text-primary/70">
                <Phone className="size-4 text-gold" /> {company.phoneRaw}
              </a>
            </div>

            <Link
              to="/contacto"
              className="group mt-12 inline-flex items-center gap-3 text-xs tracking-[0.3em] text-primary uppercase transition-colors duration-300 hover:text-foreground"
            >
              {t("pages.about.ctaStore")}
              <ArrowRight className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
            </Link>
          </div>

          <img
            src={bodasImage}
            alt={t("pages.about.imgAlt3")}
            loading="lazy"
            width={1280}
            height={960}
            className="w-full rounded-xl object-cover shadow-soft lg:aspect-4/3"
          />
        </div>
      </section>
    </>
  );
}
