#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const { data: products, error } = await supabase
  .from("products")
  .select("id, name, category")
  .is("deleted_at", null)
  .limit(5);

console.log("Sample products:");
console.log("Error:", error);
console.log(`Found: ${products?.length || 0}`);
products?.forEach((p) => console.log(`  - ${p.name} (${p.category})`));

const { count } = await supabase
  .from("products")
  .select("COUNT(*) as count", { count: "exact" })
  .is("deleted_at", null);

console.log(`\nTotal active products: ${count}`);
