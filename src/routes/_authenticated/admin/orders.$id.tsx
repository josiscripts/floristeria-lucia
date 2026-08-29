import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderDetail } from "@/components/admin/OrderDetail";
import { LoadingState } from "@/components/admin/LoadingState";
import { ErrorState } from "@/components/admin/ErrorState";
import { fetchOrderById } from "@/lib/admin/api";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => fetchOrderById(id),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/orders">
            <ArrowLeft className="size-4" />
            Volver a pedidos
          </Link>
        </Button>
      </div>

      {isLoading && <LoadingState rows={5} />}

      {isError && (
        <ErrorState
          message={error instanceof Error ? error.message : "Error desconocido"}
          onRetry={() => void refetch()}
        />
      )}

      {data && <OrderDetail order={data.order} items={data.items} events={data.events} />}
    </div>
  );
}
