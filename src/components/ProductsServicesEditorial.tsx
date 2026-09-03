import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import { useT } from "@/context/LanguageContext";
import imgRamos from "@/assets/cat-ramos.jpg";
import imgPlantas from "@/assets/cat-plantas.jpg";
import imgComplementos from "@/assets/cat-complementos.jpg";
import imgEventos from "@/assets/bodas.jpg";

const imgCesta = { url: "/assets/hero-cesta-flores.jpeg" };

type Item = {
  key: "flores" | "plantas" | "cestas" | "complementos" | "eventos";
  num: string;
  image: string;
  to: string;
  search?: Record<string, string>;
  params?: { slug: string };
};

const items: Item[] = [
  { key: "flores", num: "01", image: imgRamos, to: "/catalogo", search: { categoria: "ramos" } },
  {
    key: "plantas",
    num: "02",
    image: imgPlantas,
    to: "/catalogo",
    search: { categoria: "plantas" },
  },
  { key: "cestas", num: "03", image: imgCesta.url, to: "/catalogo", search: { q: "cesta" } },
  {
    key: "complementos",
    num: "04",
    image: imgComplementos,
    to: "/catalogo",
    search: { categoria: "complementos" },
  },
  {
    key: "eventos",
    num: "05",
    image: imgEventos,
    to: "/servicios",
  },
];

export function ProductsServicesEditorial() {
  const t = useT();
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="mx-auto max-w-[1460px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[0.7rem] font-medium tracking-[0.35em] text-gold uppercase">
            {t("home.productsSection.eyebrow")}
          </p>
          <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {t("home.productsSection.title")}
          </h2>
          <div className="mt-6 h-px w-24 bg-border" />
          <p className="mt-6 max-w-sm text-sm text-muted-foreground">
            {t("home.productsSection.text")}
          </p>
        </div>

        <ul ref={listRef} className="relative">
          {items.map((item, i) => {
            const isActive = active === item.key;
            return (
              <li
                key={item.key}
                className="border-b border-border/50 first:border-t motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(12px)",
                  transitionDelay: `${i * 100}ms`,
                }}
                onMouseEnter={() => setActive(item.key)}
                onMouseLeave={() => setActive((cur) => (cur === item.key ? null : cur))}
              >
                <Link
                  to={item.to}
                  {...(item.search ? { search: item.search as never } : {})}
                  {...(item.params ? { params: item.params as never } : {})}
                  onFocus={() => setActive(item.key)}
                  onBlur={() => setActive((cur) => (cur === item.key ? null : cur))}
                  className="group flex items-center gap-6 py-7 outline-none sm:gap-10"
                >
                  <span
                    className={`font-display text-base tabular-nums transition-colors duration-300 ${
                      isActive ? "text-gold" : "text-muted-foreground/60"
                    }`}
                  >
                    {item.num}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className="block font-display text-xl tracking-wide sm:text-2xl motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
                      style={{ transform: isActive ? "translateX(4px)" : "translateX(0)" }}
                    >
                      {t(`home.servicios.${item.key}.title`)}
                    </span>
                    <span className="mt-2 block max-w-md text-sm text-muted-foreground">
                      {t(`home.servicios.${item.key}.text`)}
                    </span>
                    <span
                      aria-hidden
                      className="mt-4 block h-px origin-left bg-primary/40 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out"
                      style={{ transform: isActive ? "scaleX(1)" : "scaleX(0.18)" }}
                    />
                  </span>

                  <span
                    aria-hidden
                    className="hidden h-20 w-28 shrink-0 overflow-hidden rounded-sm lg:block motion-safe:transition-[opacity,transform] motion-safe:duration-[350ms] motion-safe:ease-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateX(0)" : "translateX(16px)",
                    }}
                  >
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      width={224}
                      height={160}
                      className="size-full object-cover"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
