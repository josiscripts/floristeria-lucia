import { common } from "./common";
import { auth } from "./ns/auth";
import { cart } from "./ns/cart";
import { catalog } from "./ns/catalog";
import { coverage } from "./ns/coverage";
import { custom } from "./ns/custom";
import { docs } from "./ns/docs";
import { footer } from "./ns/footer";
import { home } from "./ns/home";
import { legal } from "./ns/legal";
import { navbar } from "./ns/navbar";
import { pages } from "./ns/pages";
import { product } from "./ns/product";
import { servicesNs } from "./ns/services";
import { store } from "./ns/store";
import { locales, type DictNode, type Locale, type LocaleBundle } from "./types";

const bundles: Record<string, LocaleBundle> = {
  common,
  nav: navbar,
  cart,
  footer,
  home,
  product,
  store,
  coverage,
  catalog,
  pages,
  auth,
  legal,
  docs,
  custom,
  services: servicesNs,
};

export const dictionaries: Record<Locale, DictNode> = locales.reduce(
  (acc, locale) => {
    const dict: DictNode = {};
    for (const [ns, bundle] of Object.entries(bundles)) {
      dict[ns] = bundle[locale] ?? {};
    }
    acc[locale] = dict;
    return acc;
  },
  {} as Record<Locale, DictNode>,
);

function lookupNode(dict: DictNode, key: string): string | string[] | DictNode | undefined {
  let node: string | string[] | DictNode | undefined = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || Array.isArray(node)) return undefined;
    node = node[part];
  }
  return node;
}

function lookup(dict: DictNode, key: string): string | undefined {
  const node = lookupNode(dict, key);
  return typeof node === "string" ? node : undefined;
}

function lookupList(dict: DictNode, key: string): string[] | undefined {
  const node = lookupNode(dict, key);
  return Array.isArray(node) ? node : undefined;
}

function interpolate(value: string, vars?: Record<string, string | number>) {
  if (!vars) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_m, name: string) =>
    vars[name] === undefined ? `{{${name}}}` : String(vars[name]),
  );
}

/** Translate a key for a given locale, falling back to Spanish and then the key itself. */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = lookup(dictionaries[locale], key) ?? lookup(dictionaries.es, key);
  return value === undefined ? key : interpolate(value, vars);
}

/** Translate a key that holds a list of strings. */
export function translateList(locale: Locale, key: string): string[] {
  return lookupList(dictionaries[locale], key) ?? lookupList(dictionaries.es, key) ?? [];
}

export type { Locale };
export { locales };
