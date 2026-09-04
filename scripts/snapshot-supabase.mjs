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
  const match = line.match(/^([A-Z_]+)="?(.+?)"?$/);
  if (match) {
    env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function takeSnapshot() {
  console.log("Taking Supabase snapshot...\n");

  try {
    // Products
    const productsRes = await supabase.from("products").select("id, name", { count: "exact" });
    console.log(`Products: ${productsRes.count || 0}`);
    if (productsRes.error) console.error("  Error:", productsRes.error);

    // Product Options
    const optionsRes = await supabase.from("product_options").select("id", { count: "exact" });
    console.log(`Product Options: ${optionsRes.count || 0}`);
    if (optionsRes.error) console.error("  Error:", optionsRes.error);

    // Color Variants
    const colorsRes = await supabase.from("color_variants").select("id", { count: "exact" });
    console.log(`Color Variants: ${colorsRes.count || 0}`);
    if (colorsRes.error) console.error("  Error:", colorsRes.error);

    // Product Images
    const imagesRes = await supabase.from("product_images").select("id", { count: "exact" });
    console.log(`Product Images: ${imagesRes.count || 0}`);
    if (imagesRes.error) console.error("  Error:", imagesRes.error);

    // Save to file
    const snapshot = {
      timestamp: new Date().toISOString(),
      products: productsRes.count || 0,
      product_options: optionsRes.count || 0,
      color_variants: colorsRes.count || 0,
      product_images: imagesRes.count || 0,
    };

    const snapshotPath = path.join(__dirname, "../SNAPSHOT_INITIAL.json");
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    console.log(`\nSnapshot saved to ${snapshotPath}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

takeSnapshot();
