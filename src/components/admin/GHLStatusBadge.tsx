import { cn } from "@/lib/utils";

export function GHLStatusBadge({ status }: { status: string | undefined }) {
  const isActive = status === "active";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        isActive
          ? "border-green-200 bg-green-100 text-green-800"
          : "border-neutral-200 bg-neutral-100 text-neutral-600",
      )}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}
