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

async function assignAdminRole() {
  try {
    // Get admin token from file
    const tokenPath = path.join(__dirname, "../ADMIN_TOKEN.txt");
    const token = fs.readFileSync(tokenPath, "utf-8").trim();

    // Get user info from token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      console.error("Error getting user from token:", userError);
      process.exit(1);
    }

    const userId = userData.user.id;
    const email = userData.user.email;

    console.log(`Assigning admin role to user:`);
    console.log(`  ID: ${userId}`);
    console.log(`  Email: ${email}`);

    // Update profile to set role = 'admin'
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      process.exit(1);
    }

    // Verify
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    console.log(`\n✓ Admin role assigned successfully`);
    console.log(`  User role: ${profile?.role}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

assignAdminRole();
