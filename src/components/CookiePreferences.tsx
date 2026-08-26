import { Cookie } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/context/LanguageContext";

const STORAGE_KEY = "lucia-cookie-prefs";
export const COOKIE_STORAGE_KEY = STORAGE_KEY;
export const COOKIE_PREFS_EVENT = "lucia:open-cookie-preferences";
export const COOKIE_PREFS_SAVED_EVENT = "lucia:cookie-prefs-saved";

/** Abre el panel de preferencias de cookies desde cualquier parte de la web. */
export function openCookiePreferences() {
  window.dispatchEvent(new Event(COOKIE_PREFS_EVENT));
}

/** ¿El usuario ya ha decidido sobre las cookies? */
export function hasCookieDecision(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

type Prefs = { analytics: boolean };

/** Única fuente de verdad para guardar el consentimiento (banner y panel). */
export function saveCookieConsent(analytics: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics, ts: Date.now() }));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(COOKIE_PREFS_SAVED_EVENT));
}

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { analytics: Boolean(JSON.parse(raw).analytics) };
  } catch {
    /* storage unavailable */
  }
  return { analytics: false };
}

export function CookiePreferences() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const handler = () => {
      setAnalytics(readPrefs().analytics);
      setOpen(true);
    };
    window.addEventListener(COOKIE_PREFS_EVENT, handler);
    return () => window.removeEventListener(COOKIE_PREFS_EVENT, handler);
  }, []);

  const persist = useCallback(
    (value: boolean) => {
      saveCookieConsent(value);
      setAnalytics(value);
      setOpen(false);
      toast.success(t("footer.cookies.saved"));
    },
    [t],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Cookie className="size-5 text-gold" strokeWidth={1.5} />
            {t("footer.cookies.title")}
          </DialogTitle>
          <DialogDescription className="pt-1 text-left text-sm leading-relaxed">
            {t("footer.cookies.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-md border border-border/70 p-4">
            <div>
              <p className="text-sm font-medium">{t("footer.cookies.necessary")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("footer.cookies.necessaryText")}
              </p>
            </div>
            <Switch checked disabled aria-readonly />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-md border border-border/70 p-4">
            <div>
              <p className="text-sm font-medium">{t("footer.cookies.analytics")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("footer.cookies.analyticsText")}
              </p>
            </div>
            <Switch
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label={t("footer.cookies.analytics")}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => persist(analytics)}>
            {t("footer.cookies.save")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => persist(true)}>
            {t("footer.cookies.acceptAll")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => persist(false)}>
            {t("footer.cookies.rejectAll")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
