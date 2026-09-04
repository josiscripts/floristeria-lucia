import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { createProductNew } from "@/lib/admin/api";
import { syncProductImages } from "@/lib/product-images-sync";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await createProductNew({
        name: values.name,
        description: values.description,
        category: values.category,
        active: values.active,
        cover_image_url: values.cover_image_url,
        has_color_variants: values.has_color_variants,
        options: values.options,
        color_variants: values.color_variants,
      });

      const productId = (response as any).product?.id;
      if (productId && values.images.length > 0) {
        await syncProductImages(productId, [], values.images);
      }

      const productName = values.name || "Producto";
      toast.success(`${productName} creado correctamente`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      navigate({ to: "/admin/products" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el producto";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/products">
            <ArrowLeft className="size-4" />
            Volver a productos
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-display text-2xl text-foreground">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">
          Producto nuevo con opciones de precio, imágenes y variantes de color.
        </p>
      </div>

      <ProductForm
        isNew={true}
        onSubmit={handleSubmit}
        isLoading={submitting}
        error={error}
      />
    </div>
  );
}
