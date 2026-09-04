import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import { Chrome } from "lucide-react";

interface CuentasVinculadasProps {
  user: User;
}

export function CuentasVinculadasSection({ user }: CuentasVinculadasProps) {
  const t = useT();

  return (
    <div className="space-y-6">
      <Card className="border border-border/40 p-6">
        <h3 className="mb-6 font-display text-xl text-foreground">
          {t("auth.account.settings.linkedAccounts")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/40 p-4">
            <div className="flex items-center gap-3">
              <Chrome className="size-5 text-foreground" />
              <div>
                <p className="font-medium">{t("auth.account.settings.googleAccount")}</p>
                <p className="text-sm text-muted-foreground">
                  {user.user_metadata?.email || t("auth.account.settings.notLinked")}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" disabled>
              {t("auth.account.settings.linked")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
