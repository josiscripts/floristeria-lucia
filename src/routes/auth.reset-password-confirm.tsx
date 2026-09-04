import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/context/LanguageContext";

export const Route = createFileRoute("/auth/reset-password-confirm")({
  head: () => ({
    meta: [
      { title: "Establecer nueva contraseña · floristeria lucia" },
      {
        name: "description",
        content: "Establece una nueva contraseña para tu cuenta en floristeria lucia.",
      },
    ],
  }),
  component: ResetPasswordConfirmPage,
});

function ResetPasswordConfirmPage() {
  const t = useT();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a valid session from reset link
    const checkSession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (!accessToken || type !== "recovery") {
        setError(t("auth.resetPasswordConfirm.error"));
        return;
      }

      // Set session
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get("refresh_token") || "",
      });

      if (sessionError || !data.session) {
        setError(t("auth.resetPasswordConfirm.error"));
      }
    };

    checkSession();
  }, [t]);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error(t("auth.resetPasswordConfirm.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("auth.resetPasswordConfirm.passwordMismatch"));
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setBusy(false);

    if (updateError) {
      toast.error(t("auth.resetPasswordConfirm.error"));
      return;
    }

    setSuccess(true);
    toast.success(t("auth.resetPasswordConfirm.success"));

    // Redirect after 2 seconds
    setTimeout(() => {
      navigate({ to: "/auth", replace: true });
    }, 2000);
  };

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-foreground">
          {t("auth.resetPasswordConfirm.title")}
        </h1>
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
        <Link to="/auth/reset-password" className="mt-8 inline-block">
          <Button variant="outline">{t("auth.resetPassword.title")}</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-foreground">
          {t("auth.resetPasswordConfirm.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.resetPasswordConfirm.success")}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">{t("auth.callback.redirecting")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">
        {t("auth.resetPasswordConfirm.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("auth.resetPasswordConfirm.subtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">{t("auth.resetPasswordConfirm.newPassword")}</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? t("auth.password.hide") : t("auth.password.show")}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t("auth.resetPasswordConfirm.confirmPassword")}</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? t("auth.password.hide") : t("auth.password.show")}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t("auth.resetPasswordConfirm.submitting") : t("auth.resetPasswordConfirm.submit")}
        </Button>

        <div className="text-center">
          <Link
            to="/auth"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {t("auth.tabs.login")}
          </Link>
        </div>
      </form>
    </div>
  );
}
