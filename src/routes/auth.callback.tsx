import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/context/LanguageContext";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const t = useT();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get hash from URL
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        const errorDescription = hashParams.get("error_description");

        if (errorDescription) {
          toast.error(t("auth.callback.error"));
          navigate({ to: "/auth", replace: true });
          return;
        }

        if (!accessToken) {
          toast.error(t("auth.callback.error"));
          navigate({ to: "/auth", replace: true });
          return;
        }

        // Exchange tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (error || !data.session) {
          toast.error(t("auth.callback.error"));
          navigate({ to: "/auth", replace: true });
          return;
        }

        if (type === "email_confirmation") {
          toast.success(t("auth.callback.verified"));
        }

        // Get user role and redirect
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userData.user.id)
            .single();

          if (profile?.role === "admin") {
            navigate({ to: "/admin/dashboard", replace: true });
          } else {
            navigate({ to: "/mi-cuenta", replace: true });
          }
        } else {
          navigate({ to: "/", replace: true });
        }
      } catch (err) {
        toast.error(t("auth.callback.error"));
        navigate({ to: "/auth", replace: true });
      }
    };

    handleCallback();
  }, [navigate, t]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-2xl text-foreground">{t("auth.callback.verifying")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.callback.redirecting")}</p>
      </div>
    </div>
  );
}
