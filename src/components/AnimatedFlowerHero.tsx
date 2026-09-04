import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero_1.png";

const TEXT_TRANSITION_MS = 600;
const SCENE_INTERVAL_MS = 7000;

/** Los tres estados textuales del hero. */
const SCENES = ["baseDorada", "ramoMano", "cesta"] as const;

type TextPhase = "stable" | "exiting" | "entering";

export function AnimatedFlowerHero() {
  const t = useT();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState<TextPhase>("stable");

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Sin movimiento: mostrar primera escena y mantenerla estática
      return;
    }

    const interval = setInterval(() => {
      setPhase("exiting");
      const exitTimer = setTimeout(() => {
        setSceneIndex((prev) => (prev + 1) % SCENES.length);
        setPhase("entering");
        const enterTimer = setTimeout(() => {
          setPhase("stable");
        }, TEXT_TRANSITION_MS / 2);
        return () => clearTimeout(enterTimer);
      }, TEXT_TRANSITION_MS / 2);

      return () => clearTimeout(exitTimer);
    }, SCENE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const scene = SCENES[sceneIndex];

  const wrapperClass = cn(
    "max-w-xl transition-all will-change-transform",
    phase === "stable" && "opacity-100 translate-x-0 translate-y-0",
    phase === "exiting" && "opacity-0 -translate-x-5 -translate-y-[5px]",
    phase === "entering" && "opacity-0 translate-x-5 translate-y-[5px]",
  );

  const itemClass =
    "transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform";

  const content = (
    <div
      className={wrapperClass}
      style={{
        transitionDuration: `${TEXT_TRANSITION_MS}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <p
        className={cn(
          itemClass,
          phase === "entering" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        )}
        style={{ transitionDelay: "0ms" }}
      >
        <span className="text-[0.7rem] tracking-[0.28em] text-gold uppercase sm:text-xs">
          {t(`home.hero.slides.${scene}.eyebrow`)}
        </span>
      </p>
      <div
        className={cn(
          itemClass,
          "mt-4 h-px w-12 bg-gold/70",
          phase === "entering" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        )}
        style={{ transitionDelay: "40ms" }}
      />
      <h1
        className={cn(
          itemClass,
          "mt-5 font-display text-[2.25rem] leading-[1.05] text-balance-tight sm:text-5xl lg:text-[3.25rem] xl:text-[3.75rem]",
          phase === "entering" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        )}
        style={{ transitionDelay: "80ms" }}
      >
        {t(`home.hero.slides.${scene}.title`)}
      </h1>
      <p
        className={cn(
          itemClass,
          "mt-5 max-w-[28rem] text-base leading-relaxed text-muted-foreground sm:text-[1.0625rem]",
          phase === "entering" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        )}
        style={{ transitionDelay: "160ms" }}
      >
        {t(`home.hero.slides.${scene}.subtitle`)}
      </p>
      <div
        className={cn(
          itemClass,
          "mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap",
          phase === "entering" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        )}
        style={{ transitionDelay: "240ms" }}
      >
        <Button asChild size="lg" className="btn-micro group/cta h-12 hover:shadow-petal">
          <Link to="/catalogo">
            {t("home.hero.ctaCatalog")}{" "}
            <ArrowRight className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover/cta:translate-x-1" />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="btn-micro h-12 hover:border-primary/50 hover:shadow-soft"
        >
          <Link to="/contacto">{t("home.hero.ctaCustomOrder")}</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <section className="relative flex w-full flex-col overflow-hidden bg-background lg:block lg:h-svh lg:min-h-svh lg:overflow-visible">
      {/* Capa 1 — imagen estática: ventana fija en móvil/tablet, full-bleed en desktop. */}
      <div className="relative h-[50svh] w-full overflow-hidden md:h-[54svh] lg:absolute lg:inset-0 lg:h-full lg:overflow-visible">
        <img
          src={heroImage}
          alt={t(`home.hero.slides.${scene}.alt`)}
          role="img"
          aria-label={t(`home.hero.slides.${scene}.alt`)}
          className="absolute top-0 right-0 h-full w-auto max-w-none object-cover lg:static lg:h-full lg:w-full lg:object-cover lg:object-[62%_center]"
        />

        {/* Degradado suave solo en la parte inferior de la zona de imagen (móvil/tablet). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-b from-transparent via-background/70 to-background lg:hidden"
        />
      </div>

      {/* Capa 2 — degradado de legibilidad solo en desktop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block lg:bg-gradient-to-r lg:from-background/88 lg:from-0% lg:via-background/45 lg:via-45% lg:to-transparent lg:to-100%"
      />

      {/* Capa 3 — contenido textual: debajo de la imagen en móvil/tablet. */}
      <div className="relative flex w-full flex-1 items-start bg-background px-5 pt-8 pb-14 sm:px-8 lg:absolute lg:inset-0 lg:h-full lg:items-center lg:bg-transparent lg:pt-[88px] lg:pb-0 lg:pl-[7vw] lg:pr-6 xl:pl-[8vw]">
        {content}
      </div>
    </section>
  );
}
