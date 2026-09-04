import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/context/LanguageContext";

interface PreferenciasCompraProps {
  user: User;
}

export function PreferenciasCompraSection({ user }: PreferenciasCompraProps) {
  const t = useT();
  const [preferences, setPreferences] = useState({
    preferred_delivery_time: "any",
    recurring_order_preference: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data } = await supabase
          .from("user_preferences")
          .select("preferred_delivery_time, recurring_order_preference")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setPreferences({
            preferred_delivery_time: data.preferred_delivery_time || "any",
            recurring_order_preference: data.recurring_order_preference || false,
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

  const handleChange = (field: string, value: any) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("user_preferences")
        .update({
          preferred_delivery_time: preferences.preferred_delivery_time,
          recurring_order_preference: preferences.recurring_order_preference,
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
          {t("auth.account.settings.purchasePreferences")}
        </h3>

        <div className="space-y-6">
          <div>
            <Label htmlFor="delivery">{t("auth.account.settings.preferredDelivery")}</Label>
            <Select
              value={preferences.preferred_delivery_time}
              onValueChange={(value) => handleChange("preferred_delivery_time", value)}
            >
              <SelectTrigger id="delivery" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">
                  {t("auth.account.settings.deliveryMorning")}
                </SelectItem>
                <SelectItem value="afternoon">
                  {t("auth.account.settings.deliveryAfternoon")}
                </SelectItem>
                <SelectItem value="any">{t("auth.account.settings.deliveryAny")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={preferences.recurring_order_preference}
              onCheckedChange={(checked) =>
                handleChange("recurring_order_preference", checked as boolean)
              }
            />
            <Label htmlFor="recurring" className="cursor-pointer text-sm font-normal">
              {t("auth.account.settings.recurringOrders")}
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
