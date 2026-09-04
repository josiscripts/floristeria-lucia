import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/context/LanguageContext";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutConfirmDialog({ open, onOpenChange }: LogoutConfirmDialogProps) {
  const t = useT();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      toast.success(t("auth.account.logoutSuccess"));
      navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(t("auth.account.logoutError"));
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.account.logout.title")}</DialogTitle>
          <DialogDescription>{t("auth.account.logout.description")}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoggingOut}>
            {t("auth.account.logout.stay")}
          </Button>
          <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? t("auth.account.logout.logging") : t("auth.account.logout.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
