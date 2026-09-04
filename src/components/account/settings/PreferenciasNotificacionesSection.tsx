import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/context/LanguageContext";

interface PreferenciasNotificacionesProps {
  user: User;
}

export function PreferenciasNotificacionesSection({ user }: PreferenciasNotificacionesProps) {
  const t = useT();
  const [preferences, setPreferences] = useState({
    email_newsletter_promotions: true,
    email_newsletter_news: true,
    email_order_updates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data } = await supabase
          .from("user_preferences")
          .select("email_newsletter_promotions, email_newsletter_news, email_order_updates")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setPreferences({
            email_newsletter_promotions: data.email_newsletter_promotions || false,
            email_newsletter_news: data.email_newsletter_news || false,
            email_order_updates: data.email_order_updates || false,
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
    setPreferences((prev) => ({ ...prev, [field]: checked }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("user_preferences")
        .update({
          email_newsletter_promotions: preferences.email_newsletter_promotions,
          email_newsletter_news: preferences.email_newsletter_news,
          email_order_updates: preferences.email_order_updates,
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
          {t("auth.account.settings.emailPreferences")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="promotions"
              checked={preferences.email_newsletter_promotions}
              onCheckedChange={(checked) =>
                handleChange("email_newsletter_promotions", checked as boolean)
              }
            />
            <Label htmlFor="promotions" className="cursor-pointer text-sm font-normal">
              {t("auth.account.settings.promotions")}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="news"
              checked={preferences.email_newsletter_news}
              onCheckedChange={(checked) =>
                handleChange("email_newsletter_news", checked as boolean)
              }
            />
            <Label htmlFor="news" className="cursor-pointer text-sm font-normal">
              {t("auth.account.settings.news")}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="orderUpdates"
              checked={preferences.email_order_updates}
              onCheckedChange={(checked) => handleChange("email_order_updates", checked as boolean)}
            />
            <Label htmlFor="orderUpdates" className="cursor-pointer text-sm font-normal">
              {t("auth.account.settings.orderUpdates")}
            </Label>
          </div>

          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? t("auth.account.saving") : t("auth.account.saveChanges")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
