import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { company } from "@/data/company";
import { useT } from "@/context/LanguageContext";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña · floristeria lucia" },
      {
        name: "description",
        content: "Recupera el acceso a tu cuenta en floristeria lucia.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(t("auth.resetPassword.invalidEmail"));
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password-confirm`,
    });
    setBusy(false);

    if (error) {
      toast.error(t("auth.resetPassword.error"));
      return;
    }

    setSent(true);
    toast.success(t("auth.resetPassword.success"));
  };

  if (sent) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-foreground">{t("auth.resetPassword.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.resetPassword.success")}</p>

        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">{t("auth.resetPassword.backToLogin")}:</p>
          <Link to="/auth" className="inline-block">
            <Button variant="outline">{t("auth.tabs.login")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{t("auth.resetPassword.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("auth.resetPassword.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">{t("auth.fields.email")}</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t("auth.resetPassword.submitting") : t("auth.resetPassword.submit")}
        </Button>

        <div className="text-center">
          <Link
            to="/auth"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {t("auth.resetPassword.backToLogin")}
          </Link>
        </div>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {t("auth.page.contactPrompt")}{" "}
        <Link to="/contacto" className="underline">
          {t("auth.page.contactLink")}
        </Link>
        .
      </p>
    </div>
  );
}
