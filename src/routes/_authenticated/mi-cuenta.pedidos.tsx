import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/context/LanguageContext";
import { MyOrdersTab } from "@/components/account/MyOrdersTab";

export const Route = createFileRoute("/_authenticated/mi-cuenta/pedidos")({
  head: () => ({
    meta: [
      { title: "Mis pedidos · floristeria lucia" },
      {
        name: "description",
        content: "Ve tus pedidos anteriores en floristeria lucia.",
      },
    ],
  }),
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const t = useT();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/mi-cuenta" className="flex items-center">
              <ChevronLeft className="mr-1 size-4" />
              {t("common.back")}
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {t("auth.account.tabs.orders")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.account.ordersDescription")}
            </p>
          </div>
        </div>

        <MyOrdersTab user={user} />
      </div>
    </div>
  );
}
