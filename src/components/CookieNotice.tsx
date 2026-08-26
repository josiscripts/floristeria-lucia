import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";

import {
  COOKIE_PREFS_SAVED_EVENT,
  hasCookieDecision,
  openCookiePreferences,
  saveCookieConsent,
} from "@/components/CookiePreferences";
import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";

/** Primera capa: aviso discreto inferior. La configuración avanzada sigue en CookiePreferences. */
export function CookieNotice() {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasCookieDecision()) return;
    setMounted(true);
    const id = window.setTimeout(() => setVisible(true), 400);
    const onSaved = () => {
      setVisible(false);
      window.setTimeout(() => setMounted(false), 320);
    };
    window.addEventListener(COOKIE_PREFS_SAVED_EVENT, onSaved);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(COOKIE_PREFS_SAVED_EVENT, onSaved);
    };
  }, []);

  const decide = (analytics: boolean) => {
    saveCookieConsent(analytics);
  };

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex justify-center sm:inset-x-0 sm:bottom-6">
      <div
        role="dialog"
        aria-label={t("footer.cookies.banner.title")}
        className={`pointer-events-auto w-full max-w-[560px] rounded-lg border border-border/70 bg-card/95 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out sm:p-5 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          <Cookie className="size-5 shrink-0 text-gold" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight">{t("footer.cookies.banner.title")}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {t("footer.cookies.banner.text")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-foreground/25 bg-background/80 text-foreground hover:border-primary/50 hover:bg-primary/8 hover:text-primary"
            onClick={() => openCookiePreferences()}
          >
            {t("footer.cookies.banner.configure")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-foreground/25 bg-background/80 text-foreground hover:border-primary/50 hover:bg-primary/8 hover:text-primary"
            onClick={() => decide(false)}
          >
            {t("footer.cookies.rejectAll")}
          </Button>
          <Button
            size="sm"
            variant="default"
            className="sm:ml-auto"
            onClick={() => decide(true)}
          >
            {t("footer.cookies.acceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
