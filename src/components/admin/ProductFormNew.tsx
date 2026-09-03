import { useState } from "react";
import { CreateProductRequest, ProductWithOptions } from "~/integrations/supabase/types";
import ProductOptionsSection from "./ProductOptionsSection";
import ColorVariantsSection from "./ColorVariantsSection";
import ProductImagesSection from "./ProductImagesSection";

interface ProductFormNewProps {
  initialProduct?: ProductWithOptions | null;
  onSubmit: (data: CreateProductRequest) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function ProductFormNew({
  initialProduct,
  onSubmit,
  isLoading = false,
  error,
}: ProductFormNewProps) {
  const [formData, setFormData] = useState<CreateProductRequest>(
    initialProduct
      ? {
          name: initialProduct.name,
          description: initialProduct.description,
          category: (initialProduct.category || "ramos") as any,
          active: initialProduct.active,
          cover_image_url: initialProduct.cover_image_url,
          has_color_variants: initialProduct.has_color_variants,
          options: initialProduct.options.map((opt) => ({
            name: opt.name,
            price_amount: parseFloat(opt.price_amount.toString()),
            discount_percent: parseFloat(opt.discount_percent.toString()),
            stock_quantity: opt.stock_quantity,
          })),
          color_variants: initialProduct.color_variants.map((cv) => cv.name),
        }
      : {
          name: "",
          description: "",
          category: "ramos",
          active: true,
          cover_image_url: "",
          has_color_variants: false,
          options: [],
          color_variants: [],
        },
  );

  const [options, setOptions] = useState(initialProduct?.options || []);
  const [colorVariants, setColorVariants] = useState(initialProduct?.color_variants || []);
  const [images, setImages] = useState(initialProduct?.images || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("El nombre del producto es requerido");
      return;
    }

    if (options.length === 0) {
      alert("Debe agregar al menos una opción");
      return;
    }

    try {
      await onSubmit({
        ...formData,
        options: options.map((opt) => ({
          name: opt.name,
          price_amount: parseFloat(opt.price_amount.toString()),
          discount_percent: parseFloat(opt.discount_percent.toString()),
          stock_quantity: opt.stock_quantity,
        })),
        color_variants: colorVariants.map((cv) => cv.name),
      });
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Información Básica</legend>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nombre del Producto *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Categoría
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => {
              const newCategory = e.target.value as any;
              setFormData({
                ...formData,
                category: newCategory,
                has_color_variants:
                  newCategory === "rosas-eternas" ? formData.has_color_variants : false,
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="ramos">Ramos</option>
            <option value="plantas">Plantas</option>
            <option value="rosas-eternas">Rosas Eternas</option>
            <option value="complementos">Complementos</option>
            <option value="condolencias">Condolencias</option>
          </select>
        </div>

        <div>
          <label htmlFor="cover_image_url" className="block text-sm font-medium mb-1">
            URL Imagen de Portada
          </label>
          <input
            id="cover_image_url"
            type="url"
            value={formData.cover_image_url || ""}
            onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="mr-2"
            />
            Producto Activo
          </label>

          {formData.category === "rosas-eternas" && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.has_color_variants}
                onChange={(e) => setFormData({ ...formData, has_color_variants: e.target.checked })}
                className="mr-2"
              />
              Tiene Variantes de Color
            </label>
          )}
        </div>
      </fieldset>

      <ProductOptionsSection
        options={options}
        onAdd={(option) => setOptions([...options, option])}
        onUpdate={(optionId, updates) => {
          setOptions(options.map((opt) => (opt.id === optionId ? { ...opt, ...updates } : opt)));
        }}
        onDelete={(optionId) => {
          setOptions(options.filter((opt) => opt.id !== optionId));
        }}
        category={formData.category}
      />

      {formData.has_color_variants && formData.category === "rosas-eternas" && (
        <ColorVariantsSection
          colors={colorVariants}
          onAdd={(colorName) => {
            setColorVariants([
              ...colorVariants,
              {
                id: `temp-${Date.now()}`,
                product_id: initialProduct?.id || "",
                name: colorName,
                sort_order: colorVariants.length,
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);
          }}
          onDelete={(colorId) => {
            setColorVariants(colorVariants.filter((cv) => cv.id !== colorId));
          }}
        />
      )}

      <ProductImagesSection
        images={images}
        colorVariants={formData.has_color_variants ? colorVariants : undefined}
        onAdd={(image) => {
          setImages([
            ...images,
            {
              id: `temp-${Date.now()}`,
              ghl_product_id: initialProduct?.ghl_product_id || "",
              product_id: initialProduct?.id || null,
              color_variant_id: image.colorVariantId || null,
              storage_path: "",
              image_url: image.url,
              alt_text: null,
              sort_order: images.length,
              is_primary: image.isPrimary,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
        }}
        onDelete={(imageId) => {
          setImages(images.filter((img) => img.id !== imageId));
        }}
        onSetPrimary={(imageId) => {
          setImages(
            images.map((img) => ({
              ...img,
              is_primary: img.id === imageId,
            })),
          );
        }}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Guardando..." : "Guardar Producto"}
        </button>
      </div>
    </form>
  );
}
