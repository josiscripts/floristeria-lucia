import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import ProductFormNew from "@/components/admin/ProductFormNew";
import { createProductNew, type CreateProductRequest } from "@/lib/admin/api";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: CreateProductRequest) => {
    setSubmitting(true);
    setError(null);
    try {
      await createProductNew(values);
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
          Se creará en GoHighLevel y su metadata en Supabase.
        </p>
      </div>

      <ProductFormNew onSubmit={handleSubmit} isLoading={submitting} error={error} />
    </div>
  );
}
