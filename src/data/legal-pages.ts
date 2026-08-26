/** Páginas informativas/legales accesibles desde el footer. */
export const legalPageSlugs = [
  "aviso-legal",
  "privacidad",
  "cookies",
  "condiciones-compra",
  "garantias",
  "devoluciones",
  "accesibilidad",
  "pagos",
  "incidencias",
  "preguntas-frecuentes",
] as const;

export type LegalPageSlug = (typeof legalPageSlugs)[number];

export function isLegalPageSlug(slug: string): slug is LegalPageSlug {
  return (legalPageSlugs as readonly string[]).includes(slug);
}

/** Enlaces de la franja "Información legal" del footer. */
export const legalFooterLinks: LegalPageSlug[] = [
  "aviso-legal",
  "privacidad",
  "cookies",
  "condiciones-compra",
  "garantias",
  "devoluciones",
  "accesibilidad",
];
