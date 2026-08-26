import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  CreditCard,
  Facebook,
  Heart,
  HelpCircle,
  Instagram,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { CookieNotice } from "@/components/CookieNotice";
import { CookiePreferences, openCookiePreferences } from "@/components/CookiePreferences";
import { useT } from "@/context/LanguageContext";
import { company } from "@/data/company";
import { legalFooterLinks } from "@/data/legal-pages";
import logo from "@/assets/logo-header.svg.asset.json";
import ctaBouquet from "@/assets/hero-bouquet.jpg";

type NavLink = {
  key: string;
  to: string;
  search?: Record<string, string>;
  params?: { slug: string };
};

const shopLinks: NavLink[] = [
  { key: "fullCatalog", to: "/catalogo" },
  { key: "flowers", to: "/catalogo", search: { categoria: "ramos" } },
  { key: "plantsAndBaskets", to: "/catalogo", search: { categoria: "plantas" } },
  { key: "preservedFlowers", to: "/rosas-eternas" },
  { key: "condolences", to: "/catalogo", search: { categoria: "condolencias" } },
  { key: "accessories", to: "/catalogo", search: { categoria: "complementos" } },
];

const serviceLinks: NavLink[] = [
  { key: "weddings", to: "/servicios/$slug", params: { slug: "bodas" } },
  { key: "events", to: "/servicios/$slug", params: { slug: "eventos" } },
  { key: "arrangements", to: "/servicios/$slug", params: { slug: "arreglos-eventos" } },
  { key: "compositions", to: "/servicios/$slug", params: { slug: "composiciones-personalizadas" } },
  { key: "customOrders", to: "/servicios/$slug", params: { slug: "encargos-personalizados" } },
  { key: "customBouquet", to: "/personalizar-ramo" },
  { key: "shipping", to: "/envios" },
];

const helpLinks: { key: string; to: string; params?: { slug: string }; icon: LucideIcon }[] = [
  { key: "contact", to: "/contacto", icon: MessageCircle },
  { key: "faq", to: "/legal/$slug", params: { slug: "preguntas-frecuentes" }, icon: HelpCircle },
  { key: "shipping", to: "/legal/$slug", params: { slug: "incidencias" }, icon: Truck },
  { key: "payments", to: "/legal/$slug", params: { slug: "pagos" }, icon: CreditCard },
  { key: "warranties", to: "/legal/$slug", params: { slug: "garantias" }, icon: BadgeCheck },
  { key: "returns", to: "/legal/$slug", params: { slug: "devoluciones" }, icon: RotateCcw },
];

const linkClass =
  "inline-block text-sm text-primary-foreground/72 transition-[color,transform] duration-200 ease-out hover:text-gold motion-safe:hover:translate-x-[3px] motion-safe:focus-visible:translate-x-[3px] dark:text-surface-foreground/80 dark:hover:text-gold";

const helpLinkClass =
  "inline-flex items-center gap-2 text-sm text-primary-foreground/72 transition-[color,transform] duration-200 ease-out hover:text-gold motion-safe:hover:translate-x-[3px] motion-safe:focus-visible:translate-x-[3px] dark:text-surface-foreground/80 dark:hover:text-gold";

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h3 className="font-display text-[0.78rem] tracking-[0.22em] text-primary-foreground uppercase dark:text-surface-foreground">
        {children}
      </h3>
      <div className="mt-3 h-px w-8 bg-gold/70 dark:bg-gold/80" />
    </>
  );
}

function FloralLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M10 110C40 96 62 74 74 44" />
        <path d="M74 44c-14 2-24 12-26 26 14 2 24-8 26-26Z" />
        <path d="M74 44c12-6 24-2 30 10-14 6-26 2-30-10Z" />
        <path d="M40 88c-10-4-14-12-12-22 10 4 14 12 12 22Z" />
        <path d="M56 68c10-8 20-8 28 0-10 8-20 8-28 0Z" />
        <circle cx="86" cy="30" r="6" />
        <path d="M96 22c8-8 18-10 28-6-6 10-16 14-28 6Z" />
      </g>
    </svg>
  );
}

/** Acordeón usado en tablet y móvil (misma estructura maestra, formato compacto). */
function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-primary-foreground/12 dark:border-surface-foreground/15">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-display text-[0.78rem] tracking-[0.22em] text-primary-foreground uppercase dark:text-surface-foreground">
          {title}
        </span>
        {open ? (
          <Minus className="size-4 shrink-0 text-gold/85" strokeWidth={1.5} />
        ) : (
          <Plus className="size-4 shrink-0 text-gold/85" strokeWidth={1.5} />
        )}
      </button>
      {open ? <div className="pb-5">{children}</div> : null}
    </div>
  );
}

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`;

  const shopList = (
    <ul className="space-y-2.5">
      {shopLinks.map((l) => (
        <li key={l.key}>
          <Link to={l.to} {...(l.search ? { search: l.search } : {})} className={linkClass}>
            {t(`footer.${l.key}`)}
          </Link>
        </li>
      ))}
    </ul>
  );

  const servicesList = (
    <ul className="space-y-2.5">
      {serviceLinks.map((l) => (
        <li key={l.key}>
          <Link
            to={l.to}
            {...(l.search ? { search: l.search } : {})}
            {...(l.params ? { params: l.params } : {})}
            className={linkClass}
          >
            {t(`footer.${l.key}`)}
          </Link>
        </li>
      ))}
    </ul>
  );

  const helpList = (
    <ul className="space-y-2.5">
      {helpLinks.map((l) => (
        <li key={l.key}>
          <Link
            to={l.to}
            {...(l.params ? { params: l.params } : {})}
            className={helpLinkClass}
          >
            <l.icon className="size-3.5 shrink-0 text-gold/80 dark:text-gold/85" strokeWidth={1.5} />
            <span>{t(`footer.helpLinks.${l.key}`)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const contactBlock = (
    <>
      <ul className="space-y-3 text-sm text-primary-foreground/72 dark:text-surface-foreground/80">
        <li className="flex gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-gold/80 dark:text-gold/85" strokeWidth={1.5} />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="leading-relaxed underline-offset-4 transition-colors hover:text-gold hover:underline dark:hover:text-gold"
          >
            Calle de Motrico, 9
            <br />
            28830 San Fernando de Henares
            <br />
            Madrid
          </a>
        </li>
        <li className="flex gap-2.5">
          <Phone className="mt-0.5 size-4 shrink-0 text-gold/80 dark:text-gold/85" strokeWidth={1.5} />
          <a
            href={`tel:${company.phoneRaw}`}
            className="underline-offset-4 transition-colors hover:text-gold hover:underline dark:hover:text-gold"
          >
            {company.phone}
          </a>
        </li>
        <li className="flex min-w-0 gap-2.5">
          <Mail className="mt-0.5 size-4 shrink-0 text-gold/80 dark:text-gold/85" strokeWidth={1.5} />
          <a
            href={`mailto:${company.email}`}
            className="min-w-0 break-words underline-offset-4 transition-colors hover:text-gold hover:underline dark:hover:text-gold"
          >
            {company.email}
          </a>
        </li>
      </ul>

      <div className="mt-6 flex gap-2.5">
        <Clock className="mt-0.5 size-4 shrink-0 text-gold/80 dark:text-gold/85" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-primary-foreground dark:text-surface-foreground">
            {t("footer.schedule.title")}
          </p>
          <p className="mt-1 text-sm text-primary-foreground/72 dark:text-surface-foreground/80">
            {t("footer.schedule.weekdays")}
          </p>
          <p className="text-sm text-primary-foreground/72 dark:text-surface-foreground/80">
            {t("footer.schedule.saturday")}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <footer className="bg-primary text-primary-foreground dark:bg-[oklch(0.22_0.05_322)] dark:text-surface-foreground">
      {/* 1 — CTA / pre-footer: silueta floral → contenido → ramo (a sangre por la derecha) */}
      <div className="bg-surface text-surface-foreground">
        <div className="relative mx-auto w-full max-w-[1600px] overflow-hidden">
          {/* Ramo: pegado al borde derecho, sin hueco */}
          <img
            src={ctaBouquet}
            alt={t("footer.cta.imageAlt")}
            loading="lazy"
            className="pointer-events-none absolute inset-y-0 right-0 m-0 hidden h-full w-60 object-cover p-0 opacity-90 [object-position:95%_center] [mask-image:linear-gradient(to_right,transparent,black_65%)] md:block lg:w-72 xl:w-80"
          />
          <div className="relative flex flex-col gap-6 px-4 py-9 sm:px-8 lg:flex-row lg:items-center lg:gap-10 lg:py-8 lg:pl-12 md:pr-[15rem] lg:pr-[19rem] xl:pr-[21rem]">
            <FloralLine className="h-20 w-24 shrink-0 text-gold/60 dark:text-gold/85 sm:h-24 sm:w-28" />
            <div className="min-w-0 lg:max-w-xl">
              <h2 className="font-display text-2xl leading-tight text-ink dark:text-surface-foreground sm:text-[1.85rem]">
                {t("footer.cta.title")}
              </h2>
              <p className="mt-2 text-sm text-ink-muted dark:text-surface-foreground/80">
                {t("footer.cta.subtitle")}
              </p>
            </div>
            <Link
              to="/contacto"
              className="btn-micro group inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-gold/70 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover dark:border-gold/60 dark:bg-[oklch(0.32_0.06_320)] dark:text-surface-foreground dark:hover:bg-[oklch(0.4_0.07_320)] lg:ml-auto"
            >
              {t("footer.cta.button")}
              <ArrowRight
                className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-1"
                strokeWidth={1.75}
              />
            </Link>
          </div>
        </div>
      </div>

      {/* 2 — Bloque principal */}
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
        {/* Marca: siempre visible en los tres breakpoints */}
        <div className="lg:hidden">
          <img
            src={logo.url}
            alt={t("footer.logoAlt", { name: company.name })}
            width={2048}
            height={682}
            loading="lazy"
            className="h-20 w-auto brightness-0 invert"
          />
          <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/72 dark:text-surface-foreground/80">
            {t("footer.brandTagline")}
          </p>
          <p className="mt-5 font-display text-[0.78rem] tracking-[0.22em] text-primary-foreground uppercase dark:text-surface-foreground">
            {t("footer.followUs")}
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <a
              href={company.facebook}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Facebook"
              className="icon-micro grid size-9 place-items-center rounded-full border border-primary-foreground/25 text-primary-foreground/80 hover:border-gold hover:text-gold dark:border-surface-foreground/18 dark:text-surface-foreground/85"
            >
              <Facebook className="size-4" strokeWidth={1.5} />
            </a>
            <a
              href={company.instagram}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
              className="icon-micro grid size-9 place-items-center rounded-full border border-primary-foreground/25 text-primary-foreground/80 hover:border-gold hover:text-gold dark:border-surface-foreground/18 dark:text-surface-foreground/85"
            >
              <Instagram className="size-4" strokeWidth={1.5} />
            </a>
          </div>

          {/* Acordeones (tablet + móvil) */}
          <div className="mt-8 border-t border-primary-foreground/12 dark:border-surface-foreground/15">
            <FooterAccordion title={t("footer.shop")}>{shopList}</FooterAccordion>
            <FooterAccordion title={t("footer.services")}>{servicesList}</FooterAccordion>
            <FooterAccordion title={t("footer.help")}>{helpList}</FooterAccordion>
            <FooterAccordion title={t("footer.contact")}>{contactBlock}</FooterAccordion>
          </div>
        </div>

        {/* Desktop: 5 columnas en una sola fila */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:divide-x lg:divide-primary-foreground/12 dark:lg:divide-surface-foreground/15">
          {/* Columna 1 — Marca */}
          <div className="min-w-0 lg:pr-6">
            <img
              src={logo.url}
              alt={t("footer.logoAlt", { name: company.name })}
              width={2048}
              height={682}
              loading="lazy"
              className="h-20 w-auto brightness-0 invert"
            />
            <p className="mt-3 max-w-[17rem] text-sm leading-relaxed text-primary-foreground/72 dark:text-surface-foreground/80">
              {t("footer.brandTagline")}
            </p>
            <p className="mt-5 font-display text-[0.78rem] tracking-[0.22em] text-primary-foreground uppercase dark:text-surface-foreground">
              {t("footer.followUs")}
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <a
                href={company.facebook}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Facebook"
                className="icon-micro grid size-9 place-items-center rounded-full border border-primary-foreground/25 text-primary-foreground/80 hover:border-gold hover:bg-primary-foreground/8 hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none dark:border-surface-foreground/18 dark:text-surface-foreground/85 dark:hover:border-gold dark:hover:text-gold"
              >
                <Facebook className="size-4" strokeWidth={1.5} />
              </a>
              <a
                href={company.instagram}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
                className="icon-micro grid size-9 place-items-center rounded-full border border-primary-foreground/25 text-primary-foreground/80 hover:border-gold hover:bg-primary-foreground/8 hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none dark:border-surface-foreground/18 dark:text-surface-foreground/85 dark:hover:border-gold dark:hover:text-gold"
              >
                <Instagram className="size-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Columna 2 — Tienda */}
          <div className="min-w-0 lg:px-6">
            <ColumnTitle>{t("footer.shop")}</ColumnTitle>
            <div className="mt-4">{shopList}</div>
          </div>

          {/* Columna 3 — Servicios */}
          <div className="min-w-0 lg:px-6">
            <ColumnTitle>{t("footer.services")}</ColumnTitle>
            <div className="mt-4">{servicesList}</div>
          </div>

          {/* Columna 4 — Ayuda */}
          <div className="min-w-0 lg:px-6">
            <ColumnTitle>{t("footer.help")}</ColumnTitle>
            <div className="mt-4">{helpList}</div>
          </div>

          {/* Columna 5 — Contacto */}
          <div className="min-w-0 lg:pl-6">
            <ColumnTitle>{t("footer.contact")}</ColumnTitle>
            <div className="mt-4">{contactBlock}</div>
          </div>
        </div>
      </div>

      {/* 3 — Información legal */}
      <div className="border-t border-primary-foreground/12 dark:border-surface-foreground/15">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-8 text-center sm:px-8 lg:px-12">
          <h3 className="font-display text-[0.78rem] tracking-[0.22em] text-primary-foreground uppercase dark:text-surface-foreground">
            {t("footer.legalInfo")}
          </h3>
          <div className="mx-auto mt-3 h-px w-8 bg-gold/70 dark:bg-gold/80" />
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {legalFooterLinks.map((slug) => (
              <li key={slug}>
                <Link
                  to="/legal/$slug"
                  params={{ slug }}
                  className="inline-block text-xs text-primary-foreground/70 transition-[color,transform] duration-200 ease-out hover:text-gold motion-safe:hover:translate-x-[3px] motion-safe:focus-visible:translate-x-[3px] dark:text-surface-foreground/75 dark:hover:text-gold"
                >
                  {t(`footer.legalLinks.${slug}`)}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={openCookiePreferences}
                className="inline-block text-xs text-primary-foreground/70 transition-[color,transform] duration-200 ease-out hover:text-gold motion-safe:hover:translate-x-[3px] motion-safe:focus-visible:translate-x-[3px] dark:text-surface-foreground/75 dark:hover:text-gold"
              >
                {t("footer.manageCookies")}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* 4 — Pago seguro */}
      <div className="border-t border-primary-foreground/12 dark:border-surface-foreground/15">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold/90 dark:text-gold/90" strokeWidth={1.5} />
            <div>
              <p className="font-display text-lg leading-none text-primary-foreground dark:text-surface-foreground">
                {t("footer.payments.title")}
              </p>
              <p className="mt-1.5 text-xs text-primary-foreground/70 dark:text-surface-foreground/75">
                {t("footer.payments.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-8 items-center gap-1.5 rounded-md border border-primary-foreground/25 px-2.5 text-[0.72rem] font-medium text-primary-foreground/85 dark:border-surface-foreground/18 dark:text-surface-foreground/85">
              <CreditCard className="size-3.5 text-gold/85 dark:text-gold/85" strokeWidth={1.5} />
              {t("footer.payments.cards")}
            </span>
            <span className="flex h-8 items-center gap-1.5 rounded-md border border-primary-foreground/25 px-2.5 text-[0.72rem] font-medium text-primary-foreground/85 dark:border-surface-foreground/18 dark:text-surface-foreground/85">
              <Landmark className="size-3.5 text-gold/85 dark:text-gold/85" strokeWidth={1.5} />
              {t("footer.payments.transfer")}
            </span>
            <span className="text-xs text-primary-foreground/70 dark:text-surface-foreground/75">
              {t("footer.payments.note")}
            </span>
          </div>
        </div>
      </div>

      {/* 5 — Copyright */}
      <div className="border-t border-primary-foreground/12 dark:border-surface-foreground/15">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/65 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 dark:text-surface-foreground/70">
          <span>{t("footer.copyright", { year })}</span>
          <span className="flex items-center gap-1.5">
            <Heart className="size-3.5 text-gold/80 dark:text-gold/85" strokeWidth={1.5} />
            {t("footer.madeWithLove")}
          </span>
        </div>
      </div>

      <CookiePreferences />
      <CookieNotice />
    </footer>
  );
}
