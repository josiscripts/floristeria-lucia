import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/context/LanguageContext";
import { useShop } from "@/context/ShopContext";
import { AccountTabContent } from "@/components/account/AccountTabContent";
import { MyOrdersTab } from "@/components/account/MyOrdersTab";
import { FavoritesTab } from "@/components/account/FavoritesTab";
import { LogoutConfirmDialog } from "@/components/account/LogoutConfirmDialog";

export const Route = createFileRoute("/_authenticated/mi-cuenta")({
  head: () => ({
    meta: [
      { title: "Mi cuenta · floristeria lucia" },
      {
        name: "description",
        content:
          "Gestiona tu cuenta, ve tus pedidos y favoritos en floristeria lucia.",
      },
      { property: "og:title", content: "Mi cuenta · floristeria lucia" },
      { property: "og:description", content: "Tu cuenta en floristeria lucia." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites } = useShop();
  const [activeTab, setActiveTab] = useState("account");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.35em] text-primary uppercase">
            {t("auth.account.welcome")}
          </p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl text-foreground">
            {t("auth.account.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">{t("auth.account.tabs.account")}</TabsTrigger>
            <TabsTrigger value="orders">{t("auth.account.tabs.orders")}</TabsTrigger>
            <TabsTrigger value="favorites">{t("auth.account.tabs.favorites")}</TabsTrigger>
            <TabsTrigger value="settings">{t("auth.account.tabs.settings")}</TabsTrigger>
          </TabsList>

          {/* Tab: Account Overview */}
          <TabsContent value="account">
            <AccountTabContent user={user} favorites={favorites} />
          </TabsContent>

          {/* Tab: My Orders */}
          <TabsContent value="orders">
            <MyOrdersTab user={user} />
          </TabsContent>

          {/* Tab: Favorites */}
          <TabsContent value="favorites">
            <FavoritesTab favorites={favorites} />
          </TabsContent>

          {/* Tab: Settings */}
          <TabsContent value="settings">
            <SettingsPreview onNavigate={() => navigate({ to: "/mi-cuenta/configuracion" })} />
          </TabsContent>
        </Tabs>

        {/* Logout Section */}
        <div className="mt-12 space-y-4 border-t border-border pt-8">
          <Button variant="destructive" onClick={() => setLogoutDialogOpen(true)}>
            <LogOut className="mr-2 size-4" />
            {t("auth.account.logoutButton")}
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
    </div>
  );
}

function SettingsPreview({ onNavigate }: { onNavigate: () => void }) {
  const t = useT();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("auth.account.description")}</p>
      <Button onClick={onNavigate}>{t("auth.account.viewFull")}</Button>
    </div>
  );
}
