import { supabase } from "@/integrations/supabase/client";

export async function uploadProductImage(file: File): Promise<string> {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${file.name}`;
  const filePath = `products/${fileName}`;

  console.log("[uploadProductImage] Uploading file:", fileName);

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[uploadProductImage] Upload failed:", error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }

  // Get the public URL
  const { data: publicData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  console.log("[uploadProductImage] Upload successful:", publicData.publicUrl);
  return publicData.publicUrl;
}
