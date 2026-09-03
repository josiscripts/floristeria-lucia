#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

// Load env
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getSnapshot() {
  const results = await Promise.all([
    supabase.from("products").select("id", { count: "exact" }),
    supabase.from("product_options").select("id", { count: "exact" }),
    supabase.from("color_variants").select("id", { count: "exact" }),
    supabase.from("product_images").select("id", { count: "exact" }),
  ]);
  return {
    products: results[0].count || 0,
    product_options: results[1].count || 0,
    color_variants: results[2].count || 0,
    product_images: results[3].count || 0,
  };
}

async function getLatestTestProduct() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .like("name", "%TEST BLOQUE%")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;
  return data[0];
}

async function main() {
  try {
    console.log("=".repeat(60));
    console.log("COMPLETE CRUD TEST: FASE 4 & 5");
    console.log("=".repeat(60));

    // Get token
    const tokenFile = path.join(__dirname, "../ADMIN_TOKEN.txt");
    const token = fs.readFileSync(tokenFile, "utf-8").trim();

    // Get test product
    console.log("\n1. Finding test product...");
    const product = await getLatestTestProduct();

    if (!product) {
      console.error("No test product found");
      process.exit(1);
    }

    console.log(`✓ Found: ${product.id} (${product.name})`);

    // Snapshot before edit
    console.log("\n2. Snapshot before edit...");
    const snapshotBefore = await getSnapshot();
    console.log(`  Products: ${snapshotBefore.products}`);

    // FASE 4: EDIT
    console.log("\n3. FASE 4: EDIT PRODUCT");
    console.log("-".repeat(60));

    const editPayload = {
      name: "TEST BLOQUE 4 — CRUD REAL EDITADO",
      description: "Producto temporal editado durante la prueba CRUD.",
      category: "ramos",
      active: true,
      options: [
        {
          name: "Estándar",
          price_amount: 30,
          discount_percent: 0,
          stock_quantity: 12,
        },
      ],
    };

    console.log("Sending PUT to edit product...");

    const editRes = await fetch(`http://localhost:3000/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(editPayload),
    });

    const editText = await editRes.text();
    let editData;

    try {
      editData = JSON.parse(editText);
    } catch (e) {
      console.error(`Error parsing response: ${editText.substring(0, 200)}`);
    }

    console.log(`Response: ${editRes.status}`);

    if (editRes.status === 200 || editRes.status === 201) {
      console.log(`✓ Product edited: ${editData?.product?.name}`);
    } else {
      console.log(`✗ Edit failed: ${editData?.error || "Unknown error"}`);
    }

    // Snapshot after edit
    console.log("\n4. Snapshot after edit...");
    const snapshotAfter = await getSnapshot();
    console.log(`  Products: ${snapshotAfter.products}`);

    // Verify product was not duplicated
    if (snapshotAfter.products === snapshotBefore.products) {
      console.log(`✓ No duplicates created`);
    } else {
      console.log(`✗ Possible duplication detected`);
    }

    // FASE 5: DELETE
    console.log("\n5. FASE 5: DELETE PRODUCT");
    console.log("-".repeat(60));

    console.log("Sending DELETE to remove product...");

    const deleteRes = await fetch(`http://localhost:3000/api/admin/products/${product.id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const deleteText = await deleteRes.text();
    let deleteData;

    try {
      deleteData = JSON.parse(deleteText);
    } catch (e) {
      console.log("No JSON response");
    }

    console.log(`Response: ${deleteRes.status}`);

    if (deleteRes.status === 200 || deleteRes.status === 204) {
      console.log(`✓ Product deleted`);
    } else {
      console.log(`Note: ${deleteData?.error || deleteText.substring(0, 100)}`);
    }

    // Final snapshot
    console.log("\n6. Snapshot after deletion...");
    const snapshotFinal = await getSnapshot();
    console.log(`  Products: ${snapshotFinal.products}`);

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      phase_4_edit: {
        status: editRes.status === 200 || editRes.status === 201 ? "SUCCESS" : "FAILED",
        response_status: editRes.status,
        changes_applied: editRes.status === 200 || editRes.status === 201,
      },
      phase_5_delete: {
        status: deleteRes.status === 200 || deleteRes.status === 204 ? "SUCCESS" : "FAILED",
        response_status: deleteRes.status,
      },
      integrity_check: {
        products_count_stable: snapshotBefore.products === snapshotAfter.products,
        product_fully_removed: snapshotFinal.products < snapshotAfter.products,
      },
      snapshots: {
        before_edit: snapshotBefore,
        after_edit: snapshotAfter,
        after_delete: snapshotFinal,
      },
    };

    const reportPath = path.join(__dirname, "../FASE4_5_RESULTS.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("RESULT SUMMARY");
    console.log("=".repeat(60));
    console.log(
      `FASE 4 (EDIT):   ${report.phase_4_edit.status} (HTTP ${report.phase_4_edit.response_status})`
    );
    console.log(
      `FASE 5 (DELETE): ${report.phase_5_delete.status} (HTTP ${report.phase_5_delete.response_status})`
    );
    console.log(`No duplicates:   ${report.integrity_check.products_count_stable ? "✓" : "✗"}`);
    console.log(`Product removed: ${report.integrity_check.product_fully_removed ? "✓" : "✗"}`);
    console.log(`\nReport: ${reportPath}`);
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
}

main();
