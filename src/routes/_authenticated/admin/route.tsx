import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  // Autorización de UX: la ruta padre `/_authenticated` ya garantiza sesión
  // válida; aquí se comprueba además el rol. Esto solo evita navegación
  // accidental — la protección real vive en cada API (ver src/lib/admin/guard.server.ts),
  // porque este layout se renderiza con ssr:false (heredado de `/_authenticated`)
  // y por tanto `beforeLoad` se ejecuta en el navegador, no en el servidor.
  beforeLoad: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw redirect({ to: "/auth" });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      throw redirect({ to: "/" });
    }

    return { adminRole: profile.role };
  },
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1 bg-muted/20 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
