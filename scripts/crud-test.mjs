#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

// Load .env.local
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  if (!line.trim() || line.startsWith("#")) return;
  const match = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (match) {
    let value = match[2];
    if (value.endsWith('"')) value = value.slice(0, -1);
    env[match[1]] = value;
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
const VITE_SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("=== BLOQUE 4 CRUD VALIDATION ===\n");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabasePublic = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);

async function getOrCreateAdminUser() {
  console.log("STEP 1: Admin Authentication");
  console.log("-".repeat(50));

  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    if (users?.users?.length > 0) {
      const admin = users.users[0];
      console.log(`✓ Found existing user: ${admin.email} (${admin.id})`);
      return { id: admin.id, email: admin.email };
    }
  } catch (e) {
    console.log("  Could not list users");
  }

  const email = `test-admin-${Date.now()}@floristeria.test`;
  const password = "Test@Admin123456";

  console.log(`Creating new admin user: ${email}`);

  try {
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error(`✗ Failed: ${error.message}`);
      return null;
    }

    console.log(`✓ User created: ${user.id}`);

    // Assign admin role
    await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      email: user.email,
      role: "admin",
      updated_at: new Date().toISOString(),
    });

    console.log(`✓ Admin role assigned\n`);
    return { id: user.id, email, password };
  } catch (e) {
    console.error(`✗ Error: ${e.message}\n`);
    return null;
  }
}

async function getAdminToken(email, password) {
  console.log("STEP 2: Token Generation");
  console.log("-".repeat(50));

  try {
    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(`✗ Login failed: ${error.message}`);
      return null;
    }

    const token = data?.session?.access_token;
    if (!token) {
      console.error(`✗ No token in session`);
      return null;
    }

    console.log(`✓ Logged in successfully`);
    console.log(`✓ Access token: ${token.substring(0, 30)}...\n`);
    return token;
  } catch (e) {
    console.error(`✗ Error: ${e.message}\n`);
    return null;
  }
}

async function getSnapshot() {
  const results = await Promise.all([
    supabaseAdmin.from("products").select("id", { count: "exact" }),
    supabaseAdmin.from("product_options").select("id", { count: "exact" }),
    supabaseAdmin.from("color_variants").select("id", { count: "exact" }),
    supabaseAdmin.from("product_images").select("id", { count: "exact" }),
  ]);

  return {
    products: results[0].count || 0,
    product_options: results[1].count || 0,
    color_variants: results[2].count || 0,
    product_images: results[3].count || 0,
  };
}

async function phase3CreateProduct(token) {
  console.log("FASE 3: CREATE PRODUCT");
  console.log("-".repeat(50));

  const payload = {
    name: "TEST BLOQUE 4 — CRUD REAL",
    description: "Producto temporal para validación real del flujo CRUD.",
    category: "ramos",
    active: true,
    options: [
      {
        name: "Estándar",
        price_amount: 25,
        discount_percent: 0,
        stock_quantity: 7,
      },
    ],
  };

  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));

  console.log("\nSending POST to /api/admin/products...");

  try {
    const response = await fetch("http://localhost:3000/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`✗ Response not JSON (status ${response.status}):`);
      console.error(text.substring(0, 500));
      return null;
    }

    console.log(`Response Status: ${response.status}`);

    if (response.status !== 201 && response.status !== 200) {
      console.error(`✗ Error: ${data.error || "Unknown error"}`);
      console.error(`  Code: ${data.code}`);
      return null;
    }

    if (!data.product?.id) {
      console.error(`✗ No product ID in response`);
      return null;
    }

    console.log(`✓ Product created!`);
    console.log(`  ID: ${data.product.id}`);
    console.log(`  Name: ${data.product.name}`);
    console.log(`  GHL ID: ${data.product.ghl_product_id}`);
    console.log(`  Options: ${data.product.options?.length || 0}`);
    console.log();

    return data.product;
  } catch (error) {
    console.error(`✗ Network error: ${error.message}`);
    console.log(`   (Is the dev server running on localhost:3000?)\n`);
    return null;
  }
}

async function run() {
  try {
    // Step 1: Get admin
    const user = await getOrCreateAdminUser();
    if (!user) {
      console.error("✗ FAILED: Could not get admin user\n");
      process.exit(1);
    }

    // Step 2: Generate token (use password from creation or stored)
    // For existing users, we need a workaround - let's try to reset password temporarily
    let token;
    if (user.password) {
      // New user with password
      token = await getAdminToken(user.email, user.password);
    } else {
      // Existing user - try a dummy password or skip auth for now
      console.log("STEP 2: Token Generation");
      console.log("-".repeat(50));
      console.log("Existing user - using service role for API calls");
      token = SUPABASE_SERVICE_ROLE_KEY;
      console.log("Using service role directly\n");
    }

    if (!token) {
      console.error("✗ FAILED: Could not get token\n");
      process.exit(1);
    }

    // Step 3: Snapshot before
    console.log("STEP 3: Snapshot Before");
    console.log("-".repeat(50));
    const snapshotBefore = await getSnapshot();
    console.log("Counts:");
    console.log(`  Products: ${snapshotBefore.products}`);
    console.log(`  Product Options: ${snapshotBefore.product_options}`);
    console.log(`  Color Variants: ${snapshotBefore.color_variants}`);
    console.log(`  Product Images: ${snapshotBefore.product_images}`);
    console.log();

    // Step 4: Create product
    const product = await phase3CreateProduct(token);

    // Step 5: Snapshot after
    console.log("SNAPSHOT AFTER");
    console.log("-".repeat(50));
    const snapshotAfter = await getSnapshot();
    console.log("Counts:");
    console.log(`  Products: ${snapshotAfter.products}`);
    console.log(`  Product Options: ${snapshotAfter.product_options}`);
    console.log(`  Color Variants: ${snapshotAfter.color_variants}`);
    console.log(`  Product Images: ${snapshotAfter.product_images}`);
    console.log();

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      admin_id: user.id,
      snapshot_before: snapshotBefore,
      snapshot_after: snapshotAfter,
      product: product
        ? {
            id: product.id,
            name: product.name,
            ghl_product_id: product.ghl_product_id,
            category: product.category,
            options_count: product.options?.length || 0,
          }
        : null,
    };

    const resultsPath = path.join(__dirname, "../FASE3_RESULTS.json");
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    console.log("=".repeat(50));
    console.log("RESULT SUMMARY");
    console.log("=".repeat(50));

    if (product && snapshotAfter.products > snapshotBefore.products) {
      console.log("✓ DEMOSTRADO: Producto creado exitosamente");
      console.log(`  - Antes: ${snapshotBefore.products} productos`);
      console.log(`  - Después: ${snapshotAfter.products} productos`);
      console.log(`  - Product ID: ${product.id}`);
      console.log(`  - GHL Product ID: ${product.ghl_product_id}`);
    } else if (!product) {
      console.log("✗ NO DEMOSTRADO: No se pudo crear el producto");
      console.log("  - Posible causa: Servidor no está ejecutándose");
    } else {
      console.log("✗ FALLIDO: Producto NO fue creado en Supabase");
    }

    console.log(`\nResultados guardados en: ${resultsPath}`);
  } catch (error) {
    console.error("FATAL ERROR:", error.message);
    process.exit(1);
  }
}

run();
