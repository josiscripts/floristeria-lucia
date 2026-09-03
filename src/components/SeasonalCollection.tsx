import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import {
  resolveSeasonalLineup,
  seasonalCollection,
  seasonalCampaigns,
  type CampaignAnimation,
  type CampaignSlot,
  type CampaignStatus,
  type CampaignTheme,
} from "@/data/seasonalCampaigns";
import imgMadre from "@/assets/campana-dia-madre.jpg";
import imgValentin from "@/assets/campana-san-valentin.jpg";
import imgNavidad from "@/assets/campana-navidad.jpg";
import imgTemporada from "@/assets/campana-temporada.jpg";

const IMAGES: Record<CampaignTheme, string> = {
  valentine: imgValentin,
  "mothers-day": imgMadre,
  christmas: imgNavidad,
  seasonal: imgTemporada,
};

/** Velo de identidad visual por campaña, muy sutil. */
const THEME_VEIL: Record<CampaignTheme, string> = {
  valentine: "from-[oklch(0.28_0.09_18/0.82)] via-[oklch(0.3_0.07_18/0.28)]",
  "mothers-day": "from-[oklch(0.3_0.06_320/0.8)] via-[oklch(0.34_0.05_330/0.26)]",
  christmas: "from-[oklch(0.26_0.05_140/0.82)] via-[oklch(0.3_0.05_140/0.26)]",
  seasonal: "from-[oklch(0.26_0.02_320/0.78)] via-[oklch(0.3_0.02_320/0.24)]",
};

function StatusPill({ status, label }: { status: CampaignStatus; label: string }) {
  const styles: Record<CampaignStatus, string> = {
    open: "border-green/30 bg-green-soft/90 text-green dark:border-green/40 dark:bg-green-soft/80 dark:text-green",
    soon: "border-border/60 bg-background/80 text-muted-foreground dark:border-white/25 dark:bg-black/45 dark:text-[var(--campaign-status-text)]",
    available:
      "border-green/25 bg-background/85 text-green dark:border-green/40 dark:bg-black/45 dark:text-green",
    past: "border-gold/35 bg-background/80 text-gold dark:border-gold/40 dark:bg-black/45 dark:text-[var(--campaign-status-text)]",
    full: "border-[oklch(0.42_0.12_18/0.35)] bg-background/85 text-[oklch(0.42_0.12_18)] dark:border-[oklch(0.7_0.15_22/0.45)] dark:bg-black/45 dark:text-[oklch(0.78_0.13_22)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-[0.62rem] tracking-[0.28em] uppercase backdrop-blur-[2px] ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function Ambience({ kind }: { kind: CampaignAnimation }) {
  if (kind === "none") return null;
  const count = kind === "snow-particles" ? 8 : kind === "light-particles" ? 12 : 10;
  const className =
    kind === "falling-petals"
      ? "ambience-petal"
      : kind === "light-particles"
        ? "ambience-spark"
        : "ambience-snow";
  const base = kind === "light-particles" ? 8 : kind === "snow-particles" ? 11 : 10;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={className}
          style={{
            left: `${(i * 97) % 96}%`,
            animationDelay: `${(i * 1.37) % 9}s`,
            animationDuration: `${base + ((i * 0.9) % 3)}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Todas las campañas posibles para el protagonista: capas precargadas con crossfade. */
const HERO_LAYERS = [seasonalCollection, ...seasonalCampaigns];

export function SeasonalCollection() {
  const t = useT();
  const { hero, upcoming } = useMemo(() => resolveSeasonalLineup(new Date()), []);
  /** Vista previa manual (hover/foco) sin alterar el sistema automático de fechas. */
  const [preview, setPreview] = useState<CampaignSlot | null>(null);
  const shown = preview ?? hero;
  const shownKey = shown.campaign.i18nKey;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="max-w-2xl">
        <p className="text-[0.65rem] tracking-[0.34em] text-green uppercase">
          {t("home.seasonal.eyebrow")}
        </p>
        <h2 className="mt-5 font-display text-3xl text-foreground sm:text-4xl lg:text-5xl">
          {t("home.seasonal.title")}
        </h2>
        <div className="mt-5 rule-gold" />
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          {t("home.seasonal.subtitle")}
        </p>
      </div>

      <div className="mt-14 grid gap-5 lg:mt-20 lg:grid-cols-[1.85fr_1fr]">
        {/* Campaña protagonista */}
        <article className="card-micro relative isolate min-h-[26rem] overflow-hidden rounded-3xl border border-border/50 shadow-soft transition-[filter] duration-[400ms] hover:brightness-[1.03] lg:min-h-[36rem]">
          <div aria-hidden className="absolute inset-0">
            {HERO_LAYERS.map((campaign) => (
              <div
                key={campaign.id}
                className="campaign-hero-layer"
                data-active={campaign.id === shown.campaign.id ? "true" : "false"}
              >
                <img
                  src={IMAGES[campaign.theme]}
                  alt=""
                  loading="lazy"
                  width={1408}
                  height={1600}
                  className="ken-burns size-full object-cover"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t to-transparent ${THEME_VEIL[campaign.theme]}`}
                />
              </div>
            ))}
          </div>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "var(--campaign-overlay)" }}
          />
          <Ambience kind={shown.campaign.animation} />

          <div className="relative flex h-full min-h-[26rem] flex-col justify-between p-6 sm:p-9 lg:min-h-[36rem] lg:p-12">
            <div>
              <StatusPill status={shown.status} label={t(`home.seasonal.status.${shown.status}`)} />
            </div>
            <div className="max-w-xl">
              <p className="text-[0.65rem] tracking-[0.34em] text-[var(--campaign-text-muted)] uppercase">
                {t(`home.seasonal.campaigns.${shownKey}.month`)}
              </p>
              <h3 className="mt-4 font-display text-3xl leading-tight text-[var(--campaign-text-primary)] sm:text-4xl lg:text-5xl">
                {t(`home.seasonal.campaigns.${shownKey}.title`)}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--campaign-text-secondary)] sm:text-base">
                {t(`home.seasonal.campaigns.${shownKey}.text`)}
              </p>
              <Button
                asChild
                className="btn-micro group/btn mt-8 h-11 rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
              >
                <Link to="/catalogo">
                  {t("home.seasonal.cta")}
                  <ArrowRight className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </article>

        {/* Columna estática de campañas secundarias */}
        <div className="grid auto-rows-fr gap-5">
          {upcoming.map((slot) => {
            const { campaign, status } = slot;
            return (
              <article
                key={campaign.id}
                tabIndex={0}
                onMouseEnter={() => setPreview(slot)}
                onMouseLeave={() => setPreview(null)}
                onFocus={() => setPreview(slot)}
                onBlur={() => setPreview(null)}
                className="card-micro relative isolate min-h-[15rem] cursor-pointer overflow-hidden rounded-3xl border border-border/50 shadow-soft outline-none transition-[filter,transform] duration-[400ms] hover:brightness-[1.04] focus-visible:ring-2 focus-visible:ring-gold/60 motion-safe:hover:-translate-y-0.5"
              >
                <img
                  src={IMAGES[campaign.theme]}
                  alt={t(`home.seasonal.campaigns.${campaign.i18nKey}.imageAlt`)}
                  loading="lazy"
                  width={1408}
                  height={1600}
                  className={`absolute inset-0 size-full object-cover ${
                    status === "past"
                      ? "saturate-[0.6] contrast-[0.95] brightness-[0.9]"
                      : "saturate-[0.9] contrast-[0.97]"
                  }`}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t to-transparent ${THEME_VEIL[campaign.theme]}`}
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: "var(--campaign-overlay)" }}
                />
                <div className="relative flex h-full min-h-[15rem] flex-col justify-between p-6 sm:p-7">
                  <div>
                    <StatusPill status={status} label={t(`home.seasonal.status.${status}`)} />
                  </div>
                  <div>
                    <p className="text-[0.6rem] tracking-[0.3em] text-[var(--campaign-text-muted)] uppercase">
                      {t(`home.seasonal.campaigns.${campaign.i18nKey}.month`)}
                    </p>
                    <h3 className="mt-2.5 font-display text-2xl leading-snug text-[var(--campaign-text-primary)]">
                      {t(`home.seasonal.campaigns.${campaign.i18nKey}.title`)}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--campaign-text-secondary)]">
                      {t(status === "past" ? "home.seasonal.pastNote" : "home.seasonal.soonNote")}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
