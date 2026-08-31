import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useT } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { services as allServices } from "@/data/services";

const imgHero = { url: "/assets/hero-ramo-mano.jpeg" };

export const Route = createFileRoute("/servicios/")({
  head: () => ({
    meta: [
      { title: "Servicios florales: bodas, eventos y encargos · floristeria lucia" },
      {
        name: "description",
        content:
          "Diseño floral a medida en San Fernando de Henares: bodas, eventos, arreglos florales y diseño floral personalizado con asesoramiento previo y montaje.",
      },
      { property: "og:title", content: "Diseño floral a medida · floristeria lucia" },
      {
        property: "og:description",
        content:
          "Flores pensadas para momentos que merecen ser recordados: bodas, eventos, arreglos florales y diseño personalizado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesIndex,
});

/** Aparición suave al hacer scroll, respetando prefers-reduced-motion. */
function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "figure" | "header" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "motion-safe:transition-[opacity,transform] motion-safe:duration-[1200ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
        className,
      )}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}

/** Ramita botánica lineal, muy sutil. */
function Sprig({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 140 34" fill="none" className={cn("text-gold/45", className)}>
      <path
        d="M4 17h132M70 17c-5.5-8.5-15-12.5-24.5-12.5C49.5 13 58.5 17.8 70 17Zm0 0c5.5 8.5 15 12.5 24.5 12.5C90.5 21 81.5 16.2 70 17Z"
        stroke="currentColor"
        strokeWidth="0.7"
      />
    </svg>
  );
}

/** Ilustración botánica lineal para respiraderos de la composición. */
function BotanicalStem({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 220" fill="none" className={cn("text-primary/12", className)}>
      <path d="M60 220V26" stroke="currentColor" strokeWidth="0.8" />
      <path
        d="M60 176c-16-4-27-16-30-32 17 1 27 12 30 32Zm0-38c16-4 27-16 30-32-17 1-27 12-30 32Zm0-38c-14-4-24-15-27-29 15 1 24 11 27 29Zm0-34c14-4 24-15 27-29-15 1-24 11-27 29Z"
        stroke="currentColor"
        strokeWidth="0.7"
      />
      <circle cx="60" cy="20" r="7" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

type ServiceEntry = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  ratio: string;
  slug: string;
  /** Destino personalizado del servicio. Si no se indica, se usa /servicios/$slug. */
  to: string | undefined;
  /** Variación controlada de la composición. */
  span: string;
  offset: string;
  gap: string;
};

function ServiceRow({ service, index }: { service: ServiceEntry; index: number }) {
  const reverse = index % 2 === 1;
  const t = useT();

  return (
    <Reveal
      as="article"
      className={cn(
        "mx-auto grid max-w-[1400px] items-center px-6 sm:px-10 lg:px-14",
        service.gap,
        service.span,
      )}
    >
      <figure className={cn("overflow-hidden", reverse && "lg:order-2")}>
        <img
          src={service.image}
          alt={service.imageAlt}
          loading="lazy"
          width={1440}
          height={1000}
          className={cn(
            "w-full object-cover transition-transform duration-[1600ms] ease-out hover:scale-[1.02]",
            service.ratio,
          )}
        />
      </figure>

      <div className={cn(reverse ? "lg:order-1" : "", service.offset)}>
        <Link
          to={service.to || "/servicios/$slug"}
          {...(service.to ? {} : { params: { slug: service.slug } })}
          className="group/title inline-block"
        >
          <h2 className="max-w-[18ch] font-display text-[2.1rem] leading-[1.08] font-normal transition-colors duration-500 group-hover/title:text-primary sm:text-[2.5rem] lg:text-[2.9rem]">
            {service.title}
          </h2>
        </Link>

        <p className="mt-5 max-w-[34ch] font-display text-[1.15rem] leading-[1.5] text-foreground/80 lg:text-[1.3rem]">
          {service.subtitle}
        </p>

        <span className="mt-7 block h-px w-14 bg-gold/50" />

        <p className="mt-7 max-w-[46ch] text-[0.95rem] leading-[1.85] text-foreground/70">
          {service.description}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4">
          <Link
            to={service.to || "/servicios/$slug"}
            {...(service.to ? {} : { params: { slug: service.slug } })}
            className="group/cta inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-[0.65rem] font-medium tracking-[0.28em] text-primary-foreground uppercase transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary-hover hover:shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--primary)_40%,transparent)] hover:-translate-y-0.5"
          >
            {t("services.viewServices")}
            <ArrowRight className="size-3.5 transition-transform duration-500 ease-out group-hover/cta:translate-x-1.5" />
          </Link>
          <Link
            to="/contacto"
            className="group/cta2 inline-flex items-center gap-2.5 rounded-full bg-background px-7 py-3.5 text-[0.65rem] font-medium tracking-[0.28em] text-foreground uppercase ring-1 ring-border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-gold-soft hover:text-primary hover:ring-gold hover:shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--gold)_30%,transparent)] hover:-translate-y-0.5"
          >
            {t("services.requestQuoteShort")}
            <ArrowRight className="size-3.5 transition-transform duration-500 ease-out group-hover/cta2:translate-x-1.5" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
/** Iconos florales lineales para los argumentos de valor. */
function IconPetal({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21V11m0 0c0-4.5 2.5-8 7-8-0 4.5-2.5 8-7 8Zm0 0c0-4.5-2.5-8-7-8 0 4.5 2.5 8 7 8Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBud({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 21v-8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M12 13c-3 0-5-2.2-5-5.5S9 3 12 3s5 2.2 5 4.5S15 13 12 13Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M12 3v10" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

function IconBranch({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 21V4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M12 16c-3.5-.6-5.5-2.8-6-6 3.6.3 5.6 2.3 6 6Zm0-6c3.5-.6 5.5-2.8 6-6-3.6.3-5.6 2.3-6 6Z"
        stroke="currentColor"
        strokeWidth="0.9"
      />
    </svg>
  );
}

function ServicesIndex() {
  const t = useT();

  const heroValues = [
    {
      Icon: IconPetal,
      title: t("services.rd.heroValues.v1Title"),
      text: t("services.rd.heroValues.v1Text"),
    },
    {
      Icon: IconBud,
      title: t("services.rd.heroValues.v2Title"),
      text: t("services.rd.heroValues.v2Text"),
    },
    {
      Icon: IconBranch,
      title: t("services.rd.heroValues.v3Title"),
      text: t("services.rd.heroValues.v3Text"),
    },
  ];

  const scrollToServices = () => {
    document
      .getElementById("servicios-lista")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Variaciones de composición aplicadas por orden, se repiten si hay más servicios. */
  const layouts: Pick<ServiceEntry, "ratio" | "span" | "offset" | "gap">[] = [
    {
      ratio: "aspect-[16/11]",
      span: "lg:grid-cols-[1.15fr_0.85fr]",
      offset: "lg:pl-6",
      gap: "gap-10 lg:gap-20",
    },
    {
      ratio: "aspect-[16/11]",
      span: "lg:grid-cols-[0.8fr_1.2fr]",
      offset: "lg:pr-8 lg:pl-2",
      gap: "gap-10 lg:gap-24",
    },
    {
      ratio: "aspect-[16/10]",
      span: "lg:grid-cols-[1.2fr_0.8fr]",
      offset: "lg:pl-4 lg:pb-8",
      gap: "gap-10 lg:gap-16",
    },
    {
      ratio: "aspect-[16/11]",
      span: "lg:grid-cols-[0.85fr_1.15fr]",
      offset: "lg:pt-6 lg:pr-6",
      gap: "gap-10 lg:gap-24",
    },
  ];

  const services: ServiceEntry[] = allServices.map((s, i) => ({
    title: s.label,
    subtitle: s.blurb,
    description: s.intro,
    image: s.image,
    imageAlt: s.label,
    slug: s.id,
    to: s.to,
    ...layouts[i % layouts.length]!,
  }));

  return (
    <div className="overflow-x-clip bg-background">
      {/* BLOQUE 1 — COMPOSICIÓN EDITORIAL DE SERVICIOS */}
      <section className="relative mx-auto grid max-w-[1500px] items-start gap-12 px-6 pt-12 pb-20 sm:px-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:px-14 lg:pt-16 lg:pb-28">
        <BotanicalStem className="pointer-events-none absolute top-1/2 left-[46%] hidden h-64 w-24 -translate-y-1/2 opacity-60 lg:block" />

        <div className="lg:pr-6">
          <Reveal>
            <p className="text-[0.62rem] font-medium tracking-[0.5em] text-primary/70 uppercase">
              {t("services.rd.heroEyebrow")}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-7 font-display text-[2.1rem] leading-[1.1] font-normal text-primary sm:text-[2.6rem] lg:text-[2.9rem]">
              <span className="block">{t("services.rd.heroTitle1")}</span>
              <span className="block">{t("services.rd.heroTitle2")}</span>
            </h1>
            <span className="mt-6 block h-px w-14 bg-gold/55" />
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-[390px] text-[0.98rem] leading-[1.8] text-foreground/70">
              {t("services.rd.heroText")}
            </p>
          </Reveal>

          <ul className="mt-12 space-y-9">
            {heroValues.map((v, i) => (
              <Reveal as="div" key={v.title} delay={240 + i * 100}>
                <li className="flex items-start gap-4">
                  <v.Icon className="mt-0.5 size-5 shrink-0 text-gold/70" />
                  <div className="min-w-0">
                    <p className="text-[0.66rem] font-medium tracking-[0.28em] text-primary uppercase">
                      {v.title}
                    </p>
                    <p className="mt-2.5 max-w-[360px] text-[0.9rem] leading-[1.8] text-foreground/65">
                      {v.text}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={560}>
            <button
              type="button"
              onClick={scrollToServices}
              className="group/cta mt-14 inline-flex cursor-pointer items-center gap-3 rounded-full border border-gold/50 bg-background/60 px-7 py-3.5 text-[0.62rem] font-medium tracking-[0.28em] text-primary uppercase outline-none backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/40 hover:bg-primary/5 hover:text-primary-hover"
            >
              {t("services.rd.heroCta")}
              <ArrowDown
                aria-hidden
                className="size-4 text-primary/80 transition-transform duration-300 ease-out group-hover/cta:translate-y-1"
              />
            </button>
          </Reveal>
        </div>

        <Reveal as="figure" delay={200}>
          <img
            src={imgHero.url}
            alt={t("services.rd.heroImageAlt")}
            width={1400}
            height={1500}
            className="aspect-[4/5] w-full rounded-[10px] object-cover lg:aspect-[5/6]"
          />
        </Reveal>
      </section>

      {/* INTRODUCCIÓN */}
      <Reveal as="section" className="relative px-6 py-20 text-center sm:px-10 lg:py-28">
        <BotanicalStem className="pointer-events-none absolute top-0 left-[6%] hidden h-40 w-20 lg:block" />
        <p className="text-[0.62rem] font-medium tracking-[0.5em] text-muted-foreground uppercase">
          {t("services.rd.introEyebrow")}
        </p>
        <h2 className="mx-auto mt-10 max-w-[24ch] font-display text-[2.1rem] leading-[1.14] font-normal sm:text-[2.8rem] lg:text-[3.2rem]">
          <span className="block">{t("services.rd.introTitle1")}</span>
          <span className="block">{t("services.rd.introTitle2")}</span>
        </h2>
        <Sprig className="mx-auto mt-12 h-6 w-28" />
      </Reveal>

      {/* SERVICIOS: IMAGEN + TEXTO ALTERNADOS */}
      <div id="servicios-lista" className="relative scroll-mt-24 pb-24 lg:pb-36">
        <BotanicalStem className="pointer-events-none absolute top-[38%] right-[3%] hidden h-52 w-24 xl:block" />
        {services.map((service, index) => (
          <div
            key={service.title}
            className={index === 0 ? "" : index === 2 ? "mt-28 lg:mt-48" : "mt-28 lg:mt-40"}
          >
            <ServiceRow service={service} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
