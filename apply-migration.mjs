#!/usr/bin/env node

/**
 * Apply Supabase migration for product_images fix
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createClient } from "@supabase/supabase-js";

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
} catch (err) {
  console.error("❌ Failed to load .env.local:", err.message);
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read migration SQL
const migrationSQL = readFileSync(`${__dirname}/supabase/migrations/20260904_fix_product_images_for_supabase_only.sql`, "utf8");

// Execute each statement
const statements = migrationSQL
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

console.log(`🚀 Applying migration with ${statements.length} statements\n`);

(async () => {
  try {
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i] + ";";
      console.log(`[${i + 1}/${statements.length}] Executing...`);

      const { error } = await supabase.rpc("exec_sql", { query: sql }).catch(async () => {
        // Fallback: Try direct SQL execution via Supabase admin API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
          },
          body: JSON.stringify({ query: sql }),
        });

        if (!response.ok) {
          const text = await response.text();
          return { error: { message: text } };
        }
        return { error: null };
      });

      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ OK`);
      }
    }

    console.log("\n✅ Migration completed");
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    process.exit(1);
  }
})();
