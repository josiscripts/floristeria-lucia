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
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { LoadingState } from "@/components/admin/LoadingState";
import { ErrorState } from "@/components/admin/ErrorState";
import { fetchProductByIdNew, updateProductNew, deactivateProductNew } from "@/lib/admin/api";
import { syncProductImages } from "@/lib/product-images-sync";

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
    queryFn: () => fetchProductByIdNew(id),
  });

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      const originalImages = data?.product.product_images || [];

      await updateProductNew(id, {
        name: values.name,
        description: values.description,
        category_id: values.category,
        active: values.active,
        cover_image_url: values.cover_image_url,
        has_color_variants: values.has_color_variants,
      });

      if (values.images.length > 0 || originalImages.length > 0) {
        await syncProductImages(id, originalImages, values.images);
      }

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
      await deactivateProductNew(id);
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

        {data?.product.active && (
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
                  revertir editándolo nuevamente.
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
          </div>

          <ProductForm
            initialProduct={{
              id: id,
              name: data.product.name,
              description: data.product.description,
              category: data.product.category_id || undefined,
              active: data.product.active,
              cover_image_url: data.product.cover_image_url,
              has_color_variants: data.product.has_color_variants,
              options: data.product.product_options,
              images: data.product.product_images,
              color_variants: data.product.color_variants,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: null,
            } as any}
            onSubmit={handleSubmit}
            isLoading={submitting}
          />
        </>
      )}
    </div>
  );
}
