import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import { AlertCircle } from "lucide-react";

export function MetodosPagoSection() {
  const t = useT();

  return (
    <div className="space-y-6">
      <Card className="border border-border/40 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="mt-1 size-5 flex-shrink-0 text-amber-500" />
          <div className="flex-1">
            <h3 className="font-display text-lg text-foreground">
              {t("auth.account.settings.paymentMethods")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.account.settings.paymentMethodsDescription")}
            </p>
            <Button size="sm" className="mt-4" disabled>
              {t("auth.account.settings.connectStripe")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
