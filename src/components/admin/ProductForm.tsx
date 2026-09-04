import { useState } from "react";
import { AlertCircle, Loader2, Check, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { categoryLabels } from "@/data/catalog";
import { ProductOptionsEditor } from "./ProductOptionsEditor";
import { ProductImagesEditor } from "./ProductImagesEditor";

import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type ProductOption = Tables<"product_options">;
type ProductImage = Tables<"product_images">;
type ColorVariant = Tables<"color_variants">;

export interface ProductFormValues {
  name: string;
  description?: string;
  category?: string;
  active: boolean;
  cover_image_url?: string;
  has_color_variants: boolean;
  options: Array<{
    name: string;
    price_amount: number;
    discount_percent?: number;
    stock_quantity?: number | null;
  }>;
  color_variants?: string[];
}

interface ProductFormProps {
  initialProduct?: (Product & {
    options: ProductOption[];
    images: ProductImage[];
    color_variants: ColorVariant[];
  }) | null;
  isNew?: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  syncStatus?: "synchronized" | "pending" | "error" | null;
}

const CATEGORY_OPTIONS = Object.values(categoryLabels);

export function ProductForm({
  initialProduct,
  isNew = false,
  onSubmit,
  isLoading = false,
  error,
  syncStatus,
}: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? "");
  const [active, setActive] = useState(initialProduct?.active ?? true);
  const [coverImageUrl, setCoverImageUrl] = useState(initialProduct?.cover_image_url ?? "");
  const [hasColorVariants, setHasColorVariants] = useState(
    initialProduct?.has_color_variants ?? false
  );

  const [options, setOptions] = useState<ProductOption[]>(initialProduct?.options ?? []);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(
    initialProduct?.color_variants ?? []
  );
  const [images, setImages] = useState<ProductImage[]>(initialProduct?.images ?? []);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "El nombre del producto es requerido";
    }

    if (options.length === 0) {
      errors.options = "Debe agregar al menos una opción de producto";
    }

    if (hasColorVariants && colorVariants.length === 0) {
      errors.colorVariants = "Debe agregar al menos una variante de color";
    }

    if (images.length === 0 && isNew) {
      errors.images = "Debe agregar al menos una imagen";
    }

    const primaryImages = images.filter((img) => img.is_primary);
    if (images.length > 0 && primaryImages.length === 0) {
      errors.images = "Debe marcar una imagen como primaria";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const values: ProductFormValues = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        active,
        cover_image_url: coverImageUrl.trim() || undefined,
        has_color_variants: hasColorVariants,
        options: options.map((opt) => ({
          name: opt.name,
          price_amount: Number(opt.price_amount),
          discount_percent: opt.discount_percent ? Number(opt.discount_percent) : 0,
          stock_quantity: opt.stock_quantity,
        })),
        color_variants: colorVariants.map((cv) => cv.name),
      };

      await onSubmit(values);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  const getSyncStatusDisplay = () => {
    if (!syncStatus) return null;

    const statusConfig = {
      synchronized: {
        icon: Check,
        label: "Sincronizado",
        className: "bg-green-50 border-green-200",
        badgeVariant: "default" as const,
      },
      pending: {
        icon: AlertTriangle,
        label: "Pendiente de sincronización",
        className: "bg-yellow-50 border-yellow-200",
        badgeVariant: "secondary" as const,
      },
      error: {
        icon: AlertCircle,
        label: "Error en sincronización",
        className: "bg-red-50 border-red-200",
        badgeVariant: "destructive" as const,
      },
    };

    const config = statusConfig[syncStatus];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Alert className={`border ${config.className}`}>
        <Icon className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
          {syncStatus === "error" && (
            <span className="text-sm text-muted-foreground">
              La sincronización con GHL tendrá lugar en el próximo ciclo
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {getSyncStatusDisplay()}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="product-name">Nombre del Producto *</Label>
                <Input
                  id="product-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) {
                      setFormErrors({ ...formErrors, name: "" });
                    }
                  }}
                  placeholder="ej: Ramo de Rosas Rojas"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-description">Descripción</Label>
                <Textarea
                  id="product-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe las características del producto..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="product-category">Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="product-category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="product-active" className="flex items-center gap-2">
                    Estado
                  </Label>
                  <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                    <Switch id="product-active" checked={active} onCheckedChange={setActive} />
                    <span className="text-sm">{active ? "Activo" : "Inactivo"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-cover-image">URL de Imagen de Portada</Label>
                <Input
                  id="product-cover-image"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">SKU</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                El SKU se genera automáticamente basado en el ID del producto y opciones.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">SKU automático</p>
                <p className="text-xs text-muted-foreground">
                  Se generará al guardar el producto con sus opciones.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Opciones / Precios</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductOptionsEditor options={options} onOptionsChange={setOptions} />
              {formErrors.options && (
                <p className="text-xs text-red-600 mt-3">{formErrors.options}</p>
              )}
            </CardContent>
          </Card>

          {category === "rosas-eternas" && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Variantes de Color</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    id="has-color-variants"
                    checked={hasColorVariants}
                    onCheckedChange={setHasColorVariants}
                  />
                  <Label htmlFor="has-color-variants" className="text-sm">
                    Este producto tiene variantes de color
                  </Label>
                </div>
              </CardHeader>
              {hasColorVariants && (
                <CardContent>
                  <div className="space-y-4">
                    {colorVariants.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Agrega variantes de color para este producto
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {colorVariants.map((variant) => (
                          <li key={variant.id} className="flex items-center justify-between">
                            <span className="text-sm">{variant.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setColorVariants(colorVariants.filter((cv) => cv.id !== variant.id))
                              }
                            >
                              Eliminar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              )}
              {formErrors.colorVariants && (
                <CardContent>
                  <p className="text-xs text-red-600">{formErrors.colorVariants}</p>
                </CardContent>
              )}
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Imágenes</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImagesEditor images={images} onImagesChange={setImages} />
              {formErrors.images && (
                <p className="text-xs text-red-600 mt-3">{formErrors.images}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {isNew ? "Crear Producto" : "Guardar Cambios"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
