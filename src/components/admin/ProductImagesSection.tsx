import { useState } from "react";
import { ProductImage, ColorVariant } from "~/integrations/supabase/types";

interface ProductImagesSectionProps {
  images: ProductImage[];
  colorVariants?: ColorVariant[];
  onAdd: (image: { url: string; colorVariantId?: string; isPrimary: boolean }) => void;
  onDelete: (imageId: string) => void;
  onSetPrimary: (imageId: string) => void;
  maxImages?: number;
}

export default function ProductImagesSection({
  images,
  colorVariants,
  onAdd,
  onDelete,
  onSetPrimary,
  maxImages = 10,
}: ProductImagesSectionProps) {
  const [newImageUrl, setNewImageUrl] = useState("");
  const [selectedColorVariant, setSelectedColorVariant] = useState<string>("");
  const [makeImagePrimary, setMakeImagePrimary] = useState(false);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      alert("Ingrese una URL de imagen");
      return;
    }

    if (images.length >= maxImages) {
      alert(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    onAdd({
      url: newImageUrl,
      colorVariantId: selectedColorVariant || undefined,
      isPrimary: makeImagePrimary,
    });

    setNewImageUrl("");
    setSelectedColorVariant("");
    setMakeImagePrimary(false);
  };

  const canAddMore = images.length < maxImages;

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-semibold">
        Imágenes del Producto ({images.length}/{maxImages})
      </legend>

      <div className="grid grid-cols-3 gap-4">
        {images.length === 0 ? (
          <div className="col-span-3 text-center text-gray-500 py-8">
            No hay imágenes. Agrega una abajo.
          </div>
        ) : (
          images.map((image) => (
            <div key={image.id} className="border border-gray-300 rounded-md overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {image.image_url ? (
                  <img
                    src={image.image_url}
                    alt={image.alt_text || "Product image"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400">Sin imagen</span>
                )}
              </div>
              <div className="p-3 space-y-2">
                {image.is_primary && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Primaria
                  </span>
                )}
                <p className="text-sm text-gray-600 line-clamp-2">{image.image_url}</p>
                <div className="flex gap-2">
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(image.id)}
                      className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Primaria
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(image.id)}
                    className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {canAddMore && (
        <div className="border border-gray-300 rounded-md p-4 space-y-3">
          <h3 className="font-semibold">Agregar Nueva Imagen</h3>
          <div>
            <label className="block text-sm font-medium mb-1">URL de Imagen</label>
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {colorVariants && colorVariants.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Color Asociado (opcional)</label>
              <select
                value={selectedColorVariant}
                onChange={(e) => setSelectedColorVariant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Ninguno (imagen general)</option>
                {colorVariants.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={makeImagePrimary}
              onChange={(e) => setMakeImagePrimary(e.target.checked)}
              className="mr-2"
            />
            Establecer como imagen primaria
          </label>

          <button
            type="button"
            onClick={handleAddImage}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Agregar Imagen
          </button>
        </div>
      )}

      {!canAddMore && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Has alcanzado el límite máximo de {maxImages} imágenes.
        </div>
      )}
    </fieldset>
  );
}
