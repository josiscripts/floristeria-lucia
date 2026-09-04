import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/context/LanguageContext";

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface DireccionesSectionProps {
  user: User;
}

export function DireccionesSection({ user }: DireccionesSectionProps) {
  const t = useT();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Address>>({
    label: "",
    full_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "España",
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false });

        if (data) setAddresses(data);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error(t("auth.account.settings.loadAddressesError"));
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user.id, t]);

  const handleSave = async () => {
    if (!formData.label?.trim() || !formData.address?.trim()) {
      toast.error(t("auth.account.settings.requiredFields"));
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        const { error } = await supabase
          .from("addresses")
          .update(formData)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("addresses").insert({
          ...formData,
          user_id: user.id,
        });

        if (error) throw error;
      }

      toast.success(t("auth.account.saveSuccess"));
      setShowForm(false);
      setEditingId(null);
      setFormData({
        label: "",
        full_name: "",
        phone: "",
        address: "",
        city: "",
        postal_code: "",
        country: "España",
        is_default: false,
      });

      // Reload addresses
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (data) setAddresses(data);
    } catch (error) {
      toast.error(t("auth.account.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("auth.account.settings.confirmDelete"))) return;

    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success(t("auth.account.settings.deleteSuccess"));
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (error) {
      toast.error(t("auth.account.saveError"));
    }
  };

  const handleEdit = (address: Address) => {
    setFormData(address);
    setEditingId(address.id);
    setShowForm(true);
  };

  if (loading) {
    return <div className="py-8 text-center">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} size="sm" variant="outline">
          <Plus className="mr-2 size-4" />
          {t("auth.account.settings.addAddress")}
        </Button>
      ) : null}

      {/* Form */}
      {showForm && (
        <Card className="border border-border/40 p-6">
          <h3 className="mb-6 font-display text-xl text-foreground">
            {editingId
              ? t("auth.account.settings.editAddress")
              : t("auth.account.settings.newAddress")}
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="label">{t("auth.fields.label")}</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder={t("auth.account.settings.labelPlaceholder")}
                maxLength={50}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="fullName">{t("auth.fields.fullName")}</Label>
              <Input
                id="fullName"
                value={formData.full_name || ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                maxLength={100}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">{t("auth.fields.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                maxLength={20}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">{t("auth.fields.address")}</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                maxLength={200}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">{t("auth.fields.city")}</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  maxLength={100}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="postalCode">{t("auth.fields.postalCode")}</Label>
                <Input
                  id="postalCode"
                  value={formData.postal_code || ""}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  maxLength={20}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">{t("auth.fields.country")}</Label>
              <Input
                id="country"
                value={formData.country || ""}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                maxLength={100}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.is_default || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_default: checked as boolean })
                }
              />
              <Label htmlFor="isDefault" className="cursor-pointer text-sm font-normal">
                {t("auth.account.settings.setDefault")}
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t("auth.account.saving") : t("auth.account.saveChanges")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    label: "",
                    full_name: "",
                    phone: "",
                    address: "",
                    city: "",
                    postal_code: "",
                    country: "España",
                    is_default: false,
                  });
                }}
                disabled={saving}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Address List */}
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address.id} className="border border-border/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{address.label}</h4>
                    {address.is_default && (
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded text-primary">
                        {t("auth.account.settings.default")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground">{address.full_name}</p>
                  <p className="text-sm text-muted-foreground">{address.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.postal_code} {address.city}
                  </p>
                  <p className="text-sm text-muted-foreground">{address.country}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(address)}>
                    {t("common.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(address.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !showForm ? (
        <p className="py-8 text-center text-muted-foreground">
          {t("auth.account.settings.noAddresses")}
        </p>
      ) : null}
    </div>
  );
}
