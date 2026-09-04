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

const { data, error } = await supabase
  .from("product_images")
  .select("id, product_id, image_url, deleted_at")
  .limit(10);

console.log("Error:", error);
console.log(`Found ${data?.length} records`);

if (data && data.length > 0) {
  console.log("\nSample records:");
  data.forEach((img) => {
    console.log(
      `  Product: ${img.product_id.slice(0, 8)}... Deleted: ${img.deleted_at} URL: ${img.image_url?.slice(0, 50) || "NULL"}...`,
    );
  });
} else {
  console.log("\nNo images found!");

  // Try raw query
  console.log("\nAttempting raw count...");
  const { data: rawData, error: rawError } = await supabase.from("product_images").select("*");

  console.log("Raw error:", rawError);
  console.log("Raw count:", rawData?.length);
}
