import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, CircleUserRound, Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";

import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/context/ShopContext";
import { useTheme } from "@/context/ThemeContext";
import { languages, useLanguage, useT } from "@/context/LanguageContext";
import { company } from "@/data/company";
import { priceRangeLabel, products } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function Navbar() {
  const t = useT();
  const { theme } = useTheme();
  const { count, favorites, setCartOpen } = useShop();

  const logo = { url: theme === "dark" ? "/assets/logo-footer.svg" : "/assets/logo-header.svg" };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overlay = pathname === "/";

  const navLinks = [
    { to: "/catalogo", label: t("nav.links.catalog") },
    { to: "/servicios", label: t("nav.links.services") },
    { to: "/envios", label: t("nav.links.shipping") },
    { to: "/sobre-nosotros", label: t("nav.links.about") },
    { to: "/contacto", label: t("nav.links.contact") },
  ] as const;


  return (
    <header
      className={cn(
        "z-50",
        overlay
          ? "absolute inset-x-0 top-0 border-b border-white/20 bg-background/55 backdrop-blur-md backdrop-saturate-150"
          : "sticky top-0 border-b border-border/40 bg-background",
      )}
    >
      <div className="mx-auto flex h-[78px] w-full max-w-[1500px] items-center gap-6 px-5 sm:px-8 lg:h-[88px] lg:gap-10 lg:px-12">
        <Link
          to="/"
          className="flex shrink-0 items-center leading-none opacity-100 transition-[opacity,transform] duration-200 ease-out hover:opacity-90 motion-safe:hover:scale-[1.015] focus-visible:outline-none focus-visible:opacity-90 motion-reduce:hover:scale-100"
          aria-label={company.name}
        >
          <img
            src={logo.url}
            alt={company.name}
            width={1942}
            height={809}
            className="h-auto w-[135px] sm:w-[145px] lg:w-[160px] xl:w-[172px]"
          />

        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-6 xl:flex xl:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="link-underline py-1 text-[0.9375rem] font-normal text-foreground/80 after:bg-primary hover:text-primary focus-visible:outline-none"
              activeProps={{ className: "text-primary after:scale-x-100" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>


        <div className="ml-auto flex items-center gap-3 lg:gap-4">
          <div className="hidden md:block">
            <LanguageSelector />
          </div>

          <div className="hidden md:block">
            <SearchPill />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="icon-micro md:hidden"
            aria-label={t("nav.search")}
            aria-expanded={mobileSearchOpen}
            onClick={() => setMobileSearchOpen((v) => !v)}
          >
            <Search className="size-5" />
          </Button>

          <Link
            to="/favoritos"
            aria-label={t("nav.favorites")}
            className="icon-micro relative hidden rounded-full p-1 text-foreground/80 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:inline-flex"
          >
            <Heart
              className={cn("size-5.5 transition-colors duration-200", favorites.length > 0 && "fill-primary/15 text-primary")}
              strokeWidth={1.5}
            />
            {favorites.length > 0 && <CounterBadge value={favorites.length} />}
          </Link>

          <div className="hidden md:block">
            <AccountMenu />
          </div>

          <button
            type="button"
            aria-label={t("nav.cart")}
            onClick={() => setCartOpen(true)}
            className="icon-micro relative hidden rounded-full p-1 text-foreground/80 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:inline-flex"
          >
            <ShoppingBag className="size-5.5" strokeWidth={1.5} />
            {count > 0 && <CounterBadge value={count} />}
          </button>


          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label={t("nav.openMenu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 font-display text-xl font-normal">
                  <img src={logo.url} alt={company.name} width={1942} height={809} className="h-14 w-auto" />
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-2 flex flex-col px-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="border-b border-border/50 py-3 text-sm text-foreground transition-colors hover:text-primary"
                    activeProps={{ className: "text-primary" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>


              <div className="mt-6 space-y-5 px-4 pb-8">
                <div>
                  <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {t("nav.language")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <MobileLanguageButtons />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to="/favoritos"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2 text-sm text-foreground hover:text-primary"
                  >
                    <Heart className="size-5" strokeWidth={1.5} /> {t("nav.favorites")}
                    {favorites.length > 0 && (
                      <span className="text-xs text-muted-foreground">({favorites.length})</span>
                    )}
                  </Link>
                  <MobileAccountLinks onNavigate={() => setMobileOpen(false)} />
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setCartOpen(true);
                    }}
                    className="flex items-center gap-3 py-2 text-left text-sm text-foreground hover:text-primary"
                  >
                    <ShoppingBag className="size-5" strokeWidth={1.5} /> {t("nav.cart")}
                    {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/40 transition-[max-height,opacity] duration-300 md:hidden",
          mobileSearchOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="mx-auto max-w-3xl px-5 py-4">
          <SearchPill fullWidth />
        </div>
      </div>

      <CartDrawer />
    </header>
  );
}



function SearchPill({ fullWidth = false }: { fullWidth?: boolean }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const showPanel = focused && query.trim().length >= 2;

  return (
    <div className={cn("group/search relative", fullWidth && "w-full")}>
      <div
        className={cn(
          "flex h-10 items-center rounded-full border border-border/60 bg-surface pr-1 pl-4 transition-[width,border-color,box-shadow] duration-300 ease-out hover:border-border",
          focused && "border-ring/60 shadow-soft",
          fullWidth ? "w-full" : focused ? "w-[220px]" : "w-[180px]",
        )}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          placeholder={t("nav.searchPlaceholder")}
          aria-label={t("nav.searchAriaLabel")}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
        />
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors duration-200 group-hover/search:bg-primary-hover"
        >
          <Search
            className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover/search:scale-[1.08] motion-safe:group-active/search:scale-95"
            strokeWidth={2}
          />
        </span>
      </div>


      {showPanel && (
        <div
          className={cn(
            "absolute top-12 right-0 z-50 rounded-xl border border-border/60 bg-card p-1 shadow-lg",
            fullWidth ? "w-full" : "w-80",
          )}
        >
          {results.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/catalogo"
                    search={{ q: p.name }}
                    onClick={() => setQuery("")}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 truncate">{p.name}</span>
                    <span className="shrink-0 text-muted-foreground">{priceRangeLabel(p)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {t("nav.noResults", { phone: company.phone })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const current =
    languages.find((l) => l.code === language) ?? { code: "es" as const, label: "Español", short: "ES" };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group/lang flex items-center gap-1 rounded-full px-1 text-sm font-normal text-foreground/80 transition-colors duration-200 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:text-primary"
          aria-label={t("nav.languageLabel", { language: current.label })}
        >
          {current.short}
          <ChevronDown
            className="size-3.5 transition-transform duration-200 ease-out group-data-[state=open]/lang:rotate-180"
            strokeWidth={1.5}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLanguage(l.code)}
            className={cn("justify-between", l.code === language && "text-primary")}
          >
            {l.label}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {l.short}
              {l.code === language && <span aria-hidden="true">✓</span>}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileLanguageButtons() {
  const { language, setLanguage } = useLanguage();
  return (
    <>
      {languages.map((l) => (
        <Button
          key={l.code}
          variant={l.code === language ? "default" : "outline"}
          size="sm"
          className="px-3 text-xs"
          onClick={() => setLanguage(l.code)}
          aria-pressed={l.code === language}
        >
          {l.short}
          {l.code === language && <span aria-hidden="true"> ✓</span>}
        </Button>
      ))}
    </>
  );
}

function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function AccountMenu() {
  const { user, loading } = useAuth();
  const signOut = useSignOut();
  const t = useT();

  if (loading || !user) {
    return (
      <Link
        to="/auth"
        aria-label={t("nav.myAccount")}
        className="icon-micro inline-flex rounded-full p-1 text-foreground/80 hover:bg-accent/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <CircleUserRound className="size-5.5" strokeWidth={1.5} />
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.myAccount")}
          className="icon-micro inline-flex rounded-full p-1 text-foreground/80 hover:bg-accent/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <CircleUserRound className="size-5.5" strokeWidth={1.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/mi-cuenta">{t("nav.myAccount")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/mi-cuenta">{t("nav.myOrders")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favoritos">
            {t("nav.favorites")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/mi-cuenta">{t("nav.settings")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>{t("nav.signOut")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const { user, loading } = useAuth();
  const signOut = useSignOut();
  const t = useT();

  if (loading || !user) {
    return (
      <Link
        to="/auth"
        onClick={onNavigate}
        className="flex items-center gap-3 py-2 text-sm text-foreground hover:text-primary"
      >
        <CircleUserRound className="size-5" strokeWidth={1.5} /> {t("nav.signIn")}
      </Link>
    );
  }

  return (
    <>
      <Link
        to="/mi-cuenta"
        onClick={onNavigate}
        className="flex items-center gap-3 py-2 text-sm text-foreground hover:text-primary"
      >
        <CircleUserRound className="size-5" strokeWidth={1.5} /> {t("nav.myAccount")}
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate();
          void signOut();
        }}
        className="py-2 text-left text-sm text-muted-foreground hover:text-primary"
      >
        {t("nav.signOut")}
      </button>
    </>
  );
}

function CounterBadge({ value }: { value: number }) {
  return (
    <span
      key={value}
      className="badge-pop absolute -top-1 -right-1 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold text-primary-foreground"
    >
      {value}
    </span>
  );
}
