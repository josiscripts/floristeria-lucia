import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/admin/api";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      const result = await createProduct(values);
      toast.success(`Producto "${result.product.name}" creado correctamente`);
      navigate({ to: "/admin/products" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el producto");
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
          Se creará en GoHighLevel y su metadata en Supabase.
        </p>
      </div>

      <ProductForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Crear producto" />
    </div>
  );
}
