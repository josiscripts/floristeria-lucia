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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function createAdminToken() {
  try {
    const timestamp = Date.now();
    const email = `admin-bloque6-${timestamp}@floristeria.test`;
    const password = `AdminBloque6_${timestamp}!`;

    console.log("Creating admin user...");
    console.log(`  Email: ${email}`);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true,
      },
      { skipConfirmation: true },
    );

    if (authError) {
      console.error("Error creating user:", authError);
      process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✓ User created with ID: ${userId}`);

    // Set admin role in profiles
    console.log("Assigning admin role...");
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        role: "admin",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("Error updating profile:", profileError);
      process.exit(1);
    }

    console.log(`✓ Admin role assigned`);

    // Generate token via signInWithPassword
    console.log("Generating token...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Error signing in:", signInError);
      process.exit(1);
    }

    const token = signInData.session.access_token;
    console.log(`✓ Token generated`);

    // Save credentials
    const credentialsPath = path.join(__dirname, "../ADMIN_TOKEN_BLOQUE6.txt");
    fs.writeFileSync(credentialsPath, token);

    const userInfoPath = path.join(__dirname, "../ADMIN_USER_BLOQUE6.json");
    fs.writeFileSync(
      userInfoPath,
      JSON.stringify(
        {
          id: userId,
          email,
          password,
          token: token.slice(0, 50) + "...",
          created_at: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    console.log(`\n✓ Credentials saved:`);
    console.log(`  Token: ${credentialsPath}`);
    console.log(`  User Info: ${userInfoPath}`);
    console.log(`\n✓ Token: ${token.slice(0, 50)}...`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createAdminToken();
