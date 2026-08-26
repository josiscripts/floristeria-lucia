import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/context/LanguageContext";

export const Route = createFileRoute("/_authenticated/mi-cuenta")({
  head: () => ({
    meta: [
      { title: "Mi cuenta · floristeria lucia" },
      {
        name: "description",
        content:
          "Consulta y actualiza tus datos de contacto en floristeria lucia para tus pedidos de flores y plantas.",
      },
      { property: "og:title", content: "Mi cuenta · floristeria lucia" },
      { property: "og:description", content: "Gestiona tus datos en floristeria lucia." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      });
    return () => {
      active = false;
    };
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName.trim(), phone: phone.trim() });
    setSaving(false);
    if (error) {
      toast.error(t("auth.account.saveError"));
      return;
    }
    toast.success(t("auth.account.saveSuccess"));
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{t("auth.account.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

      <form onSubmit={save} className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="name">{t("auth.fields.fullName")}</Label>
          <Input
            id="name"
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("auth.fields.phone")}</Label>
          <Input
            id="phone"
            type="tel"
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? t("auth.account.saving") : t("auth.account.saveChanges")}
        </Button>
      </form>

      <Button variant="outline" className="mt-6" onClick={signOut}>
        {t("auth.account.signOut")}
      </Button>
    </div>
  );
}
