import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Store } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function AdminHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <p className="font-display text-sm text-foreground">Panel administrativo</p>
      <div className="ml-auto flex items-center gap-3">
        {user?.email && (
          <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <Store className="size-4" />
            <span className="hidden sm:inline">Ver mi tienda</span>
            <span className="sm:hidden">Tienda</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
          <LogOut className="size-4" />
          Salir
        </Button>
      </div>
    </header>
  );
}
