import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { CustomOrderBuilder } from "@/components/CustomOrderBuilder";
import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import { company } from "@/data/company";
import { formatPrice } from "@/data/catalog";
import { findService } from "@/data/services";

export const Route = createFileRoute("/servicios/$slug")({
  loader: ({ params }) => {
    if (params.slug === "rosas-eternas") throw redirect({ to: "/rosas-eternas" });
    const service = findService(params.slug);
    if (!service) throw notFound();
    return { label: service.label, blurb: service.blurb };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Servicio no disponible · floristeria lucia" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.label} · Servicios · floristeria lucia`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.blurb },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ServiceNotFound,
  component: ServiceDetail,
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const t = useT();
  const service = findService(slug)!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <Link
        to="/servicios"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {t("services.backToServices")}
      </Link>

      <header className="mt-6 grid items-center gap-8 md:grid-cols-2 md:gap-12">
        <div>
          <p className="text-xs tracking-[0.35em] text-primary uppercase">{t("services.title")}</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">{service.label}</h1>
          <p className="mt-4 text-muted-foreground">{service.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/contacto">{t("services.requestQuote")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`tel:${company.phoneLink}`}>
                {t("services.callUs", { phone: company.phone })}
              </a>
            </Button>
          </div>
        </div>
        <figure className="overflow-hidden rounded-lg">
          <img
            src={service.image}
            alt={service.label}
            width={1024}
            height={768}
            className="aspect-[4/3] w-full object-cover"
          />
        </figure>
      </header>

      <section className="mt-16">
        <h2 className="font-display text-3xl">{t("services.includes")}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {service.items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-lg border border-border/70 bg-card"
            >
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                width={800}
                height={800}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="space-y-2 p-5">
                <h3 className="font-display text-xl">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="text-sm text-primary">
                  {item.fromPrice
                    ? t("services.fromPrice", { price: formatPrice(item.fromPrice) })
                    : t("services.priceOnRequest")}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {service.builder && (
        <section className="mt-20">
          <h2 className="font-display text-3xl">{t("services.customizeTitle")}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("services.customizeIntro")}</p>
          <div className="mt-8">
            <CustomOrderBuilder kind={service.builder} />
          </div>
        </section>
      )}
    </div>
  );
}

function ServiceNotFound() {
  const t = useT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl">{t("services.title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("catalog.noResults.description")}</p>
      <Button asChild className="mt-8">
        <Link to="/servicios">{t("services.backToServices")}</Link>
      </Button>
    </div>
  );
}
