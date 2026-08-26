export type Locale = "es" | "en" | "ca";

export const locales: Locale[] = ["es", "en", "ca"];

/** Arbitrary nested dictionary of strings for one locale. */
export type DictNode = { [key: string]: string | string[] | DictNode };

/** A namespace bundle: the same shape of keys for each locale. */
export type LocaleBundle = Record<Locale, DictNode>;
