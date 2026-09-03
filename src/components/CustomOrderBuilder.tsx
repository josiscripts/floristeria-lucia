import { useMemo, useState } from "react";
import { Minus, Plus, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/context/LanguageContext";
import { company } from "@/data/company";
import { formatPrice } from "@/data/catalog";
import { elementsFor, type BuilderKind } from "@/data/customizer";
import { cn } from "@/lib/utils";

type LineState = { qty: number; color?: string };

/**
 * Configurador compartido por «Personalizar mi ramo», composiciones
 * personalizadas y encargos: seleccionar elementos, cantidades y colores,
 * revisar el desglose y enviar la configuración a la floristería.
 */
export function CustomOrderBuilder({ kind }: { kind: BuilderKind }) {
  const t = useT();
  const elements = useMemo(() => elementsFor(kind), [kind]);
  const [lines, setLines] = useState<Record<string, LineState>>({});
  const [occasion, setOccasion] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const change = (id: string, delta: number, step: number) => {
    setLines((prev) => {
      const current = prev[id]?.qty ?? 0;
      const next = Math.max(0, current + delta * step);
      const copy = { ...prev, [id]: { ...prev[id], qty: next } };
      if (next === 0) delete copy[id];
      return copy;
    });
  };

  const setColor = (id: string, color: string) =>
    setLines((prev) => ({ ...prev, [id]: { qty: prev[id]?.qty ?? 0, color } }));

  const rows = elements
    .filter((el) => (lines[el.id]?.qty ?? 0) > 0)
    .map((el) => {
      const state = lines[el.id]!;
      const blocks = el.step > 1 ? state.qty / el.step : state.qty;
      const cost = el.price === undefined ? undefined : el.price * state.qty;
      return { el, qty: state.qty, blocks, color: state.color, cost };
    });

  const total = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const needsQuote = rows.some((r) => r.cost === undefined);

  const summary = () => {
    const parts = rows.map(
      (r) =>
        `- ${r.el.name}: ${r.qty} ${r.el.unit}${r.color ? ` (${r.color})` : ""}${
          r.cost === undefined ? ` — ${t("custom.quoteNeeded")}` : ` — ${formatPrice(r.cost)}`
        }`,
    );
    return [
      `${t("custom.summaryTitle")} (${t(`custom.kinds.${kind}`)})`,
      ...parts,
      "",
      `${t("custom.total")}: ${formatPrice(total)}${needsQuote ? ` (${t("custom.quotePending")})` : ""}`,
      occasion ? `${t("custom.occasion")}: ${occasion}` : "",
      date ? `${t("custom.date")}: ${date}` : "",
      notes ? `${t("custom.notes")}: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const send = () => {
    if (rows.length === 0) {
      toast.error(t("custom.emptyError"));
      return;
    }
    const body = encodeURIComponent(summary());
    const subject = encodeURIComponent(
      `${t("custom.summaryTitle")} · ${t(`custom.kinds.${kind}`)}`,
    );
    window.location.href = `mailto:${company.email}?subject=${subject}&body=${body}`;
    toast.success(t("custom.sent"));
  };

  const whatsapp = () => {
    if (rows.length === 0) {
      toast.error(t("custom.emptyError"));
      return;
    }
    window.open(
      `https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(summary())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <h3 className="font-display text-2xl">{t("custom.selectTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("custom.selectHint")}</p>

        <ul className="divide-y divide-border/60 rounded-lg border border-border/70 bg-card">
          {elements.map((el) => {
            const qty = lines[el.id]?.qty ?? 0;
            return (
              <li key={el.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{el.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {el.price === undefined
                      ? t("custom.quoteNeeded")
                      : `${formatPrice(el.price)} / ${t(`custom.units.${el.unit}`)}`}
                    {el.step > 1 && ` · ${t("custom.stepNote", { step: el.step })}`}
                  </p>
                  {el.colors && qty > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {el.colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(el.id, c)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[0.7rem] transition-colors",
                            lines[el.id]?.color === c
                              ? "border-primary bg-primary-soft text-accent-foreground"
                              : "border-border text-muted-foreground hover:border-primary",
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label={t("custom.decrease")}
                    onClick={() => change(el.id, -1, el.step)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label={t("custom.increase")}
                    onClick={() => change(el.id, 1, el.step)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="space-y-4 self-start rounded-lg border border-border/70 bg-surface p-5">
        <h3 className="font-display text-2xl">{t("custom.summaryTitle")}</h3>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("custom.emptySummary")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map((r) => (
              <li key={r.el.id} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  {r.el.name}
                  <span className="block text-xs text-muted-foreground">
                    {r.qty} {t(`custom.units.${r.el.unit}`)}
                    {r.color ? ` · ${r.color}` : ""}
                    {r.el.price !== undefined && ` · ${formatPrice(r.el.price)}/u`}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {r.cost === undefined ? t("custom.quoteShort") : formatPrice(r.cost)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm font-semibold">
          <span>{t("custom.total")}</span>
          <span className="tabular-nums text-primary">{formatPrice(total)}</span>
        </div>
        {needsQuote && (
          <p className="rounded-md bg-primary-soft/50 px-3 py-2 text-xs text-muted-foreground">
            {t("custom.quotePending")}
          </p>
        )}

        <div className="space-y-3 pt-2">
          <Input
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder={t("custom.occasionPlaceholder")}
            aria-label={t("custom.occasion")}
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={t("custom.date")}
          />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("custom.notesPlaceholder")}
            aria-label={t("custom.notes")}
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={send} className="w-full">
            <Send className="size-4" /> {t("custom.send")}
          </Button>
          <Button onClick={whatsapp} variant="outline" className="w-full">
            {t("custom.whatsapp")}
          </Button>
          <a
            href={`tel:${company.phoneLink}`}
            className="text-center text-xs text-muted-foreground hover:text-primary"
          >
            {t("custom.callUs", { phone: company.phone })}
          </a>
        </div>
      </aside>
    </div>
  );
}
