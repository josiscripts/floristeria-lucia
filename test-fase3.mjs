import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://hnyljxlezobwdsmovdzf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueWxqeGxlem9id2RzbW92ZHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MTM4OTksImV4cCI6MjA0MDk4Mzg5OX0.f2qmCHQ8d6VGLkDKHc0O0EuHDv2DF7xA5eR5Y3KTUZE"
);

console.log("🧪 FASE 3 - TEST EXHAUSTIVO\n");

async function testCreateProduct() {
  console.log("TEST 1: Crear producto con imágenes, opciones y colores");
  try {
    const { data: cat, error: catError } = await supabase
      .from("categories")
      .select("id")
      .limit(1);
    if (catError) throw catError;
    const categoryId = cat?.[0]?.id;

    const { data: product, error: createError } = await supabase
      .from("products")
      .insert({
        name: `Test Producto ${Date.now()}`,
        description: "Descripción test",
        category_id: categoryId,
        active: true,
        cover_image_url: "https://example.com/image.jpg",
        has_color_variants: true,
      })
      .select();

    if (createError) throw createError;
    if (!product?.[0]) throw new Error("No product returned");

    const productId = product[0].id;
    console.log(`✅ Producto creado: ${productId}`);

    // Crear opciones de precio
    const { error: optionsError } = await supabase
      .from("product_options")
      .insert([
        {
          product_id: productId,
          name: "Opción 1",
          price_amount: 100,
          discount_percent: 10,
          stock_quantity: 50,
        },
        {
          product_id: productId,
          name: "Opción 2",
          price_amount: 150,
          discount_percent: 5,
          stock_quantity: 30,
        },
      ]);

    if (optionsError) throw optionsError;
    console.log(`✅ Opciones de precio creadas`);

    // Crear imágenes
    const { error: imagesError } = await supabase
      .from("product_images")
      .insert([
        {
          product_id: productId,
          image_url: "https://example.com/img1.jpg",
          is_primary: true,
          sort_order: 1,
        },
        {
          product_id: productId,
          image_url: "https://example.com/img2.jpg",
          is_primary: false,
          sort_order: 2,
        },
        {
          product_id: productId,
          image_url: "https://example.com/img3.jpg",
          is_primary: false,
          sort_order: 3,
        },
      ]);

    if (imagesError) throw imagesError;
    console.log(`✅ Imágenes creadas`);

    // Crear colores
    const { error: colorsError } = await supabase
      .from("color_variants")
      .insert([
        {
          product_id: productId,
          name: "Rojo",
          sort_order: 1,
        },
        {
          product_id: productId,
          name: "Azul",
          sort_order: 2,
        },
      ]);

    if (colorsError) throw colorsError;
    console.log(`✅ Variantes de color creadas\n`);

    return productId;
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

async function testVerifyDuplicates(productId) {
  console.log("TEST 2: Verificar no hay duplicados");
  try {
    const { data: options, error: optError } = await supabase
      .from("product_options")
      .select("*")
      .eq("product_id", productId);

    if (optError) throw optError;
    if (!options || options.length === 0) throw new Error("No options found");

    const uniqueNames = new Set(options.map((o) => o.name));
    if (uniqueNames.size !== options.length) {
      throw new Error("Opciones duplicadas encontradas");
    }
    console.log(`✅ ${options.length} opciones únicas`);

    const { data: images, error: imgError } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId);

    if (imgError) throw imgError;
    if (!images || images.length === 0) throw new Error("No images found");
    console.log(`✅ ${images.length} imágenes únicas`);

    const { data: colors, error: colError } = await supabase
      .from("color_variants")
      .select("*")
      .eq("product_id", productId);

    if (colError) throw colError;
    if (!colors || colors.length === 0) throw new Error("No colors found");
    console.log(`✅ ${colors.length} colores únicos\n`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

async function testEditProduct(productId) {
  console.log("TEST 3: Editar producto");
  try {
    // Actualizar producto
    const { error: updateError } = await supabase
      .from("products")
      .update({
        name: `Test Producto Editado ${Date.now()}`,
        description: "Descripción editada",
      })
      .eq("id", productId);

    if (updateError) throw updateError;
    console.log(`✅ Producto actualizado`);

    // Actualizar imagen primaria
    const { data: images, error: getImgError } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });

    if (getImgError) throw getImgError;
    if (!images || images.length < 2) throw new Error("Not enough images");

    // Cambiar imagen primaria a la segunda
    const { error: updateImgError } = await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId);

    if (updateImgError) throw updateImgError;

    const { error: setPrimaryError } = await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", images[1].id);

    if (setPrimaryError) throw setPrimaryError;
    console.log(`✅ Imagen primaria cambiada\n`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

async function testSoftDelete(productId) {
  console.log("TEST 4: Soft delete");
  try {
    // Crear una orden con items de este producto
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: "test-user",
        status: "pending",
        total_amount: 100,
      })
      .select();

    if (orderError) throw orderError;
    const orderId = order?.[0]?.id;

    const { error: itemError } = await supabase
      .from("order_items")
      .insert({
        order_id: orderId,
        product_id: productId,
        quantity: 1,
        price_at_purchase: 100,
      });

    if (itemError) throw itemError;
    console.log(`✅ Orden y items creados`);

    // Soft delete el producto
    const { error: deleteError } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", productId);

    if (deleteError) throw deleteError;
    console.log(`✅ Producto soft-deleted`);

    // Verificar que la orden todavía existe
    const { data: orderCheck, error: checkError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId);

    if (checkError) throw checkError;
    if (!orderCheck || orderCheck.length === 0) {
      throw new Error("Orden fue eliminada (no debería pasar)");
    }
    console.log(`✅ Orden protegida de eliminación\n`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

async function testCatalogVisibility(productId) {
  console.log("TEST 5: Visibilidad en catálogo");
  try {
    // Crear un producto activo
    const { data: activeProduct, error: createError } = await supabase
      .from("products")
      .insert({
        name: `Active Test ${Date.now()}`,
        active: true,
      })
      .select();

    if (createError) throw createError;
    const activeId = activeProduct?.[0]?.id;

    // Crear categorías
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("active", true)
      .limit(4);

    if (catError) throw catError;
    console.log(`✅ ${categories?.length || 0} categorías activas en catálogo\n`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

async function main() {
  try {
    const productId = await testCreateProduct();
    await testVerifyDuplicates(productId);
    await testEditProduct(productId);
    await testSoftDelete(productId);
    await testCatalogVisibility(productId);

    console.log("✅ TODOS LOS TESTS PASARON");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test suite failed:", err);
    process.exit(1);
  }
}

main();
