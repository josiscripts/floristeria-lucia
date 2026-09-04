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

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabasePublic = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);

async function main() {
  console.log("Assigning admin role to recent user...\n");

  // Get recent users
  const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error(`Error listing users: ${listError.message}`);
    process.exit(1);
  }

  if (!authData?.users?.length) {
    console.error("No users found");
    process.exit(1);
  }

  // Find test user (most recent)
  const testUser = authData.users.find((u) => u.email?.includes("test-admin"));

  if (!testUser) {
    console.error("No test admin user found");
    process.exit(1);
  }

  console.log(`User found: ${testUser.email}`);
  console.log(`User ID: ${testUser.id}\n`);

  // Insert into profiles with all required fields
  const { error: profileError, data: profileData } = await supabaseAdmin.from("profiles").insert({
    id: testUser.id,
    email: testUser.email,
    role: "admin",
    full_name: testUser.email?.split("@")[0] || "Test Admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error(`Error inserting profile: ${profileError.message}`);

    // Try update instead
    console.log("\nTrying update...");
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: "admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", testUser.id);

    if (updateError) {
      console.error(`Update error: ${updateError.message}`);
      process.exit(1);
    }

    console.log("✓ Role updated");
  } else {
    console.log("✓ Profile created with admin role");
  }

  // Verify role was set
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", testUser.id)
    .single();

  console.log(`\nVerification: role = "${profile?.role}"`);

  if (profile?.role === "admin") {
    console.log("✓ SUCCESS: Admin role confirmed");
  } else {
    console.log("✗ WARNING: Role not set to admin");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
