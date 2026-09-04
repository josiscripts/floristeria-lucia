import { useEffect, useState } from "react";
import { Heart, Package, ArrowRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

interface AccountTabContentProps {
  user: User;
  favorites: string[];
}

export function AccountTabContent({ user, favorites }: AccountTabContentProps) {
  const t = useT();
  const { session } = useAuth();
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        if (!session) {
          setLoading(false);
          return;
        }

        const response = await fetch("/api/account/orders", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const responseData = await response.json();
          setOrderCount(responseData.orders?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching order count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderCount();
  }, [session]);

  return (
    <div className="space-y-8">
      {/* Personal Info Card */}
      <Card className="border border-border/40 p-6 sm:p-8">
        <h2 className="mb-6 font-display text-2xl text-foreground">
          {t("auth.account.personalInfo")}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              {t("auth.account.email")}
            </label>
            <p className="mt-1 text-lg text-foreground">{user.email}</p>
          </div>
        </div>
      </Card>

      {/* Quick Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Orders Summary */}
        <Card className="border border-border/40 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.35em] text-primary uppercase">
                {t("auth.account.orders")}
              </p>
              <p className="mt-2 text-4xl font-display text-foreground">
                {loading ? "—" : orderCount}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("auth.account.ordersDescription")}
              </p>
            </div>
            <Package className="size-8 text-primary/50" strokeWidth={1.5} />
          </div>
          <Button variant="ghost" size="sm" asChild className="mt-4 -mx-2">
            <a href="#orders">
              {t("common.view")} <ArrowRight className="ml-1 size-4" />
            </a>
          </Button>
        </Card>

        {/* Favorites Summary */}
        <Card className="border border-border/40 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.35em] text-primary uppercase">
                {t("auth.account.favorites")}
              </p>
              <p className="mt-2 text-4xl font-display text-foreground">{favorites.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("auth.account.favoritesDescription")}
              </p>
            </div>
            <Heart className="size-8 text-primary/50" strokeWidth={1.5} />
          </div>
          <Button variant="ghost" size="sm" asChild className="mt-4 -mx-2">
            <a href="#favorites">
              {t("common.view")} <ArrowRight className="ml-1 size-4" />
            </a>
          </Button>
        </Card>
      </div>
    </div>
  );
}
