import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { company } from "@/data/company";
import { useT } from "@/context/LanguageContext";

// Country codes and their phone prefixes
const COUNTRY_CODES = [
  { code: "ES", name: "España", prefix: "34" },
  { code: "FR", name: "Francia", prefix: "33" },
  { code: "PT", name: "Portugal", prefix: "351" },
  { code: "IT", name: "Italia", prefix: "39" },
  { code: "DE", name: "Alemania", prefix: "49" },
  { code: "UK", name: "Reino Unido", prefix: "44" },
  { code: "US", name: "Estados Unidos", prefix: "1" },
  { code: "AR", name: "Argentina", prefix: "54" },
  { code: "MX", name: "México", prefix: "52" },
];

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(t("auth.google.error"));
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>{t("auth.google.divider")}</span>
        <span className="h-px flex-1 bg-border" />
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
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailUnverified, setEmailUnverified] = useState(false);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setBusy(true);
    setEmailUnverified(false);

    const { error, data } = await supabase.auth.signInWithPassword({
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

    // Check if email is verified
    if (data.user && !data.user.email_confirmed_at) {
      setEmailUnverified(true);
      toast.warning(t("auth.login.emailNotVerified"));
      return;
    }

    toast.success(t("auth.login.success"));

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/mi-cuenta" });
      }
    } else {
      navigate({ to: "/mi-cuenta" });
    }
  };

  const handleResendEmail = async () => {
    if (!email.trim()) {
      toast.error(t("auth.login.enterEmail"));
      return;
    }

    setResendingEmail(true);
    const { error } = await supabase.auth.resendEnvelope({
      type: "signup",
      email: email.trim(),
    });
    setResendingEmail(false);

    if (error) {
      toast.error(t("auth.login.resendError"));
      return;
    }

    toast.success(t("auth.login.resendSuccess"));
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
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

      {emailUnverified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="mb-2">{t("auth.login.verifyEmailFirst")}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleResendEmail}
            disabled={resendingEmail}
            className="w-full"
          >
            {resendingEmail ? t("auth.login.resending") : t("auth.login.resendEmail")}
          </Button>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={busy || emailUnverified}>
        {busy ? t("auth.login.submitting") : t("auth.login.submit")}
      </Button>

      <div className="text-center">
        <Link
          to="/auth/reset-password"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {t("auth.login.forgotPassword")}
        </Link>
      </div>
    </form>
  );
}

function SignupForm() {
  const t = useT();
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("ES");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("auth.signup.passwordTooShort"));
      return;
    }

    // Construct full phone number with country code
    const countryPrefix = COUNTRY_CODES.find((c) => c.code === countryCode)?.prefix || "34";
    const fullPhone = phone.trim() ? `+${countryPrefix}${phone.trim()}` : "";

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName.trim(),
          phone: fullPhone,
        },
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
        <div className="flex gap-2">
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.code} (+{country.prefix})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="signup-phone"
            type="tel"
            maxLength={20}
            placeholder={t("auth.fields.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
          />
        </div>
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
        <div className="relative">
          <Input
            id="signup-password"
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

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("auth.signup.submitting") : t("auth.signup.submit")}
      </Button>
    </form>
  );
}
