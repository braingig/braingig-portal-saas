#!/usr/bin/env node
/**
 * Prints instructions to add Create Project modal fields to Supabase.
 * If SUPABASE_SERVICE_ROLE_KEY is set, verifies whether columns already exist.
 *
 * Usage: npm run migrate:projects
 */
import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
}

loadEnv();

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SQL_PATH = "supabase/migrations/20260619_project_fields.sql";

console.log("\n📦 Project fields migration\n");
console.log("Open Supabase Dashboard → SQL Editor → New query");
console.log(`Paste the contents of: ${SQL_PATH}`);
console.log("Then click Run.\n");

if (!URL || !KEY) {
  console.log("⚠️  Could not verify schema (missing Supabase env vars).\n");
  process.exit(0);
}

const supabase = createClient(URL, KEY);

const { error } = await supabase.from("projects").select("hourly_rate").limit(1);

if (!error) {
  console.log("✅ hourly_rate column already exists — migration may already be applied.\n");
} else if (error.message?.includes("schema cache") || error.code === "PGRST204") {
  console.log("❌ hourly_rate column is missing — run the migration SQL above.\n");
} else {
  console.log(`ℹ️  Check result: ${error.message}\n`);
}
