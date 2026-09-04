import { useState } from "react";
import { Upload, Trash2, Star, Copy, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import type { Tables } from "@/integrations/supabase/types";

type ProductImage = Tables<"product_images">;

interface ProductImage {
  id: string;
  image_url: string | null;
  is_primary: boolean;
  alt_text?: string | null;
  sort_order?: number;
}

interface ProductImagesEditorProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export function ProductImagesEditor({
  images,
  onImagesChange,
  maxImages = 10,
}: ProductImagesEditorProps) {
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newAltText, setNewAltText] = useState("");
  const [makePrimary, setMakePrimary] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAddMore = images.length < maxImages;

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddImage = () => {
    setError(null);

    if (!newImageUrl.trim()) {
      setError("Por favor ingresa una URL de imagen");
      return;
    }

    if (!validateUrl(newImageUrl.trim())) {
      setError("Por favor ingresa una URL válida (ej: https://ejemplo.com/imagen.jpg)");
      return;
    }

    if (!canAddMore) {
      setError(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    // If making this primary, remove primary from others
    const updatedImages = makePrimary
      ? images.map((img) => ({ ...img, is_primary: false }))
      : images;

    const newImage: ProductImage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      image_url: newImageUrl.trim(),
      is_primary: makePrimary || images.length === 0, // First image is primary by default
      alt_text: newAltText.trim() || null,
      sort_order: images.length,
    };

    onImagesChange([...updatedImages, newImage]);

    // Reset form
    setNewImageUrl("");
    setNewAltText("");
    setMakePrimary(false);
  };

  const handleSetPrimary = (id: string) => {
    onImagesChange(
      images.map((img) => ({
        ...img,
        is_primary: img.id === id,
      })),
    );
  };

  const handleDeleteImage = (id: string) => {
    const updated = images.filter((img) => img.id !== id);

    // Ensure there's always a primary image if images exist
    if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
      updated[0].is_primary = true;
    }

    onImagesChange(updated);
  };

  const handleReorder = (id: string, direction: "up" | "down") => {
    const index = images.findIndex((img) => img.id === id);
    if (direction === "up" && index > 0) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      onImagesChange(newImages.map((img, i) => ({ ...img, sort_order: i })));
    } else if (direction === "down" && index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      onImagesChange(newImages.map((img, i) => ({ ...img, sort_order: i })));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddImage();
    }
  };

  const primaryImage = images.find((img) => img.is_primary);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          Imágenes ({images.length}/{maxImages})
        </h3>
        {images.length > 0 && (
          <Badge variant="outline">
            {images.length} de {maxImages}
          </Badge>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">
            No hay imágenes. Agrega una a continuación.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {primaryImage && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Imagen Primaria</Label>
              <div className="relative group overflow-hidden rounded-lg border-2 border-primary bg-muted">
                {primaryImage.image_url ? (
                  <img
                    src={primaryImage.image_url}
                    alt={primaryImage.alt_text || "Imagen primaria"}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                    Sin imagen
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    Primaria
                  </Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">
                    {primaryImage.alt_text || primaryImage.image_url}
                  </p>
                </div>
              </div>
            </div>
          )}

          {images.filter((img) => !img.is_primary).length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Imágenes Secundarias ({images.filter((img) => !img.is_primary).length})
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images
                  .filter((img) => !img.is_primary)
                  .map((image, index) => (
                    <div
                      key={image.id}
                      className="relative group overflow-hidden rounded-lg border bg-muted"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverId(image.id);
                      }}
                      onDragLeave={() => setDragOverId(null)}
                    >
                      {image.image_url ? (
                        <img
                          src={image.image_url}
                          alt={image.alt_text || `Imagen ${index + 2}`}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center text-muted-foreground">
                          Sin imagen
                        </div>
                      )}

                      <div
                        className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 flex-wrap p-1 ${
                          dragOverId === image.id ? "opacity-100 bg-blue-500/50" : ""
                        }`}
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-white hover:bg-white/20"
                          onClick={() => handleSetPrimary(image.id)}
                          title="Establecer como imagen primaria"
                        >
                          <Star className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-white hover:bg-white/20"
                          onClick={() => {
                            navigator.clipboard.writeText(image.image_url || "");
                          }}
                          title="Copiar URL"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDeleteImage(image.id)}
                          title="Eliminar imagen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!canAddMore && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Has alcanzado el límite máximo de {maxImages} imágenes.
          </AlertDescription>
        </Alert>
      )}

      {canAddMore && (
        <Card className="p-4 space-y-4 bg-muted/30">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Agregar Nueva Imagen</h3>
            <p className="text-xs text-muted-foreground">
              Por URL. Asegúrate de que la URL sea válida y la imagen sea accesible.
            </p>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-image-url" className="text-xs">
                URL de Imagen *
              </Label>
              <Input
                id="new-image-url"
                type="url"
                value={newImageUrl}
                onChange={(e) => {
                  setNewImageUrl(e.target.value);
                  if (error) setError(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="https://ejemplo.com/imagen.jpg"
                size="sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-image-alt" className="text-xs">
                Texto Alternativo (opcional)
              </Label>
              <Input
                id="new-image-alt"
                type="text"
                value={newAltText}
                onChange={(e) => setNewAltText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Descripción de la imagen"
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="make-primary"
                checked={makePrimary}
                onChange={(e) => setMakePrimary(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="make-primary" className="text-xs cursor-pointer">
                Establecer como imagen primaria
              </Label>
            </div>

            <Button type="button" onClick={handleAddImage} className="w-full" variant="secondary">
              <Upload className="mr-2 h-4 w-4" />
              Agregar Imagen
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
