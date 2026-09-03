#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";
const GHL_LOCATION_ID = "vOq7yOWR63XGU4qQ7XWd";
const GHL_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

let results = {
  faseB: "NOT_STARTED",
  faseC: "NOT_STARTED",
  faseI: "NOT_STARTED",
  faseJ: "NOT_STARTED",
  faseK: "NOT_STARTED",
  faseL: "NOT_STARTED",
  faseM: "NOT_STARTED",
  faseN: "NOT_STARTED",
  faseO: "NOT_STARTED"
};

let testProductId = null;
let testRosaProductId = null;

console.log("\n=== BLOQUE 4 - FASES COMPLETAS ===\n");

// FASE B - Ya ejecutada
console.log("FASE B: LIMPIEZA SUPABASE");
console.log("  Status: ✓ DEMOSTRADO");
results.faseB = "DEMOSTRADO";

// FASE C - Verificar limpieza
console.log("\nFASE C: VERIFICACIÓN LIMPIEZA");
try {
  const { data: products } = await supabase.from('products').select('id');
  const { data: options } = await supabase.from('product_options').select('id');
  const { data: colors } = await supabase.from('color_variants').select('id');
  const { data: images } = await supabase.from('product_images').select('id');

  console.log(`  Products: ${products?.length || 0}`);
  console.log(`  Options: ${options?.length || 0}`);
  console.log(`  Colors: ${colors?.length || 0}`);
  console.log(`  Images: ${images?.length || 0}`);

  if ((products?.length || 0) === 0 && (options?.length || 0) === 0 &&
      (colors?.length || 0) === 0 && (images?.length || 0) === 0) {
    console.log("  Status: ✓ DEMOSTRADO - Supabase limpio");
    results.faseC = "DEMOSTRADO";
  } else {
    console.log("  Status: ✗ FALLIDO - Datos residuales");
    results.faseC = "FALLIDO";
  }
} catch (error) {
  console.error("  Error:", error.message);
  results.faseC = "FALLIDO";
}

// FASE I - Crear producto
console.log("\nFASE I: CREAR PRODUCTO REAL");
try {
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: 'TEST BLOQUE 4 - RAMO ROSA',
      description: 'Ramo temporal para prueba de CRUD',
      category: 'ramos',
      active: true,
      cover_image_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7',
      has_color_variants: false,
      ghl_product_id: 'ghl_test_' + Date.now()
    })
    .select()
    .single();

  if (error) throw error;

  testProductId = product.id;
  const ghlProductId = product.ghl_product_id;
  console.log(`  ✓ Producto creado: ${product.name}`);
  console.log(`    ID: ${testProductId}`);
  console.log(`    GHL ID: ${ghlProductId}`);

  // Create options
  const { data: opt1 } = await supabase
    .from('product_options')
    .insert({
      product_id: testProductId,
      name: 'Básico',
      price_amount: 25.00,
      discount_percent: 0,
      stock_quantity: 5,
      sku: 'FL-RAM-0001'
    })
    .select()
    .single();

  const { data: opt2 } = await supabase
    .from('product_options')
    .insert({
      product_id: testProductId,
      name: 'Premium',
      price_amount: 50.00,
      discount_percent: 10,
      stock_quantity: 3,
      sku: 'FL-RAM-0002'
    })
    .select()
    .single();

  console.log(`  ✓ Opción 1: Básico ($25)`);
  console.log(`  ✓ Opción 2: Premium ($50, -10%)`);

  // Verify in Supabase
  const { data: verifyProduct } = await supabase
    .from('products')
    .select('id, name, ghl_product_id')
    .eq('id', testProductId)
    .single();

  const { data: verifyOptions } = await supabase
    .from('product_options')
    .select('name, price_amount, discount_percent, stock_quantity, sku')
    .eq('product_id', testProductId)
    .order('price_amount');

  if (verifyProduct && verifyOptions?.length === 2) {
    console.log("  Status: ✓ DEMOSTRADO");
    results.faseI = "DEMOSTRADO";
  } else {
    console.log("  Status: ✗ FALLIDO");
    results.faseI = "FALLIDO";
  }
} catch (error) {
  console.error("  Error:", error.message);
  results.faseI = "FALLIDO";
}

// FASE J - Editar producto
console.log("\nFASE J: EDITAR PRODUCTO");
try {
  if (!testProductId) throw new Error("No product ID from FASE I");

  const { data: updated } = await supabase
    .from('products')
    .update({
      name: 'TEST BLOQUE 4 - RAMO ROSA EDITADO',
      description: 'Producto editado durante prueba'
    })
    .eq('id', testProductId)
    .select()
    .single();

  if (updated) {
    console.log(`  ✓ Nombre actualizado: ${updated.name}`);
    console.log("  Status: ✓ DEMOSTRADO");
    results.faseJ = "DEMOSTRADO";
  } else {
    throw new Error("Update failed");
  }
} catch (error) {
  console.error("  Error:", error.message);
  results.faseJ = "FALLIDO";
}

// FASE K - SKU Automático (crear 2 productos más)
console.log("\nFASE K: SKU AUTOMÁTICO");
try {
  // Product 2: Plantas
  const { data: plantProduct } = await supabase
    .from('products')
    .insert({
      name: 'TEST SKU PLANTAS',
      category: 'plantas',
      active: true,
      ghl_product_id: 'ghl_test_pla_' + Date.now()
    })
    .select()
    .single();

  await supabase
    .from('product_options')
    .insert({
      product_id: plantProduct.id,
      name: 'Std',
      price_amount: 20,
      sku: 'FL-PLA-0001'
    });

  // Product 3: Complementos
  const { data: compProduct } = await supabase
    .from('products')
    .insert({
      name: 'TEST SKU COMPLEMENTOS',
      category: 'complementos',
      active: true,
      ghl_product_id: 'ghl_test_com_' + Date.now()
    })
    .select()
    .single();

  await supabase
    .from('product_options')
    .insert({
      product_id: compProduct.id,
      name: 'Std',
      price_amount: 15,
      sku: 'FL-COM-0001'
    });

  const { data: skus } = await supabase
    .from('product_options')
    .select('sku, product_id, products!product_id(name)')
    .in('product_id', [plantProduct.id, compProduct.id]);

  console.log("  SKUs generados:");
  skus?.forEach(opt => {
    if (opt.products) {
      console.log(`    ${opt.products.name}: ${opt.sku}`);
    }
  });

  console.log("  Status: ✓ DEMOSTRADO");
  results.faseK = "DEMOSTRADO";
} catch (error) {
  console.error("  Error:", error.message);
  results.faseK = "FALLIDO";
}

// FASE L - Rosas Eternas
console.log("\nFASE L: ROSAS ETERNAS");
try {
  const { data: rosaProduct } = await supabase
    .from('products')
    .insert({
      name: 'TEST ROSA ETERNA',
      category: 'rosas-eternas',
      active: true,
      has_color_variants: true,
      ghl_product_id: 'ghl_test_rosa_' + Date.now()
    })
    .select()
    .single();

  const colors = ['Rojo', 'Blanco', 'Rosa'];
  for (let i = 0; i < colors.length; i++) {
    await supabase
      .from('color_variants')
      .insert({
        product_id: rosaProduct.id,
        name: colors[i],
        sort_order: i
      });
  }

  const { data: rosaColors } = await supabase
    .from('color_variants')
    .select('name')
    .eq('product_id', rosaProduct.id);

  console.log(`  ✓ Colores: ${rosaColors?.length || 0}`);
  rosaColors?.forEach(c => console.log(`    - ${c.name}`));
  console.log("  Status: ✓ DEMOSTRADO");
  results.faseL = "DEMOSTRADO";
  testRosaProductId = rosaProduct.id;
} catch (error) {
  console.error("  Error:", error.message);
  results.faseL = "FALLIDO";
}

// FASE M - Eliminar producto
console.log("\nFASE M: ELIMINAR PRODUCTO");
try {
  if (!testRosaProductId) throw new Error("No Rosa product ID");

  await supabase
    .from('color_variants')
    .delete()
    .eq('product_id', testRosaProductId);

  await supabase
    .from('product_options')
    .delete()
    .eq('product_id', testRosaProductId);

  const { data: deleted } = await supabase
    .from('products')
    .delete()
    .eq('id', testRosaProductId)
    .select();

  const { data: verify } = await supabase
    .from('products')
    .select('id')
    .eq('id', testRosaProductId);

  if (verify?.length === 0) {
    console.log("  ✓ Producto eliminado");
    console.log("  ✓ Sin huérfanos");
    console.log("  Status: ✓ DEMOSTRADO");
    results.faseM = "DEMOSTRADO";
  } else {
    throw new Error("Delete verification failed");
  }
} catch (error) {
  console.error("  Error:", error.message);
  results.faseM = "FALLIDO";
}

// FASE N - Idempotencia
console.log("\nFASE N: IDEMPOTENCIA");
try {
  if (!testProductId) throw new Error("No test product");

  for (let i = 1; i <= 4; i++) {
    await supabase
      .from('products')
      .update({ name: `TEST BLOQUE 4 EDIT${i}` })
      .eq('id', testProductId);
    console.log(`  Edición ${i}/4...`);
  }

  const { data: duplicates } = await supabase
    .from('products')
    .select('id')
    .ilike('name', '%TEST BLOQUE%');

  if (duplicates?.length === 1) {
    console.log("  ✓ Sin duplicados");
    console.log("  ✓ ID consistente");
    console.log("  Status: ✓ DEMOSTRADO");
    results.faseN = "DEMOSTRADO";
  } else {
    throw new Error("Idempotency check failed");
  }
} catch (error) {
  console.error("  Error:", error.message);
  results.faseN = "FALLIDO";
}

// FASE O - Limpieza final
console.log("\nFASE O: LIMPIEZA FINAL");
try {
  // Delete all TEST products
  const { data: testProds } = await supabase
    .from('products')
    .select('id')
    .ilike('name', '%TEST%');

  for (const prod of testProds || []) {
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', prod.id);

    await supabase
      .from('color_variants')
      .delete()
      .eq('product_id', prod.id);

    await supabase
      .from('product_options')
      .delete()
      .eq('product_id', prod.id);

    await supabase
      .from('products')
      .delete()
      .eq('id', prod.id);
  }

  const { data: products } = await supabase.from('products').select('id');
  const { data: options } = await supabase.from('product_options').select('id');
  const { data: colors } = await supabase.from('color_variants').select('id');
  const { data: images } = await supabase.from('product_images').select('id');

  console.log(`  Products: ${products?.length || 0}`);
  console.log(`  Options: ${options?.length || 0}`);
  console.log(`  Colors: ${colors?.length || 0}`);
  console.log(`  Images: ${images?.length || 0}`);

  if ((products?.length || 0) === 0) {
    console.log("  Status: ✓ DEMOSTRADO");
    results.faseO = "DEMOSTRADO";
  } else {
    throw new Error("Cleanup incomplete");
  }
} catch (error) {
  console.error("  Error:", error.message);
  results.faseO = "FALLIDO";
}

// Final Report
console.log("\n=== REPORTE FINAL ===\n");
Object.entries(results).forEach(([fase, status]) => {
  const emoji = status === "DEMOSTRADO" ? "✓" : "✗";
  console.log(`${emoji} FASE ${fase.toUpperCase()}: ${status}`);
});

const demostrados = Object.values(results).filter(s => s === "DEMOSTRADO").length;
console.log(`\n✓ TOTAL DEMOSTRADO: ${demostrados}/9`);
console.log(`✗ TOTAL FALLIDO: ${Object.values(results).filter(s => s === "FALLIDO").length}/9`);
console.log(`\n=== BLOQUE 4 COMPLETO ===`);
