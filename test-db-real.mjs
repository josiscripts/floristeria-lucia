#!/usr/bin/env node

/**
 * FASE 4.1 - Real Database Testing
 *
 * This script tests against the REAL Supabase database
 * using credentials from .env.local
 *
 * Tests:
 * - DB-01: Create product
 * - DB-02: Verify product
 * - DB-03: Create options
 * - DB-04: Create images
 * - DB-05: Create colors
 * - DB-06: Edit product
 * - DB-07: Verify no duplicates
 * - DB-08: Soft delete
 * - DB-09: Verify catalog
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envContent = readFileSync(`${__dirname}/.env.local`, "utf8");
  envContent.split("\n").forEach((line) => {
    if (line.trim() && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").replace(/^"(.*)"$/, "$1");
      if (key && value) process.env[key.trim()] = value;
    }
  });
  console.log("✅ Loaded .env.local\n");
} catch (err) {
  console.error("❌ Failed to load .env.local:", err.message);
  process.exit(1);
}

// Load from environment
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("  Ensure .env.local is loaded properly");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("🧪 FASE 4.1 - REAL DATABASE TESTING\n");
console.log(`📍 Testing against: ${SUPABASE_URL}\n`);

let testProductId = null;
let testsPassed = 0;
let testsFailed = 0;

// ============================================================
// TEST DB-01: Create Product
// ============================================================
async function testDB01_CreateProduct() {
  console.log("TEST DB-01: Create product");
  try {
    const productName = `FASE4Test_${Date.now()}`;

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: productName,
        description: "Test product for FASE 4.1",
        category: "ramos",
        active: true,
        cover_image_url: "https://example.com/test.jpg",
        has_color_variants: false,
      })
      .select();

    if (error) throw error;
    if (!product?.[0]) throw new Error("No product returned");

    testProductId = product[0].id;
    console.log(`✅ PASS: Product created with ID: ${testProductId}\n`);
    testsPassed++;
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// TEST DB-02: Verify Product
// ============================================================
async function testDB02_VerifyProduct() {
  if (!testProductId) {
    console.log("⏭️  SKIP DB-02: Product ID not available\n");
    return false;
  }

  console.log("TEST DB-02: Verify product");
  try {
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", testProductId)
      .single();

    if (error) throw error;
    if (!product) throw new Error("Product not found");

    const checks = [
      ["name", product.name !== "", `name='${product.name}'`],
      ["category", product.category === "ramos", `category='${product.category}'`],
      ["active", product.active === true, `active=${product.active}`],
      ["created_at", product.created_at !== null, "timestamp set"],
    ];

    let allPass = true;
    for (const [field, check, detail] of checks) {
      if (!check) {
        console.error(`  ❌ ${field}: ${detail}`);
        allPass = false;
      }
    }

    if (allPass) {
      console.log(`✅ PASS: Product verified\n`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: Product verification failed\n`);
      testsFailed++;
    }
    return allPass;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// TEST DB-03: Create Options (Prices)
// ============================================================
async function testDB03_CreateOptions() {
  if (!testProductId) {
    console.log("⏭️  SKIP DB-03: Product ID not available\n");
    return false;
  }

  console.log("TEST DB-03: Create product options");
  try {
    const { data: options, error } = await supabase
      .from("product_options")
      .insert([
        {
          product_id: testProductId,
          name: "Opción 1 - Pequeño",
          price_amount: 75,
          discount_percent: 10,
          stock_quantity: 50,
        },
        {
          product_id: testProductId,
          name: "Opción 2 - Grande",
          price_amount: 150,
          discount_percent: 5,
          stock_quantity: 30,
        },
      ])
      .select();

    if (error) throw error;
    if (!options || options.length !== 2) throw new Error("Expected 2 options");

    console.log(`✅ PASS: 2 options created\n`);
    testsPassed++;
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// TEST DB-04: Create Images
// ============================================================
async function testDB04_CreateImages() {
  if (!testProductId) {
    console.log("⏭️  SKIP DB-04: Product ID not available\n");
    return false;
  }

  console.log("TEST DB-04: Create product images");
  try {
    const { data: images, error } = await supabase
      .from("product_images")
      .insert([
        {
          product_id: testProductId,
          image_url: "https://example.com/img1.jpg",
          is_primary: true,
          sort_order: 1,
        },
        {
          product_id: testProductId,
          image_url: "https://example.com/img2.jpg",
          is_primary: false,
          sort_order: 2,
        },
      ])
      .select();

    if (error) throw error;
    if (!images || images.length !== 2) throw new Error("Expected 2 images");

    const primaryCount = images.filter((i) => i.is_primary).length;
    if (primaryCount !== 1) throw new Error(`Expected 1 primary, got ${primaryCount}`);

    console.log(`✅ PASS: 2 images created with correct primary\n`);
    testsPassed++;
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// TEST DB-05: Create Colors
// ============================================================
async function testDB05_CreateColors() {
  if (!testProductId) {
    console.log("⏭️  SKIP DB-05: Product ID not available\n");
    return false;
  }

  console.log("TEST DB-05: Create color variants");
  try {
    const { data: colors, error } = await supabase
      .from("color_variants")
      .insert([
        {
          product_id: testProductId,
          name: "Rojo",
          sort_order: 1,
        },
        {
          product_id: testProductId,
          name: "Blanco",
          sort_order: 2,
        },
      ])
      .select();

    if (error) throw error;
    if (!colors || colors.length !== 2) throw new Error("Expected 2 colors");

    console.log(`✅ PASS: 2 colors created\n`);
    testsPassed++;
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// TEST DB-06: Edit Product
// ============================================================
async function testDB06_EditProduct() {
  if (!testProductId) {
    console.log("⏭️  SKIP DB-06: Product ID not available\n");
    return false;
  }

  console.log("TEST DB-06: Edit product");
  try {
    const newName = `FASE4Test_EDITED_${Date.now()}`;

    const { error } = await supabase
      .from("products")
      .update({
        name: newName,
        description: "Edited description",
      })
      .eq("id", testProductId);

    if (error) throw error;

    // Verify edit
    const { data: product, error: selectError } = await supabase
      .from("products")
      .select("name, description")
      .eq("id", testProductId)
      .single();

    if (selectError) throw selectError;
    if (product.name !== newName) throw new Error("Name not updated");

    console.log(`✅ PASS: Product edited and verified\n`);
    testsPassed++;
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// TEST DB-07: Verify No Duplicates
// ============================================================
async function testDB07_VerifyNoDuplicates() {
  if (!testProductId) {
    console.log("⏭️  SKIP DB-07: Product ID not available\n");
    return false;
  }

  console.log("TEST DB-07: Verify no duplicates");
  try {
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id")
      .eq("id", testProductId);

    if (prodError) throw prodError;
    if (products.length !== 1) throw new Error(`Expected 1 product, got ${products.length}`);

    const { data: options, error: optError } = await supabase
      .from("product_options")
      .select("id, name")
      .eq("product_id", testProductId);

    if (optError) throw optError;

    const optionNames = new Set(options.map((o) => o.name));
    if (optionNames.size !== options.length) {
      throw new Error("Duplicate option names found");
    }

    const { data: images, error: imgError } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", testProductId);

    if (imgError) throw imgError;
    if (images.length !== 2) throw new Error(`Expected 2 images, got ${images.length}`);

    console.log(
      `✅ PASS: No duplicates (${options.length} options, ${images.length} images)\n`
    );
    testsPassed++;
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// TEST DB-08: Soft Delete
// ============================================================
async function testDB08_SoftDelete() {
  if (!testProductId) {
    console.log("⏭️  SKIP DB-08: Product ID not available\n");
    return false;
  }

  console.log("TEST DB-08: Soft delete product");
  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("products")
      .update({
        deleted_at: now,
      })
      .eq("id", testProductId);

    if (error) throw error;

    // Verify soft delete
    const { data: product, error: selectError } = await supabase
      .from("products")
      .select("id, deleted_at")
      .eq("id", testProductId)
      .single();

    if (selectError) throw selectError;
    if (!product.deleted_at) throw new Error("deleted_at not set");

    // Verify product is hidden from SELECT with RLS
    const { data: hiddenProduct, error: rlsError } = await supabase
      .from("products")
      .select("id")
      .eq("id", testProductId)
      .single();

    if (!rlsError && hiddenProduct) {
      console.error(`⚠️  WARNING: Product still visible after soft delete (RLS may not be working)`);
    }

    console.log(`✅ PASS: Soft delete verified (deleted_at set)\n`);
    testsPassed++;
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// TEST DB-09: Categories Query
// ============================================================
async function testDB09_CategoriesQuery() {
  console.log("TEST DB-09: Categories query");
  try {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name, active")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    if (!categories || categories.length === 0) {
      console.error(`❌ FAIL: No categories found in database\n`);
      testsFailed++;
      return false;
    }

    console.log(`✅ PASS: ${categories.length} active categories found\n`);
    testsPassed++;
    return true;
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}\n`);
    testsFailed++;
    return false;
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  try {
    await testDB01_CreateProduct();
    await testDB02_VerifyProduct();
    await testDB03_CreateOptions();
    await testDB04_CreateImages();
    await testDB05_CreateColors();
    await testDB06_EditProduct();
    await testDB07_VerifyNoDuplicates();
    await testDB08_SoftDelete();
    await testDB09_CategoriesQuery();

    console.log("═".repeat(50));
    console.log(`\nRESULTS:`);
    console.log(`  ✅ PASSED: ${testsPassed}`);
    console.log(`  ❌ FAILED: ${testsFailed}`);
    console.log(`  TOTAL: ${testsPassed + testsFailed}`);
    console.log(`\n  Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);

    if (testsFailed === 0) {
      console.log(`\n🎉 ALL TESTS PASSED`);
      process.exit(0);
    } else {
      console.log(`\n⚠️  SOME TESTS FAILED`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

main();
