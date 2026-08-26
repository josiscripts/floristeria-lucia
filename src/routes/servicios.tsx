import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/servicios")({
  component: ServicesLayout,
});

function ServicesLayout() {
  return <Outlet />;
}
