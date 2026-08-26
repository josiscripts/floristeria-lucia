import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import heroImage from "@/assets/hero-ramo-editorial.png";

export function HeroSlider() {
  const t = useT();

  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-5 py-10 sm:px-8 lg:min-h-[560px] lg:grid-cols-[45fr_55fr] lg:gap-12 lg:px-12 lg:py-16">
        {/* Imagen: primero en móvil, a la derecha en desktop */}
        <div className="order-1 flex justify-center lg:order-2">
          <img
            src={heroImage}
            alt={t("home.hero.slides.ramoMano.alt")}
            className="h-[clamp(15rem,45vw,20rem)] w-auto max-w-full animate-in object-contain mix-blend-multiply fade-in duration-700 ease-out sm:h-[22rem] lg:h-[32rem] xl:h-[36rem]"
          />
        </div>

        {/* Contenido */}
        <div className="order-2 max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out lg:order-1">
          <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase sm:text-xs">
            {t("home.hero.slides.ramoMano.eyebrow")}
          </p>
          <div className="mt-4 h-px w-12 bg-gold/70" />
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.05] text-balance-tight sm:text-5xl lg:text-[3.5rem] xl:text-[4.25rem]">
            {t("home.hero.slides.ramoMano.title")}
          </h1>
          <p className="mt-5 max-w-[28rem] text-base leading-relaxed text-muted-foreground sm:text-[1.0625rem]">
            {t("home.hero.slides.ramoMano.subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="h-12">
              <Link to="/catalogo">
                {t("home.hero.ctaCatalog")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12">
              <Link to="/contacto">{t("home.hero.ctaCustomOrder")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
