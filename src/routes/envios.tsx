import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Clock, CreditCard, MapPin, Truck, type LucideIcon } from "lucide-react";

import { company } from "@/data/company";
import { coverage } from "@/data/coverage";
import { shippingZones } from "@/data/shipping";
import { useT, useTList } from "@/context/LanguageContext";
import ijjijij from "@/assets/ijjijij.jpg";
import enviosDestino from "@/assets/envios_destino.jpg";

export const Route = createFileRoute("/envios")({
  head: () => ({
    meta: [
      { title: "Envíos y cobertura · floristeria lucia San Fernando de Henares" },
      {
        name: "description",
        content:
          "Reparto propio desde San Fernando de Henares: hasta 12 poblaciones con entrega de flores, detalles y composiciones únicas y personalizadas.",
      },
      { property: "og:title", content: "Envíos y cobertura · floristeria lucia" },
      {
        property: "og:description",
        content: "Busca tu población y comprueba si llegamos con nuestro reparto propio de flores.",
      },
    ],

  }),
  component: EnviosPage,
});

const infoCardKeys = ["ownDelivery", "sameDay", "securePayment"] as const;
const infoCardIcons: LucideIcon[] = [Truck, Clock, CreditCard];

/** Aparición sutil al entrar en viewport (500–800ms). */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(10px)",
        transition: `opacity 700ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 700ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Ilustración floral lineal muy sutil (acento tras el número). */
function FloralLine({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
    >
      <path d="M110 205V70" />
      <path d="M110 150c-28 0-46-16-46-38 24 0 46 14 46 38Z" />
      <path d="M110 128c28 0 46-16 46-38-24 0-46 14-46 38Z" />
      <circle cx="110" cy="52" r="18" />
      <path d="M110 34c10 6 16 12 18 18-8 4-14 4-18 0-4 4-10 4-18 0 2-6 8-12 18-18Z" />
      <path d="M64 176c14-6 30-6 46 0" />
      <path d="M156 176c-14-6-30-6-46 0" />
    </svg>
  );
}

/** Mapa editorial muy sutil de la zona de reparto (ilustración, no mapa interactivo). */
const mapMarkers: { name: string; x: number; y: number }[] = [
  { name: "San Fernando de Henares", x: 50, y: 55 },
  { name: "Torrejón de Ardoz", x: 59, y: 47 },
  { name: "Coslada", x: 44, y: 54 },
  { name: "Vicálvaro", x: 38, y: 61 },
  { name: "Mejorada del Campo", x: 55, y: 63 },
  { name: "Paracuellos de Jarama", x: 53, y: 39 },
  { name: "Loeches", x: 65, y: 64 },
  { name: "Cobeña", x: 57, y: 31 },
  { name: "Villalbilla", x: 73, y: 57 },
  { name: "Rivas-Vaciamadrid", x: 43, y: 71 },
  { name: "Madrid", x: 26, y: 58 },
  { name: "Guadalajara", x: 88, y: 31 },
];

function CoverageMap() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary-soft/25">
      <svg
        viewBox="0 0 400 300"
        aria-hidden="true"
        className="absolute inset-0 size-full text-primary/25"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinejoin="round"
      >
        {/* límites territoriales muy sutiles */}
        <path d="M32 118c22-34 60-56 104-60 44-4 74 8 104 2 26-5 44-18 62-22" />
        <path d="M18 172c30 10 56 32 78 58 20 24 46 38 78 40 40 2 72-10 104-30 22-14 42-32 56-56" />
        <path d="M232 34c-6 40 4 74 26 100 20 24 50 38 84 44" opacity="0.6" />
        <path d="M96 62c8 40 4 78-10 112-10 26-14 50-8 74" opacity="0.5" />
        <path d="M150 300c6-46 26-86 60-118" opacity="0.4" />
      </svg>

      {/* detalle floral lineal */}
      <FloralLine className="absolute -right-4 -bottom-6 size-40 text-gold/25" />

      {mapMarkers.map((m, i) => (
        <span
          key={m.name}
          title={m.name}
          className="absolute"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            animation: `coverage-pin 700ms cubic-bezier(0.22,1,0.36,1) ${200 + i * 90}ms both`,
          }}
        >
          <span className="block size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70 ring-3 ring-primary/12" />
        </span>
      ))}

      <style>{`@keyframes coverage-pin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}


function EnviosPage() {
  const t = useT();
  const tList = useTList();
  const townCount = coverage.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
      {/* ── Encabezado editorial asimétrico ───────────────────────── */}
      <section className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] lg:gap-20">
        <Reveal className="flex flex-col justify-center">
          <p className="text-xs tracking-[0.35em] text-primary uppercase">
            {t("pages.shipping.badge")}
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] text-balance-tight sm:text-5xl lg:text-6xl">
            {t("pages.shipping.title")}
          </h1>
          <div className="mt-6 rule-gold" />
          <p className="mt-6 max-w-xl text-muted-foreground">
            {t("pages.shipping.intro", { phone: company.phone })}
          </p>

          <div className="mt-10 flex items-start gap-4">
            <FloralLine className="mt-1 size-6 shrink-0 text-gold" />
            <p className="font-display text-2xl leading-snug italic text-primary sm:text-[1.75rem]">
              {t("pages.shipping.quote")}
            </p>
          </div>
        </Reveal>

        <Reveal
          delay={140}
          className="relative flex items-center justify-end"
        >
          <img
            src={ijjijij}
            alt="Ramo floral en floristería"
            loading="lazy"
            width={600}
            height={500}
            className="w-full rounded-lg object-cover object-center shadow-soft"
          />
        </Reveal>
      </section>

      {/* ── Franja editorial de beneficios ───────────────────────── */}
      <Reveal delay={200}>
        <div className="mt-16 border-y border-border/60 py-14 sm:mt-20">
          <div className="grid gap-10 sm:grid-cols-3">
            {infoCardKeys.map((key, i) => {
              const Icon = infoCardIcons[i]!;
              return (
                <div
                  key={key}
                  className={
                    "flex flex-col items-center text-center" +
                    (i === 0
                      ? " sm:pr-10"
                      : " border-t border-border/50 pt-10 sm:border-t-0 sm:border-l sm:border-border/50 sm:px-10 sm:pt-0")
                  }
                >
                  <Icon className="size-6 text-gold" strokeWidth={1.4} />
                  <h2 className="mt-3.5 text-xs tracking-[0.3em] text-foreground uppercase">
                    {t(`pages.shipping.cards.${key}.title`)}
                  </h2>
                  <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                    {t(`pages.shipping.cards.${key}.text`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>


      {/* ── Lugares de envíos ─────────────────────────────────────── */}
      <section className="mt-20 lg:mt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          <Reveal>
            <p className="text-xs tracking-[0.35em] text-primary uppercase">
              {t("pages.shipping.placesBadge")}
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
              {t("pages.shipping.placesTitle")}
            </h2>
            <div className="mt-5 rule-gold" />
            <p className="mt-6 max-w-md text-muted-foreground">
              {t("pages.shipping.placesIntro")}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <FloralLine className="size-5 shrink-0 text-gold" />
              <p className="font-display text-lg italic text-primary sm:text-xl">
                {t("pages.shipping.placesQuote")}
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <img
              src={enviosDestino}
              alt="Ramo floral entregado en destino"
              loading="lazy"
              width={600}
              height={500}
              className="w-full rounded-lg object-cover object-center shadow-soft"
            />
          </Reveal>
        </div>

        {/* Franja: 12 poblaciones */}
        <Reveal delay={120} className="mt-16 sm:mt-20">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="h-px flex-1 bg-border/70" />
            <span className="text-center text-[0.65rem] tracking-[0.3em] text-primary uppercase sm:text-xs">
              {t("pages.shipping.placesStrip")}
            </span>
            <span className="h-px flex-1 bg-border/70" />
          </div>
        </Reveal>

        <div className="mt-10 grid gap-x-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-20">
          {coverage.map((town, i) => (
            <Reveal key={town.name} delay={60 + i * 40}>
              <div className="flex items-center justify-center border-b border-border/50 py-4">
                <span className="font-display text-lg text-foreground text-center">
                  {town.name}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Banda informativa */}
        <Reveal delay={140}>
          <div className="mt-14 flex flex-col gap-6 border-y border-border/50 bg-primary-soft/40 px-6 py-8 sm:flex-row sm:items-center sm:gap-8 sm:px-10">
            <Truck className="size-6 shrink-0 text-gold" strokeWidth={1.3} />
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {t("pages.shipping.placesNote")}
            </p>
            <Link
              to="/contacto"
              className="group inline-flex shrink-0 items-center gap-2 font-display text-lg text-primary transition-colors hover:text-primary/80"
            >
              {t("pages.shipping.placesContact")}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </Reveal>
      </section>



      <section className="relative mt-20 overflow-hidden">
        {/* Ilustración floral lineal muy sutil */}
        <Reveal className="pointer-events-none absolute -top-6 right-0 hidden opacity-[0.18] md:block">
          <svg width="180" height="150" viewBox="0 0 180 150" fill="none" aria-hidden="true">
            <path
              d="M90 148C90 100 78 62 44 34"
              stroke="currentColor"
              strokeWidth="0.9"
              className="text-gold"
            />
            <path
              d="M90 120C104 104 128 96 152 98"
              stroke="currentColor"
              strokeWidth="0.9"
              className="text-primary"
            />
            <path
              d="M90 92C80 74 60 62 38 60"
              stroke="currentColor"
              strokeWidth="0.9"
              className="text-primary"
            />
            <ellipse cx="152" cy="98" rx="16" ry="7" stroke="currentColor" strokeWidth="0.9" className="text-gold" />
            <ellipse cx="38" cy="60" rx="16" ry="7" stroke="currentColor" strokeWidth="0.9" className="text-gold" />
            <circle cx="44" cy="34" r="11" stroke="currentColor" strokeWidth="0.9" className="text-primary" />
            <circle cx="44" cy="34" r="5" stroke="currentColor" strokeWidth="0.9" className="text-gold" />
          </svg>
        </Reveal>

        <Reveal className="max-w-xl">
          <h2 className="font-display text-4xl leading-tight md:text-5xl">
            {t("pages.shipping.ratesTitle")}
          </h2>
          <span className="mt-5 block h-px w-12 bg-gold" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("pages.shipping.ratesIntro")}
          </p>
        </Reveal>

        <div className="mt-12 border-t border-border/50">
          {shippingZones.map((zone, i) => (
            <Reveal key={zone.id} delay={i * 90}>
              <div className="grid gap-4 border-b border-border/50 py-9 md:grid-cols-12 md:items-start md:gap-6">
                <div className="md:col-span-5">
                  <h3 className="flex items-start gap-2 font-display text-xl leading-snug md:text-[1.6rem]">
                    <MapPin className="mt-1.5 size-4 shrink-0 text-gold" strokeWidth={1.3} />
                    <span>{t(`pages.shipping.rateRows.${zone.id}.name`)}</span>
                  </h3>
                  <p className="mt-2 max-w-xs pl-6 text-sm leading-relaxed text-muted-foreground">
                    {t(`pages.shipping.rateRows.${zone.id}.sub`)}
                  </p>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground md:col-span-4">
                  {tList(`pages.shipping.rateRows.${zone.id}.conditions`).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <ul className="space-y-3 text-sm md:col-span-3 md:text-right">
                  <li className="text-foreground/80 transition-colors duration-300 hover:text-foreground">
                    {tList(`pages.shipping.rateRows.${zone.id}.results`)[0]}
                  </li>
                  <li className="font-display text-lg text-primary transition-opacity duration-300 hover:opacity-80">
                    {tList(`pages.shipping.rateRows.${zone.id}.results`)[1]}
                  </li>
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-14 bg-primary-soft/50 px-6 py-12 md:px-12">
            <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground uppercase">
              {t("pages.shipping.conditionsTitle")}
            </p>
            <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-0">
              {(["min", "s35", "s120"] as const).map((key, idx) => (
                <div
                  key={key}
                  className={`flex flex-col items-center px-4 text-center ${
                    idx > 0 ? "md:border-l md:border-border/50" : ""
                  }`}
                >
                  <p className="font-display text-4xl md:text-5xl">
                    {t(`pages.shipping.generalItems.${key}.amount`)}
                  </p>
                  <p className="mt-4 text-[0.7rem] tracking-[0.22em] text-primary uppercase">
                    {t(`pages.shipping.generalItems.${key}.label`)}
                  </p>
                  <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
                    {t(`pages.shipping.generalItems.${key}.note`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
