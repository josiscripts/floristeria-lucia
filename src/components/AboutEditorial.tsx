import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Flower2, Scissors, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import aboutImage from "@/assets/sobre_nosotros_1.jpeg";
import detailImage from "@/assets/sobre_nosotros_2.jpeg";

function BotanicalLine({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 260"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={className}
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
  );
}

const values = [
  { key: "care", Icon: Flower2 },
  { key: "custom", Icon: Scissors },
  { key: "love", Icon: Sparkles },
] as const;

export function AboutEditorial() {
  const t = useT();
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    const id = window.setInterval(() => setSwapped((s) => !s), 6400);
    return () => window.clearInterval(id);
  }, []);

  const photos = [
    { src: aboutImage, alt: t("home.about.imageAlt") },
    { src: detailImage, alt: t("home.about.detailAlt") },
  ];

  return (
    <section className="relative overflow-hidden bg-background py-24 lg:py-32">
      <BotanicalLine className="pointer-events-none absolute -left-10 top-16 hidden h-[280px] w-[150px] rotate-6 text-green/15 lg:block" />
      <BotanicalLine className="pointer-events-none absolute -right-12 bottom-10 hidden h-[240px] w-[130px] -rotate-[170deg] text-gold/20 xl:block" />

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-y-12 lg:grid-cols-[45%_1fr] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-20 lg:gap-y-10 xl:gap-x-28">
          {/* Encabezado + descripción */}
          <div className="order-1 lg:col-start-2 lg:row-start-1">
            <p className="text-[0.7rem] font-medium tracking-[0.4em] text-muted-foreground uppercase">
              {t("home.about.eyebrow")}
            </p>
            <h2 className="mt-6 max-w-xl font-display text-3xl leading-[1.15] font-normal text-foreground sm:text-4xl lg:text-[3rem]">
              {t("home.about.title")}
            </h2>

            <p className="mt-8 max-w-lg text-[0.95rem] leading-[1.9] text-muted-foreground">
              {t("home.about.text")}
            </p>
          </div>

          {/* Composición fotográfica */}
          <div className="relative order-2 pb-14 pr-6 sm:pr-10 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center lg:pb-20">
            {/* Marco grande */}
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-[20px]">
              {photos.map((photo, i) => (
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="absolute inset-0 size-full rounded-[20px] object-cover will-change-[opacity,transform] motion-safe:transition-[opacity,transform] motion-safe:duration-[1400ms] motion-safe:[transition-timing-function:cubic-bezier(0.33,0.02,0.28,1)]"
                  style={{
                    opacity: swapped === (i === 1) ? 1 : 0,
                    transform: swapped === (i === 1) ? "scale(1)" : "scale(0.97)",
                  }}
                  aria-hidden={swapped !== (i === 1)}
                />
              ))}
            </div>
            {/* Marco pequeño superpuesto */}
            <div className="absolute bottom-0 right-0 aspect-square w-[42%] max-w-[210px] overflow-hidden rounded-[16px] border border-background/70">
              {photos.map((photo, i) => (
                <img
                  key={photo.src}
                  src={photo.src}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full rounded-[16px] object-cover will-change-[opacity,transform] motion-safe:transition-[opacity,transform] motion-safe:duration-[1400ms] motion-safe:[transition-timing-function:cubic-bezier(0.33,0.02,0.28,1)]"
                  style={{
                    opacity: swapped === (i === 1) ? 0 : 1,
                    transform: swapped === (i === 1) ? "scale(1.02)" : "scale(1)",
                  }}
                  aria-hidden
                />
              ))}
            </div>
          </div>

          {/* Cita, valores, firma y CTA */}
          <div className="order-3 lg:col-start-2 lg:row-start-2">
            <p className="max-w-xl font-display text-xl leading-[1.6] text-primary sm:text-[1.6rem]">
              {t("home.about.quote")}
            </p>


            <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-0">
              {values.map(({ key, Icon }, i) => (
                <div
                  key={key}
                  className={`flex items-center gap-2.5 sm:flex-1 sm:justify-center sm:px-4 ${
                    i > 0 ? "sm:border-l sm:border-border/60" : ""
                  } ${i === 0 ? "sm:justify-start sm:pl-0" : ""}`}
                >
                  <Icon className="size-4 shrink-0 text-gold" strokeWidth={1.4} />
                  <span className="text-[0.8rem] leading-snug tracking-wide text-foreground/80">
                    {t(`home.about.values.${key}`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 flex items-center gap-3 text-gold">
              <span className="h-px w-10 bg-gradient-to-r from-gold/70 to-transparent" />
              <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.1">
                <path d="M12 20V8M12 8c-3 0-5-2-5-4 3 0 5 1.8 5 4Zm0 0c3 0 5-2 5-4-3 0-5 1.8-5 4Z" />
              </svg>
            </div>
            <p className="mt-5 max-w-md font-display text-lg leading-snug text-foreground/85">
              {t("legal.claim")}
            </p>

            <div className="mt-10">
              <Button asChild size="sm" className="btn-micro group/btn px-6 hover:shadow-petal">
                <Link to="/sobre-nosotros">
                  {t("home.about.ctaKnowUs")}
                  <ArrowRight className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
