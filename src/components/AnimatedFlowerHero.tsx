import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const BUCKET = "hero-animation";
const FRAME_COUNT = 205;
const FRAME_MS = 40;
const PAUSE_MS = 4000;
const STOPS = [31, 100, 171] as const;
const LOOP_START = 1;
/** Frame estático para prefers-reduced-motion (primera parada). */
const STILL_FRAME = 31;
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;
const TEXT_TRANSITION_MS = 600;

/** Los tres estados textuales, en el orden de las paradas 037 / 120 / 191. */
const SCENES = ["baseDorada", "ramoMano", "cesta"] as const;

const framePath = (n: number) => `ezgif-frame-${String(n).padStart(3, "0")}.jpg`;

type TextPhase = "stable" | "exiting" | "entering";

export function AnimatedFlowerHero() {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(1);
  const nextAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState<TextPhase>("stable");
  const phaseRef = useRef<TextPhase>(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let lastStopIdx: number | null = null;

    const draw = (n: number) => {
      const canvas = canvasRef.current;
      const img = imagesRef.current[n - 1];
      if (!canvas || !img) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    const start = async () => {
      const paths = Array.from({ length: FRAME_COUNT }, (_, i) => framePath(i + 1));
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL);
      if (cancelled || error || !data) return;

      const byPath = new Map(data.map((d) => [d.path ?? "", d.signedUrl]));
      const images = paths.map((p) => {
        const img = new Image();
        img.decoding = "async";
        const url = byPath.get(p);
        if (url) img.src = url;
        return img;
      });
      imagesRef.current = images;

      const first = images[0];
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const onReady = () => {
        if (cancelled) return;
        if (reduced) {
          // Sin movimiento: frame de parada estático + primer estado textual.
          const still = images[STILL_FRAME - 1];
          if (!still) return;
          const paint = () => draw(STILL_FRAME);
          if (still.complete) paint();
          else still.addEventListener("load", paint, { once: true });
          return;
        }
        frameRef.current = 1;
        draw(1);
        nextAtRef.current = 0;
        rafRef.current = requestAnimationFrame(step);
      };

      const step = (ts: number) => {
        if (nextAtRef.current === 0) nextAtRef.current = ts + FRAME_MS;
        while (ts >= nextAtRef.current) {
          const current = frameRef.current;
          const next = current >= FRAME_COUNT ? LOOP_START : current + 1;
          const img = imagesRef.current[next - 1];
          if (!img || !img.complete) {
            // Espera a que el frame esté disponible: nunca mostramos huecos en blanco.
            nextAtRef.current = ts + FRAME_MS;
            break;
          }
          frameRef.current = next;
          draw(next);
          const stopIdx = STOPS.indexOf(next as (typeof STOPS)[number]);
          if (stopIdx >= 0) {
            // Al llegar a una parada el contenido debe estar completamente estable.
            if (exitTimer) {
              clearTimeout(exitTimer);
              exitTimer = null;
            }
            setSceneIndex(stopIdx);
            setPhase("stable");
            lastStopIdx = stopIdx;
            nextAtRef.current += PAUSE_MS;
          } else {
            // Salida del texto cuando abandonamos una parada hacia la siguiente escena.
            const leavingStop = STOPS.includes(current as (typeof STOPS)[number]);
            if (leavingStop && phaseRef.current === "stable" && lastStopIdx !== null) {
              const nextScene = (lastStopIdx + 1) % SCENES.length;
              setPhase("exiting");
              if (exitTimer) clearTimeout(exitTimer);
              exitTimer = setTimeout(() => {
                setSceneIndex(nextScene);
                setPhase("entering");
                // Doble requestAnimationFrame para asegurar que el navegador pinte
                // el estado inicial de entrada antes de volver a estable.
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setPhase("stable");
                  });
                });
              }, TEXT_TRANSITION_MS);
            }
            nextAtRef.current += FRAME_MS;
          }
        }
        rafRef.current = requestAnimationFrame(step);
      };

      if (!first) return;
      if (first.complete) onReady();
      else first.addEventListener("load", onReady, { once: true });
    };

    void start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (exitTimer) clearTimeout(exitTimer);
      rafRef.current = null;
    };
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
    <section className="relative flex w-full flex-col overflow-hidden bg-background lg:block lg:h-svh lg:min-h-svh">
      {/* Capa 1 — animación: ventana fija en móvil/tablet, full-bleed en desktop. */}
      <div className="relative h-[50svh] w-full overflow-hidden md:h-[54svh] lg:absolute lg:inset-0 lg:h-full lg:overflow-visible">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={t(`home.hero.slides.${scene}.alt`)}
          className="absolute top-0 right-0 h-full w-auto max-w-none lg:static lg:h-full lg:w-full lg:object-cover lg:object-[62%_center]"
        />

        {/* Degradado suave solo en la parte inferior de la zona de animación (móvil/tablet). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-b from-transparent via-background/70 to-background lg:hidden"
        />
      </div>

      {/* Capa 2 — degradado de legibilidad solo en desktop (en móvil no cubre las flores). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block lg:bg-gradient-to-r lg:from-background/88 lg:from-0% lg:via-background/45 lg:via-45% lg:to-transparent lg:to-100%"
      />

      {/* Capa 3 — contenido textual: debajo de la animación en móvil/tablet. */}
      <div className="relative flex w-full flex-1 items-start bg-background px-5 pt-8 pb-14 sm:px-8 lg:absolute lg:inset-0 lg:h-full lg:items-center lg:bg-transparent lg:pt-[88px] lg:pb-0 lg:pl-[7vw] lg:pr-6 xl:pl-[8vw]">
        {content}
      </div>
    </section>
  );
}
