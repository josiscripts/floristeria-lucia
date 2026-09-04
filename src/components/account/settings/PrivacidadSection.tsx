import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/context/LanguageContext";

interface PrivacidadSectionProps {
  user: User;
}

export function PrivacidadSection({ user }: PrivacidadSectionProps) {
  const t = useT();
  const [cookies, setCookies] = useState({
    cookies_analytics: true,
    cookies_personalization: true,
    cookies_marketing: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data } = await supabase
          .from("user_preferences")
          .select("cookies_analytics, cookies_personalization, cookies_marketing")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setCookies({
            cookies_analytics: data.cookies_analytics || false,
            cookies_personalization: data.cookies_personalization || false,
            cookies_marketing: data.cookies_marketing || false,
          });
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user.id]);

  const handleChange = (field: string, checked: boolean) => {
    setCookies((prev) => ({ ...prev, [field]: checked }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("user_preferences")
        .update({
          cookies_analytics: cookies.cookies_analytics,
          cookies_personalization: cookies.cookies_personalization,
          cookies_marketing: cookies.cookies_marketing,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success(t("auth.account.saveSuccess"));
      setHasChanges(false);
    } catch (error) {
      toast.error(t("auth.account.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/40 p-6">
        <h3 className="mb-6 font-display text-xl text-foreground">
          {t("auth.account.settings.cookiePreferences")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="analytics"
              checked={cookies.cookies_analytics}
              onCheckedChange={(checked) =>
                handleChange("cookies_analytics", checked as boolean)
              }
            />
            <Label htmlFor="analytics" className="cursor-pointer text-sm font-normal">
              {t("auth.account.settings.analytics")}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="personalization"
              checked={cookies.cookies_personalization}
              onCheckedChange={(checked) =>
                handleChange("cookies_personalization", checked as boolean)
              }
            />
            <Label htmlFor="personalization" className="cursor-pointer text-sm font-normal">
              {t("auth.account.settings.personalization")}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="marketing"
              checked={cookies.cookies_marketing}
              onCheckedChange={(checked) =>
                handleChange("cookies_marketing", checked as boolean)
              }
            />
            <Label htmlFor="marketing" className="cursor-pointer text-sm font-normal">
              {t("auth.account.settings.marketing")}
            </Label>
          </div>

          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? t("auth.account.saving") : t("auth.account.saveChanges")}
          </Button>
        </div>
      </Card>

      <Card className="border border-border/40 p-6">
        <h3 className="mb-4 font-display text-lg text-foreground">
          {t("auth.account.settings.dataPrivacy")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("auth.account.settings.privacyDescription")}
        </p>
      </Card>
    </div>
  );
}
