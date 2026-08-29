import { useState } from "react";

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
import { categoryLabels } from "@/data/catalog";
import type { ProductFormInput } from "@/lib/admin/api";

export interface ProductFormValues extends ProductFormInput {
  requires_quote: boolean | undefined;
}

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  submitting: boolean;
  submitLabel: string;
}

const CATEGORY_OPTIONS = Object.values(categoryLabels);

export function ProductForm({
  initialValues,
  onSubmit,
  submitting,
  submitLabel,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [price, setPrice] = useState(
    initialValues?.price !== undefined ? String(initialValues.price) : "",
  );
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [image, setImage] = useState(initialValues?.image ?? "");
  const [sku, setSku] = useState(initialValues?.sku ?? "");
  const [priceMax, setPriceMax] = useState(
    initialValues?.price_max !== undefined ? String(initialValues.price_max) : "",
  );
  const [badgeLabel, setBadgeLabel] = useState(initialValues?.badge_label ?? "");
  const [roseStep, setRoseStep] = useState(
    initialValues?.rose_step !== undefined ? String(initialValues.rose_step) : "",
  );
  const [colors, setColors] = useState((initialValues?.available_colors ?? []).join(", "));
  const [requiresQuote, setRequiresQuote] = useState(Boolean(initialValues?.requires_quote));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const values: ProductFormValues = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: price ? Number(price) : undefined,
      category: category || undefined,
      image: image.trim() || undefined,
      sku: sku.trim() || undefined,
      price_max: priceMax ? Number(priceMax) : undefined,
      badge_label: badgeLabel.trim() || undefined,
      rose_step: roseStep ? Number(roseStep) : undefined,
      available_colors: colors
        ? colors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : undefined,
      requires_quote: requiresQuote,
    };

    void onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Información del producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="product-name">Nombre *</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-description">Descripción</Label>
              <Textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="product-price">Precio (€)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-price-max">Precio máximo (€)</Label>
                <Input
                  id="product-price-max"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </div>
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
                <Label htmlFor="product-sku">SKU</Label>
                <Input id="product-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-image">URL de imagen</Label>
              <Input
                id="product-image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Metadata (Supabase)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="product-badge">Etiqueta destacada</Label>
              <Input
                id="product-badge"
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="Ej. Más vendido"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-rose-step">Incremento (rosas)</Label>
              <Input
                id="product-rose-step"
                type="number"
                min="0"
                value={roseStep}
                onChange={(e) => setRoseStep(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-colors">Colores disponibles</Label>
              <Input
                id="product-colors"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="rojo, blanco, rosa"
              />
              <p className="text-xs text-muted-foreground">Separados por comas.</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="product-quote">Solo bajo presupuesto</Label>
                <p className="text-xs text-muted-foreground">
                  No muestra precio fijo, requiere consulta.
                </p>
              </div>
              <Switch
                id="product-quote"
                checked={requiresQuote}
                onCheckedChange={setRequiresQuote}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={submitting || !name.trim()}>
          {submitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
