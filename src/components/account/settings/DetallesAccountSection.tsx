import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/context/LanguageContext";

interface DetallesAccountSectionProps {
  user: User;
}

export function DetallesAccountSection({ user }: DetallesAccountSectionProps) {
  const t = useT();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single();

        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.id]);

  const handleChange = (field: string, value: string) => {
    if (field === "fullName") setFullName(value);
    if (field === "phone") setPhone(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() })
        .eq("id", user.id);

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
          {t("auth.account.settings.personalInfo")}
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">{t("auth.fields.email")}</Label>
            <Input id="email" value={user.email || ""} disabled className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("auth.account.settings.emailReadonly")}
            </p>
          </div>

          <div>
            <Label htmlFor="fullName">{t("auth.fields.fullName")}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              maxLength={100}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">{t("auth.fields.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              maxLength={20}
              className="mt-1"
            />
          </div>

          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? t("auth.account.saving") : t("auth.account.saveChanges")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
