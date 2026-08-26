import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { useLanguage } from "@/context/LanguageContext";
import { company } from "@/data/company";
import { isLegalPageSlug } from "@/data/legal-pages";

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    if (!isLegalPageSlug(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Página no disponible · floristeria lucia" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `Información · floristeria lucia`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content:
            "Información legal, condiciones de compra, pagos, garantías y atención al cliente de floristeria lucia en San Fernando de Henares.",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Condiciones, privacidad, cookies, pagos y garantías de floristeria lucia.",
        },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { slug } = Route.useLoaderData();
  const { t, tList } = useLanguage();
  const vars = { email: company.email, phone: company.phone };
  const paragraphs = tList(`docs.${slug}.body`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          {t("common.home")}
        </Link>
        <span className="px-2 text-border">/</span>
        <span>{t("footer.legalInfo")}</span>
      </nav>

      <h1 className="mt-5 font-display text-4xl sm:text-5xl">{t(`docs.${slug}.title`)}</h1>
      <div className="mt-5 rule-gold" />
      <p className="mt-5 text-muted-foreground">{t(`docs.${slug}.intro`)}</p>

      <div className="mt-8 space-y-5">
        {paragraphs.map((p) => (
          <p key={p} className="text-sm leading-relaxed text-foreground/85">
            {p.replace(/\{\{email\}\}/g, vars.email).replace(/\{\{phone\}\}/g, vars.phone)}
          </p>
        ))}
      </div>
    </div>
  );
}
