import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

// Load .env.local
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  if (key && value) {
    envVars[key] = value;
  }
});

const SUPABASE_URL = envVars.SUPABASE_URL || "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedTestProducts() {
  console.log("Creating test products...");

  // Test product 1: Ramo Silvestre
  const product1 = await supabase
    .from("products")
    .insert({
      ghl_product_id: "test-product-1",
      name: "Ramo Silvestre",
      description: "Flor variada de temporada con aire campestre y mucho movimiento.",
      category: "ramos",
      active: true,
      cover_image_url: "https://images.unsplash.com/photo-1589281957521-69852cda71b3?w=500",
      has_color_variants: false,
    })
    .select()
    .single();

  if (product1.error) {
    console.error("Error creating product 1:", product1.error);
  } else {
    const p1 = product1.data;
    console.log("Created product 1:", p1.id);

    // Add options for product 1
    await supabase.from("product_options").insert([
      {
        product_id: p1.id,
        name: "Estándar",
        price_amount: 30,
        discount_percent: 0,
        sku: "RAMO-SIL-001",
      },
      {
        product_id: p1.id,
        name: "Especial",
        price_amount: 37.5,
        discount_percent: 0,
        sku: "RAMO-SIL-002",
      },
      {
        product_id: p1.id,
        name: "Premium",
        price_amount: 45,
        discount_percent: 0,
        sku: "RAMO-SIL-003",
      },
    ]);

    console.log("Added options for product 1");
  }

  // Test product 2: Rosas Eternas con Colores
  const product2 = await supabase
    .from("products")
    .insert({
      ghl_product_id: "test-product-2",
      name: "Caja de Rosas Eternas",
      description: "Rosa natural preservada en caja de regalo. Disponible en varios tamaños y colores.",
      category: "rosas-eternas",
      active: true,
      cover_image_url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500",
      has_color_variants: true,
    })
    .select()
    .single();

  if (product2.error) {
    console.error("Error creating product 2:", product2.error);
  } else {
    const p2 = product2.data;
    console.log("Created product 2:", p2.id);

    // Add options for product 2
    await supabase.from("product_options").insert([
      {
        product_id: p2.id,
        name: "Pequeña",
        price_amount: 40,
        discount_percent: 0,
        sku: "ROSA-ETE-S-001",
      },
      {
        product_id: p2.id,
        name: "Mediana",
        price_amount: 62.5,
        discount_percent: 0,
        sku: "ROSA-ETE-M-001",
      },
      {
        product_id: p2.id,
        name: "Grande",
        price_amount: 85,
        discount_percent: 0,
        sku: "ROSA-ETE-L-001",
      },
    ]);

    // Add color variants for product 2
    const colors = await supabase.from("color_variants").insert([
      { product_id: p2.id, name: "Rojo", sort_order: 0 },
      { product_id: p2.id, name: "Rosa", sort_order: 1 },
      { product_id: p2.id, name: "Blanco", sort_order: 2 },
      { product_id: p2.id, name: "Azul", sort_order: 3 },
    ]);

    console.log("Added options and color variants for product 2");
  }

  // Test product 3: Planta
  const product3 = await supabase
    .from("products")
    .insert({
      ghl_product_id: "test-product-3",
      name: "Orquídea Phalaenopsis",
      description: "Orquídea Phalaenopsis en maceta decorativa, muy resistente y longeva.",
      category: "plantas",
      active: true,
      cover_image_url: "https://images.unsplash.com/photo-1597848212624-bf7c2a500d3a?w=500",
      has_color_variants: false,
    })
    .select()
    .single();

  if (product3.error) {
    console.error("Error creating product 3:", product3.error);
  } else {
    const p3 = product3.data;
    console.log("Created product 3:", p3.id);

    // Add options for product 3
    await supabase.from("product_options").insert([
      {
        product_id: p3.id,
        name: "Estándar",
        price_amount: 30,
        discount_percent: 0,
        sku: "ORQU-PHA-001",
      },
    ]);

    console.log("Added options for product 3");
  }

  console.log("Test products created successfully!");
}

seedTestProducts().catch(console.error);
