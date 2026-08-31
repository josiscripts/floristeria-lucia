import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, Flower2, BarChart3, Webhook, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { company } from "@/data/company";

interface NavItem {
  label: string;
  to?: string;
  icon: typeof LayoutDashboard;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Pedidos", to: "/admin/orders", icon: Package },
  { label: "Productos", to: "/admin/products", icon: Flower2 },
  { label: "Reportes", to: "/admin/reports", icon: BarChart3 },
  { label: "Webhooks", to: "/admin/webhooks", icon: Webhook },
  { label: "Configuración", to: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2 px-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 font-display text-lg text-primary">
            L
          </span>
          <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm text-foreground">{company.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Panel admin
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = item.to ? pathname.startsWith(item.to) : false;

                if (item.comingSoon || !item.to) {
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        disabled
                        className="cursor-not-allowed opacity-50"
                        tooltip={`${item.label} (próximamente)`}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
