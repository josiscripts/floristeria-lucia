import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GHLStatusBadge } from "@/components/admin/GHLStatusBadge";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { LoadingState } from "@/components/admin/LoadingState";
import { ErrorState } from "@/components/admin/ErrorState";
import { fetchProductById, updateProduct, deactivateProduct } from "@/lib/admin/api";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => fetchProductById(id),
  });

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      await updateProduct(id, values);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "product", id] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
      ]);
      toast.success("Producto actualizado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el producto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateProduct(id);
      toast.success("Producto desactivado correctamente");
      navigate({ to: "/admin/products" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar el producto");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/products">
            <ArrowLeft className="size-4" />
            Volver a productos
          </Link>
        </Button>

        {data?.product.status === "active" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" />
                Desactivar producto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Desactivar este producto?</AlertDialogTitle>
                <AlertDialogDescription>
                  El producto dejará de estar disponible en la tienda pública. Esta acción se puede
                  revertir editándolo de nuevo en GoHighLevel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleDeactivate()} disabled={deactivating}>
                  {deactivating ? "Desactivando..." : "Desactivar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {isLoading && <LoadingState rows={5} />}

      {isError && (
        <ErrorState
          message={error instanceof Error ? error.message : "Error desconocido"}
          onRetry={() => void refetch()}
        />
      )}

      {data && (
        <>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl text-foreground">{data.product.name}</h1>
            <GHLStatusBadge status={data.product.status} />
          </div>

          <ProductForm
            initialValues={{
              name: data.product.name,
              description: data.product.description,
              price: data.product.price,
              category: data.product.category,
              image: data.product.image,
              sku: data.product.sku,
              price_max: data.metadata?.price_max ?? undefined,
              badge_label: data.metadata?.badge_label ?? undefined,
              rose_step: data.metadata?.rose_step ?? undefined,
              available_colors: data.metadata?.available_colors ?? undefined,
              requires_quote: data.metadata?.requires_quote ?? undefined,
            }}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Guardar cambios"
          />
        </>
      )}
    </div>
  );
}
