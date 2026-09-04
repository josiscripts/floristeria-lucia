import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/context/LanguageContext";

import { DetallesAccountSection } from "@/components/account/settings/DetallesAccountSection";
import { DireccionesSection } from "@/components/account/settings/DireccionesSection";
import { MetodosPagoSection } from "@/components/account/settings/MetodosPagoSection";
import { PreferenciasCompraSection } from "@/components/account/settings/PreferenciasCompraSection";
import { PreferenciasNotificacionesSection } from "@/components/account/settings/PreferenciasNotificacionesSection";
import { CuentasVinculadasSection } from "@/components/account/settings/CuentasVinculadasSection";
import { PrivacidadSection } from "@/components/account/settings/PrivacidadSection";

export const Route = createFileRoute("/_authenticated/mi-cuenta/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración · floristeria lucia" },
      {
        name: "description",
        content: "Configura tu cuenta y preferencias en floristeria lucia.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Header con botón volver */}
        <div className="mb-12 flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/mi-cuenta" className="flex items-center">
              <ChevronLeft className="mr-1 size-4" />
              {t("auth.account.settings.back")}
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {t("auth.account.settings.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.account.settings.subtitle")}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="account">{t("auth.account.settings.tabs.account")}</TabsTrigger>
            <TabsTrigger value="addresses">{t("auth.account.settings.tabs.addresses")}</TabsTrigger>
            <TabsTrigger value="payment">{t("auth.account.settings.tabs.payment")}</TabsTrigger>
            <TabsTrigger value="preferences">
              {t("auth.account.settings.tabs.preferences")}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              {t("auth.account.settings.tabs.notifications")}
            </TabsTrigger>
            <TabsTrigger value="linked">{t("auth.account.settings.tabs.linked")}</TabsTrigger>
            <TabsTrigger value="privacy">{t("auth.account.settings.tabs.privacy")}</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="account">
            <DetallesAccountSection user={user} />
          </TabsContent>

          <TabsContent value="addresses">
            <DireccionesSection user={user} />
          </TabsContent>

          <TabsContent value="payment">
            <MetodosPagoSection />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferenciasCompraSection user={user} />
          </TabsContent>

          <TabsContent value="notifications">
            <PreferenciasNotificacionesSection user={user} />
          </TabsContent>

          <TabsContent value="linked">
            <CuentasVinculadasSection user={user} />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacidadSection user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
