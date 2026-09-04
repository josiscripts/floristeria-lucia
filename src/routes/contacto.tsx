import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { company } from "@/data/company";
import { useT } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import contactoImg from "@/assets/contacto_img.jpg";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto, bodas y eventos · floristeria lucia" },
      {
        name: "description",
        content:
          "floristeria lucia en Calle de Motrico 9, San Fernando de Henares. Teléfono 919 95 38 80 para ramos de novia, bodas, eventos y encargos personalizados.",
      },
      { property: "og:title", content: "Contacto · floristeria lucia" },
      {
        property: "og:description",
        content:
          "Escríbenos para tu ramo de novia, decoración de bodas, eventos y composiciones personalizadas.",
      },
    ],
  }),
  component: ContactoPage,
});

function BotanicalStem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 80" fill="none" aria-hidden="true">
      <path d="M12 0V80" stroke="currentColor" strokeWidth="1" />
      <path d="M12 28C8 28 4 32 4 36C4 40 8 44 12 44" stroke="currentColor" strokeWidth="1" />
      <path d="M12 52C16 52 20 56 20 60C20 64 16 68 12 68" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!ref.current || reduced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        visible || reduced ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
      style={{ transitionDelay: reduced ? undefined : `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function ContactLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-300 hover:text-gold"
    >
      <span className="link-underline">{children}</span>
      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
    </a>
  );
}

function ContactoPage() {
  const t = useT();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      {/* BLOQUE 1 — Introducción editorial al contacto */}
      <section className="py-8 lg:py-12">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
          {/* Columna izquierda: contenido textual y acciones */}
          <div className="order-1 flex flex-col">
            <Reveal delay={0} className="inline-block">
              <span className="text-xs font-medium tracking-[0.35em] text-primary uppercase">
                {t("pages.contact.badge")}
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-4 font-display text-4xl font-normal text-foreground sm:text-5xl lg:text-6xl">
                {t("pages.contact.title")}
              </h1>
            </Reveal>

            <Reveal delay={160} className="mt-5">
              <div className="h-px w-14 bg-gold" />
            </Reveal>

            <Reveal delay={240}>
              <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
                {t("pages.contact.intro")}
              </p>
            </Reveal>

            {/* Subbloque bodas, eventos y encargos a medida */}
            <Reveal delay={320}>
              <div className="mt-10 flex gap-4">
                <BotanicalStem className="mt-1 h-12 w-5 shrink-0 text-gold/70" />
                <div>
                  <h2 className="font-display text-sm font-normal tracking-[0.18em] text-foreground uppercase">
                    {t("pages.contact.weddingsTitle")}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {t("pages.contact.weddingsP1")}
                  </p>
                </div>
              </div>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={400}>
              <div className="mt-10 flex flex-col items-start gap-6">
                {/* CTA Principal: WhatsApp */}
                <a
                  href={`https://wa.me/${company.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group w-full rounded-lg bg-primary px-6 py-5 text-primary-foreground transition-colors duration-300 hover:bg-primary/90"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium tracking-[0.15em] uppercase opacity-90">
                        WhatsApp
                      </div>
                      <div className="mt-2 text-sm leading-relaxed">
                        Escríbenos y cuéntanos tu idea
                      </div>
                    </div>
                    <ArrowRight className="mt-1 size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </a>

                {/* CTA Secundario: Teléfono */}
                <a
                  href={`tel:${company.phoneLink}`}
                  className="group w-full rounded-lg border border-primary/30 px-6 py-4 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Phone className="size-4 text-primary/70" />
                      <span className="font-display text-sm font-medium text-foreground">
                        {company.phone}
                      </span>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-primary/60 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </a>

                {/* CTA Terciario: Email */}
                <ContactLink href={`mailto:${company.email}`}>
                  {t("pages.contact.ctaEmail")}
                </ContactLink>
              </div>
            </Reveal>
          </div>

          {/* Columna derecha: imagen floral */}
          <Reveal delay={160} className="order-2">
            <img
              src={contactoImg}
              alt={t("pages.contact.imgAlt")}
              loading="eager"
              width={1280}
              height={960}
              className="aspect-[4/5] w-full rounded-lg object-cover lg:max-h-[560px]"
            />
          </Reveal>
        </div>
      </section>

      {/* BLOQUE 2 — Información práctica de contacto */}
      <section className="py-10 lg:py-14">
        <div className="border-y border-gold/15 py-12 lg:py-16">
          <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            {/* TIENDA */}
            <Reveal delay={0} className="px-4 py-8 md:px-8 lg:px-12">
              <div className="flex h-full flex-col">
                <MapPin className="size-[18px] stroke-[1.5px] text-gold/60" aria-hidden="true" />
                <h2 className="mt-4 font-display text-sm font-normal tracking-[0.2em] text-primary uppercase">
                  {t("pages.contact.info.storeTitle")}
                </h2>
                <div className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  <p>{t("pages.contact.info.addressLine1")}</p>
                  <p>{t("pages.contact.info.addressLine2")}</p>
                </div>
                <div className="mt-auto pt-6">
                  <a
                    href="https://share.google/B6HPwCAYyrfQVspY7"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-300 hover:text-gold"
                  >
                    <span className="link-underline">{t("pages.contact.info.ctaMap")}</span>
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </Reveal>

            <div className="hidden md:block w-px self-center bg-gold/20 h-2/3" aria-hidden="true" />

            {/* TELÉFONO */}
            <Reveal
              delay={120}
              className="px-4 py-8 md:px-8 lg:px-12 border-t border-gold/15 md:border-t-0"
            >
              <div className="flex h-full flex-col">
                <Phone className="size-[18px] stroke-[1.5px] text-gold/60" aria-hidden="true" />
                <h2 className="mt-4 font-display text-sm font-normal tracking-[0.2em] text-primary uppercase">
                  {t("pages.contact.info.phoneTitle")}
                </h2>
                <p className="mt-5 max-w-[260px] text-lg font-normal tracking-wide text-foreground">
                  {company.phone}
                </p>
                <p className="mt-1 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
                  {t("pages.contact.info.phoneNote")}
                </p>
                <div className="mt-auto pt-6">
                  <ContactLink href={`tel:${company.phoneLink}`}>
                    {t("pages.contact.info.ctaCall")}
                  </ContactLink>
                </div>
              </div>
            </Reveal>

            <div className="hidden md:block w-px self-center bg-gold/20 h-2/3" aria-hidden="true" />

            {/* WHATSAPP */}
            <Reveal
              delay={240}
              className="px-4 py-8 md:px-8 lg:px-12 border-t border-gold/15 md:border-t-0"
            >
              <div className="flex h-full flex-col">
                <MessageCircle
                  className="size-[18px] stroke-[1.5px] text-gold/60"
                  aria-hidden="true"
                />
                <h2 className="mt-4 font-display text-sm font-normal tracking-[0.2em] text-primary uppercase">
                  {t("pages.contact.info.whatsappTitle")}
                </h2>
                <p className="mt-5 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
                  {t("pages.contact.info.whatsappNote")}
                </p>
                <div className="mt-auto pt-6">
                  <a
                    href={`https://wa.me/${company.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-300 hover:text-gold"
                  >
                    <span className="link-underline">{t("pages.contact.info.ctaWhatsapp")}</span>
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </Reveal>

            <div className="hidden md:block w-px self-center bg-gold/20 h-2/3" aria-hidden="true" />

            {/* EMAIL */}
            <Reveal
              delay={360}
              className="px-4 py-8 md:px-8 lg:px-12 border-t border-gold/15 md:border-t-0"
            >
              <div className="flex h-full flex-col">
                <Mail className="size-[18px] stroke-[1.5px] text-gold/60" aria-hidden="true" />
                <h2 className="mt-4 font-display text-sm font-normal tracking-[0.2em] text-primary uppercase">
                  {t("pages.contact.info.emailTitle")}
                </h2>
                <p className="mt-5 max-w-[260px] break-words text-sm leading-relaxed text-muted-foreground">
                  {company.email}
                </p>
                <div className="mt-auto pt-6">
                  <ContactLink href={`mailto:${company.email}`}>
                    {t("pages.contact.info.ctaEmail")}
                  </ContactLink>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BLOQUE 3 — Ubicación y mapa */}
      <section
        id="mapa"
        aria-labelledby="ubicacion-titulo"
        className="scroll-mt-24 border-t border-gold/15 py-20 lg:py-28"
      >
        <div id="ubicacion" className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal delay={0}>
              <span className="text-[0.65rem] uppercase tracking-[0.35em] text-primary/70">
                {t("pages.contact.location.badge")}
              </span>
            </Reveal>
            <Reveal delay={120}>
              <h2
                id="ubicacion-titulo"
                className="mt-7 font-serif text-4xl font-normal tracking-tight text-foreground md:text-5xl"
              >
                {t("pages.contact.location.title")}
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <span className="mx-auto mt-7 block h-px w-12 bg-gold/50" />
            </Reveal>
            <Reveal delay={280}>
              <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                {t("pages.contact.location.intro")}
              </p>
            </Reveal>
          </div>

          <Reveal delay={380} className="mt-14 lg:mt-20">
            <div className="mx-auto w-full lg:w-4/5">
              <div className="overflow-hidden rounded-xl ring-1 ring-gold/15">
                <iframe
                  title={t("pages.contact.location.mapTitle")}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48600.378684222036!2d-3.5967536417968677!3d40.41940190000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd42315b12454275%3A0x4483a29370e76bd2!2sFloristeria%20Lucia!5e0!3m2!1ses!2ses!4v1788483806334!5m2!1ses!2ses"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="block aspect-[16/10] w-full border-0 md:aspect-[16/8] [filter:saturate(0.55)_contrast(0.95)_brightness(1.03)]"
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={480} className="mt-12 text-center">
            <p className="font-serif text-2xl text-foreground md:text-[1.75rem]">
              {t("pages.contact.location.addressLine1")}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("pages.contact.location.addressLine2")}
            </p>
            <div className="mt-9">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(company.address)}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-gold"
              >
                <span className="link-underline">{t("pages.contact.location.cta")}</span>
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
