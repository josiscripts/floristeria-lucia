import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { coverage } from "@/data/coverage";
import { useT } from "@/context/LanguageContext";

export function CoverageSearch() {
  const t = useT();
  const [query, setQuery] = useState("");

  const towns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coverage.filter((t) => t.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("coverage.searchPlaceholder")}
          aria-label={t("coverage.searchAriaLabel")}
          className="pl-9"
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {towns.length === 0
          ? t("coverage.noResults")
          : t("coverage.results", { count: towns.length })}
      </p>

      <ul className="mt-6 flex flex-wrap gap-2">
        {towns.map((town) => (
          <li
            key={town.name}
            className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <MapPin className="size-3.5 text-gold" />
            {town.name}
            <span className="text-xs text-muted-foreground">({town.province})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
