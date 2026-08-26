import { useEffect, useRef, useState } from "react";
import {
  Gift,
  Heart,
  HeartHandshake,
  MapPin,
  PartyPopper,
  Smile,
  Sparkles,
  Sun,
  Truck,
  Undo2,
} from "lucide-react";

import { useT } from "@/context/LanguageContext";
import bouquet from "@/assets/tienda-ramo-editorial.jpg";

const zones = [
  "San Fernando de Henares",
  "Torrejón de Ardoz",
  "Coslada",
  "Vicálvaro",
  "Mejorada del Campo",
  "Paracuellos de Jarama",
  "Loeches",
  "Cobeña",
  "Villalbilla",
  "Rivas-Vaciamadrid",
  "Guadalajara",
  "Madrid",
];

const occasions = [
  { key: "thanks", Icon: HeartHandshake },
  { key: "congrats", Icon: PartyPopper },
  { key: "goodday", Icon: Sun },
  { key: "allwell", Icon: Sparkles },
  { key: "getwell", Icon: Smile },
  { key: "sorry", Icon: Undo2 },
  { key: "noreason", Icon: Heart },
] as const;

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

function Sprig({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 320"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={className}
    >
      <path d="M100 310C100 220 96 130 60 20" />
      {Array.from({ length: 8 }).map((_, i) => {
        const y = 260 - i * 30;
        return (
          <g key={i}>
            <path d={`M${98 - i * 4} ${y} C ${70 - i * 4} ${y - 6}, ${52 - i * 3} ${y - 26}, ${58 - i * 3} ${y - 40}`} />
            <path d={`M${98 - i * 4} ${y} C ${126 - i * 4} ${y - 8}, ${146 - i * 3} ${y - 24}, ${140 - i * 3} ${y - 42}`} />
          </g>
        );
      })}
    </svg>
  );
}

function Leaves({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={className}
    >
      <path d="M10 110C40 100 70 80 100 40" />
      <path d="M40 96c-6-16 2-30 16-34 2 16-4 28-16 34Z" />
      <path d="M66 78c-9-14-4-29 9-35 5 15 1 28-9 35Z" />
      <path d="M92 52c-11-12-9-28 3-36 7 14 5 27-3 36Z" />
    </svg>
  );
}

function GoldRule({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`block h-px w-10 bg-gradient-to-r from-gold/80 to-transparent ${className}`} />
  );
}

export function StoreHighlights() {
  const t = useT();
  const head = useReveal<HTMLDivElement>();
  const cols = useReveal<HTMLDivElement>();
  const art = useReveal<HTMLDivElement>();
  const [hint, setHint] = useState<(typeof occasions)[number]["key"] | null>(null);


  const fade = (visible: boolean, delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(14px)",
    transitionDelay: `${delay}ms`,
  });

  const pillBase =
    "group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-primary-soft/25 px-3 py-1.5 text-[0.72rem] leading-none tracking-wide text-foreground/75 transition-[transform,background-color,box-shadow,border-color] duration-[240ms] ease-out hover:-translate-y-[3px] hover:border-gold/40 hover:bg-primary-soft/55 hover:text-primary hover:shadow-[0_6px_16px_-10px_color-mix(in_oklab,var(--primary)_45%,transparent)] focus-visible:-translate-y-[3px] focus-visible:outline-none";

  return (
    <section className="relative overflow-hidden bg-background py-24 lg:py-32">
      <Sprig className="pointer-events-none absolute -top-10 -left-16 hidden h-[360px] w-[220px] rotate-12 text-green/20 lg:block" />
      <Sprig className="pointer-events-none absolute -right-20 bottom-28 hidden h-[320px] w-[200px] -rotate-[160deg] text-primary/12 lg:block" />
      <Leaves className="pointer-events-none absolute top-1/3 -left-6 hidden h-[120px] w-[160px] text-gold/20 xl:block" />
      <Leaves className="pointer-events-none absolute right-6 top-16 hidden h-[110px] w-[150px] -scale-x-100 text-green/15 xl:block" />

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Encabezado */}
        <div
          ref={head.ref}
          className="mx-auto max-w-3xl text-center motion-safe:transition-[opacity,transform] motion-safe:duration-[900ms] motion-safe:ease-out"
          style={fade(head.visible)}
        >
          <p className="text-[0.7rem] font-medium tracking-[0.4em] text-muted-foreground uppercase">
            {t("store.title")}
          </p>
          <h2 className="mt-6 font-display text-3xl leading-[1.18] sm:text-4xl lg:text-[2.9rem]">
            <span className="block text-foreground">{t("store.titleLine1")}</span>
            <span className="block text-primary">{t("store.titleLine2")}</span>
          </h2>

          <div className="mt-8 flex items-center justify-center gap-3 text-gold">
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold/70" />
            <svg aria-hidden viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M12 3c2 3.2 2 5.8 0 9-2-3.2-2-5.8 0-9ZM12 21v-9" />
            </svg>
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold/70" />
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-[0.95rem] leading-[1.85] text-muted-foreground">
            {t("store.intro")}
          </p>
        </div>

        {/* Tres módulos editoriales independientes */}
        <div
          ref={cols.ref}
          className="mt-24 grid gap-20 sm:gap-24 lg:mt-32 lg:grid-cols-3 lg:gap-x-20 xl:gap-x-28"
        >
          {/* Entrega */}
          <div
            className="flex flex-col items-center text-center lg:px-2 motion-safe:transition-[opacity,transform] motion-safe:duration-[900ms] motion-safe:ease-out"
            style={fade(cols.visible, 0)}
          >
            <span className="grid size-12 place-items-center rounded-full border border-gold/30 bg-primary-soft/40 text-primary">
              <Truck className="size-[1.1rem]" strokeWidth={1.4} />
            </span>
            <h3 className="mt-7 font-display text-2xl leading-snug">
              <span className="block">{t("store.pickup.title1")}</span>
              <span className="block">{t("store.pickup.title2")}</span>
            </h3>
            <GoldRule className="mt-5" />
            <p className="mt-6 max-w-xs text-sm leading-[1.85] text-muted-foreground">
              {t("store.pickup.text")}
            </p>

            <p className="mt-10 text-[0.68rem] tracking-[0.32em] text-muted-foreground uppercase">
              {t("store.pickup.zonesLabel")}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              {zones.map((z, i) => (
                <span
                  key={z}
                  tabIndex={0}
                  className={`${pillBase} motion-safe:transition-[opacity,transform] motion-safe:duration-700`}
                  style={{
                    opacity: cols.visible ? 1 : 0,
                    transitionDelay: `${180 + i * 45}ms`,
                  }}
                >
                  <MapPin className="size-3 text-gold" strokeWidth={1.5} />
                  {z}
                </span>
              ))}
            </div>
          </div>

          {/* Oferta */}
          <div
            className="flex flex-col items-center text-center lg:px-4 motion-safe:transition-[opacity,transform] motion-safe:duration-[900ms] motion-safe:ease-out"
            style={fade(cols.visible, 150)}
          >
            <span className="grid size-12 place-items-center rounded-full border border-gold/30 bg-primary-soft/40 text-primary">
              <Gift className="size-[1.1rem]" strokeWidth={1.4} />
            </span>
            <h3 className="mt-7 font-display text-2xl leading-snug">
              <span className="block">{t("store.offer.title1")}</span>
              <span className="block">{t("store.offer.title2")}</span>
            </h3>
            <GoldRule className="mt-5" />
            <p className="mt-6 max-w-xs text-sm leading-[1.85] text-muted-foreground">
              {t("store.offer.text1")}
            </p>

            <p className="mt-12 flex items-center gap-2 text-[0.68rem] tracking-[0.32em] text-gold uppercase">
              <span aria-hidden>✿</span>
              {t("store.offer.eventsLabel")}
            </p>
            <p className="mt-5 max-w-xs font-display text-lg leading-snug text-primary">
              {t("store.offer.eventsList")}
            </p>
          </div>

          {/* Ocasiones */}
          <div
            className="flex flex-col items-center text-center lg:px-2 motion-safe:transition-[opacity,transform] motion-safe:duration-[900ms] motion-safe:ease-out"
            style={fade(cols.visible, 300)}
          >
            <span className="grid size-12 place-items-center rounded-full border border-gold/30 bg-primary-soft/40 text-primary">
              <Heart className="size-[1.1rem]" strokeWidth={1.4} />
            </span>
            <h3 className="mt-7 font-display text-2xl leading-snug">
              <span className="block">{t("store.meaning.title1")}</span>
              <span className="block">{t("store.meaning.title2")}</span>
            </h3>
            <GoldRule className="mt-5" />
            <p className="mt-7 text-[0.68rem] tracking-[0.32em] text-muted-foreground uppercase">
              {t("store.meaning.pick")}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              {occasions.map(({ key, Icon }, i) => (
                <span
                  key={key}
                  tabIndex={0}
                  onMouseEnter={() => setHint(key)}
                  onMouseLeave={() => setHint(null)}
                  onFocus={() => setHint(key)}
                  onBlur={() => setHint(null)}
                  className={`${pillBase} px-3.5 py-2 motion-safe:transition-[opacity,transform] motion-safe:duration-700`}
                  style={{
                    opacity: cols.visible ? 1 : 0,
                    transitionDelay: `${340 + i * 60}ms`,
                  }}
                >
                  <Icon
                    className="size-3.5 text-gold transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110"
                    strokeWidth={1.5}
                  />
                  {t(`store.meaning.tags.${key}`)}
                </span>
              ))}
            </div>

            <p
              className="mt-7 min-h-[1.5rem] max-w-xs font-display text-base leading-snug text-primary transition-opacity duration-300 ease-out"
              style={{ opacity: hint ? 1 : 0 }}
              aria-live="polite"
            >
              {hint ? t(`store.meaning.hints.${hint}`) : "\u00A0"}
            </p>

            <p className="mt-6 max-w-xs text-sm leading-[1.85] text-muted-foreground">
              {t("store.meaning.text2")}
            </p>
          </div>
        </div>

        {/* Cierre editorial: imagen a todo el ancho + texto centrado debajo */}
        <div
          ref={art.ref}
          className="mx-auto mt-28 flex max-w-[1200px] flex-col lg:mt-40 motion-safe:transition-[opacity,transform] motion-safe:duration-[1000ms] motion-safe:ease-out"
          style={fade(art.visible)}
        >
          <div className="w-full">
            <img
              src={bouquet}
              alt={t("store.imageAlt")}
              loading="lazy"
              width={1920}
              height={760}
              className="h-[260px] w-full rounded-[6px] object-cover object-center sm:h-[380px] lg:h-[520px]"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.65) 6%, #000 26%, #000 52%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,0.28) 89%, transparent 100%), linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 5%, #000 16%, #000 84%, rgba(0,0,0,0.45) 95%, transparent 100%)",
                maskComposite: "intersect",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.65) 6%, #000 26%, #000 52%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,0.28) 89%, transparent 100%), linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 5%, #000 16%, #000 84%, rgba(0,0,0,0.45) 95%, transparent 100%)",
                WebkitMaskComposite: "source-in",
              }}
            />
          </div>

          <div className="-mt-2 flex flex-col items-center text-center sm:mt-2 lg:mt-6">
            <p className="mx-auto max-w-2xl font-display text-2xl leading-snug text-primary sm:text-[2.1rem]">
              {t("legal.claim")}
            </p>
            <div className="mt-7 flex items-center justify-center gap-3 text-gold">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70" />
              <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.1">
                <path d="M12 20V8M12 8c-3 0-5-2-5-4 3 0 5 1.8 5 4Zm0 0c3 0 5-2 5-4-3 0-5 1.8-5 4Z" />
              </svg>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/70" />
            </div>
            <p className="mt-7 max-w-md text-[0.72rem] tracking-[0.3em] text-muted-foreground uppercase">
              {t("store.footerLine")}
            </p>
          </div>
        </div>

      </div>

    </section>
  );
}
