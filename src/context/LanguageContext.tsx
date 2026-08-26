import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { translate, translateList } from "@/i18n";

export type LanguageCode = "es" | "en" | "ca";

export const languages: { code: LanguageCode; label: string; short: string }[] = [
  { code: "es", label: "Español", short: "ES" },
  { code: "en", label: "English", short: "EN" },
  { code: "ca", label: "Català", short: "CA" },
];

const STORAGE_KEY = "lucia-language";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;
export type TranslateListFn = (key: string) => string[];

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: TranslateFn;
  tList: TranslateListFn;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("es");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "es" || stored === "en" || stored === "ca") setLanguageState(stored);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
      tList: (key) => translateList(language, key),
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  return ctx;
}

/** Shorthand: const t = useT(); t("nav.catalog") */
export function useT(): TranslateFn {
  return useLanguage().t;
}

/** Shorthand for list-valued keys: const tList = useTList(); tList("pages.shipping.conditions") */
export function useTList(): TranslateListFn {
  return useLanguage().tList;
}
