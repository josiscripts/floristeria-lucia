import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a product image to Supabase Storage
 *
 * Requirements:
 * - Supabase Storage bucket 'product-images' must exist
 * - Authenticated users must have upload permissions
 *
 * @param file - The image file to upload
 * @returns - Public URL of the uploaded image
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen válida");
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${file.name}`;
  const filePath = `products/${fileName}`;

  console.log("[uploadProductImage] Starting upload:", { fileName, fileSize: file.size });

  try {
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[uploadProductImage] Upload failed:", error);

      // Provide more specific error messages
      if (error.message.includes("not found")) {
        throw new Error("El bucket de almacenamiento no está configurado. Contacta al administrador.");
      }
      if (error.message.includes("permission")) {
        throw new Error("No tienes permisos para subir imágenes. Contacta al administrador.");
      }

      throw new Error(`Error al subir imagen: ${error.message}`);
    }

    console.log("[uploadProductImage] Upload complete, file path:", filePath);

    // Get the public URL
    const { data: publicData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      throw new Error("No se pudo obtener la URL pública de la imagen");
    }

    console.log("[uploadProductImage] Upload successful:", publicData.publicUrl);
    return publicData.publicUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al subir la imagen";
    console.error("[uploadProductImage] Exception:", message);
    throw err;
  }
}
