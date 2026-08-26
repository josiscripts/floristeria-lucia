import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { company } from "@/data/company";
import { useT } from "@/context/LanguageContext";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceder a tu cuenta · floristeria lucia" },
      {
        name: "description",
        content:
          "Inicia sesión o crea tu cuenta en floristeria lucia para guardar tus datos de entrega y seguir tus pedidos de flores en San Fernando de Henares.",
      },
      { property: "og:title", content: "Acceder a tu cuenta · floristeria lucia" },
      {
        property: "og:description",
        content: "Inicia sesión o regístrate en floristeria lucia y guarda tus datos de entrega.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/mi-cuenta", replace: true });
  }, [user, loading, navigate]);

  const t = useT();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{t("auth.page.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("auth.page.subtitle", { company: company.name })}
      </p>

      <Tabs defaultValue="login" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{t("auth.tabs.login")}</TabsTrigger>
          <TabsTrigger value="signup">{t("auth.tabs.signup")}</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="signup">
          <SignupForm />
        </TabsContent>
      </Tabs>

      <GoogleButton />

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

function GoogleButton() {
  const t = useT();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth("google", {
      redirectTo: window.location.origin,
    });
    if (error) {
      toast.error(t("auth.google.error"));
      setBusy(false);
      return;
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="mt-4 w-full" onClick={signIn} disabled={busy}>
        {t("auth.google.continue")}
      </Button>
    </div>
  );
}

function LoginForm() {
  const t = useT();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? t("auth.login.invalidCredentials")
          : error.message,
      );
      return;
    }
    toast.success(t("auth.login.success"));
    navigate({ to: "/mi-cuenta" });
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">{t("auth.fields.email")}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">{t("auth.fields.password")}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("auth.login.submitting") : t("auth.login.submit")}
      </Button>
    </form>
  );
}

function SignupForm() {
  const t = useT();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("auth.signup.passwordTooShort"));
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), phone: phone.trim() },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSent(true);
      toast.success(t("auth.signup.confirmationSent"));
    }
  };

  if (sent) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        {t("auth.signup.checkEmail")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">{t("auth.fields.fullName")}</Label>
        <Input
          id="signup-name"
          required
          maxLength={100}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-phone">{t("auth.fields.phone")}</Label>
        <Input
          id="signup-phone"
          type="tel"
          maxLength={20}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">{t("auth.fields.email")}</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">{t("auth.fields.password")}</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("auth.signup.submitting") : t("auth.signup.submit")}
      </Button>
    </form>
  );
}
