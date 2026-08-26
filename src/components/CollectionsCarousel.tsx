import { useCallback, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { useT } from "@/context/LanguageContext";
import { useCatalogText } from "@/i18n/catalog-text";
import { categories } from "@/data/catalog";

const AUTOPLAY_MS = 3000;

export function CollectionsCarousel() {
  const t = useT();
  const { categoryLabelOf } = useCatalogText();
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeAt = useRef(0);

  // The track renders the collections twice; when the scroll passes the first
  // copy we silently rewind by one copy so the loop feels endless.
  const normalize = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) {
      el.scrollTo({ left: el.scrollLeft - half, behavior: "instant" as ScrollBehavior });
    } else if (el.scrollLeft < 1) {
      el.scrollTo({ left: el.scrollLeft + half, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      const delta = (first.offsetWidth + gap) * dir;
      if (dir === -1 && el.scrollLeft - Math.abs(delta) < 0) normalize();
      el.scrollBy({ left: delta, behavior: "smooth" });
      window.setTimeout(normalize, 800);
    },
    [normalize],
  );

  const manual = useCallback(
    (dir: 1 | -1) => {
      resumeAt.current = Date.now() + AUTOPLAY_MS;
      step(dir);
    },
    [step],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pausedRef.current || Date.now() < resumeAt.current) return;
      step(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [step]);

  const items = [...categories, ...categories];

  return (
    <section className="bg-surface py-16 lg:py-24">
      <div className="mx-auto max-w-[1460px] px-6 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[0.7rem] font-medium tracking-[0.35em] text-gold uppercase">
              {t("home.collections.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {t("home.collections.title")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("home.collections.subtitle")}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => manual(-1)}
              aria-label={t("home.collections.prev")}
              className="group/arrow grid size-11 place-items-center rounded-full border border-border/60 text-foreground/70 transition-colors duration-200 hover:border-primary hover:bg-primary-soft/60 hover:text-primary"
            >
              <ArrowLeft
                className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover/arrow:-translate-x-0.5 motion-safe:group-hover/arrow:scale-105"
                strokeWidth={1.5}
              />
            </button>
            <button
              type="button"
              onClick={() => manual(1)}
              aria-label={t("home.collections.next")}
              className="group/arrow grid size-11 place-items-center rounded-full border border-border/60 text-foreground/70 transition-colors duration-200 hover:border-primary hover:bg-primary-soft/60 hover:text-primary"
            >
              <ArrowRight
                className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover/arrow:translate-x-0.5 motion-safe:group-hover/arrow:scale-105"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
          onTouchStart={() => (pausedRef.current = true)}
          onTouchEnd={() => {
            pausedRef.current = false;
            resumeAt.current = Date.now() + AUTOPLAY_MS;
            window.setTimeout(normalize, 400);
          }}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-2 sm:gap-6 lg:gap-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((cat, i) => (
            <Link
              key={`${cat.id}-${i}`}
              to="/catalogo"
              search={{ categoria: cat.id }}
              aria-hidden={i >= categories.length ? true : undefined}
              tabIndex={i >= categories.length ? -1 : undefined}
              className="group w-[80%] flex-none snap-start sm:w-[46%] lg:w-[30.5%]"
            >
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={cat.image}
                  alt={categoryLabelOf(cat)}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="aspect-4/5 w-full object-cover transition-transform duration-[400ms] ease-out motion-safe:group-hover:scale-[1.025]"
                />
              </div>
              <h3 className="mt-5 font-display text-xl tracking-wide transition-colors duration-200 group-hover:text-primary sm:text-2xl">
                {categoryLabelOf(cat)}
              </h3>
              <span className="mt-2 inline-flex items-center gap-2 text-sm text-primary">
                {t("home.collections.explore")}
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
