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

const VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
const VITE_SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = env.SUPABASE_URL;

console.log("Getting admin token via Supabase auth...\n");

// Create admin client and public client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabasePublic = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);

async function main() {
  // Step 1: Create or get test admin user
  console.log("Step 1: Creating test admin user...");

  const testEmail = `test-admin-token-${Date.now()}@floristeria.test`;
  const testPassword = `TestPass${Math.random().toString(36).substring(7)}123!`;

  // Create user with admin API
  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser(
    {
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    },
    { skipConfirmation: true }
  );

  if (createError) {
    console.error(`Error creating user: ${createError.message}`);
    // Try with existing user
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existing = users?.users?.[0];
    if (!existing) {
      console.error("No existing users found");
      process.exit(1);
    }
    console.log(`Using existing user: ${existing.email}`);
    console.log("(Note: Cannot login without password)");
    process.exit(1);
  }

  console.log(`✓ User created: ${testEmail}`);

  // Step 2: Assign admin role
  console.log("\nStep 2: Assigning admin role...");

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      role: "admin",
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error(`Error setting role: ${profileError.message}`);
  } else {
    console.log(`✓ Admin role assigned`);
  }

  // Step 3: Login with public client
  console.log("\nStep 3: Logging in with public client...");

  const { data, error: loginError } = await supabasePublic.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginError) {
    console.error(`✗ Login failed: ${loginError.message}`);
    process.exit(1);
  }

  const token = data?.session?.access_token;
  if (!token) {
    console.error("✗ No token in session");
    process.exit(1);
  }

  console.log(`✓ Login successful!`);
  console.log(`✓ Access token obtained\n`);

  // Output token for use in other scripts
  console.log("=".repeat(60));
  console.log("ADMIN TOKEN");
  console.log("=".repeat(60));
  console.log(token);
  console.log("=".repeat(60));

  // Save to file
  const tokenFile = path.join(__dirname, "../ADMIN_TOKEN.txt");
  fs.writeFileSync(tokenFile, token);
  console.log(`\nToken saved to: ${tokenFile}`);

  // Also save user info
  const infoFile = path.join(__dirname, "../ADMIN_USER_INFO.json");
  fs.writeFileSync(
    infoFile,
    JSON.stringify(
      {
        email: testEmail,
        password: testPassword,
        user_id: user.id,
        token_first_30: token.substring(0, 30) + "...",
      },
      null,
      2
    )
  );
  console.log(`User info saved to: ${infoFile}`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
