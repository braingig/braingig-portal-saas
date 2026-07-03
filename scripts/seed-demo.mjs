#!/usr/bin/env node
/**
 * Seeds demo accounts into Supabase (email pre-confirmed).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env — get it from Supabase Dashboard → Settings → API.
 *
 * Usage: npm run seed:demo
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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_PASSWORD = "Wp9!kL2mNxQ7vR4sDemo";
const DEMO_ORG_SLUG = "demo-agency";
const PLATFORM_ADMIN_EMAIL = "polash.sahel@gmail.com";

const ACCOUNTS = [
  { email: "polash.sahel@gmail.com", fullName: "Platform Admin", role: "owner", platformAdmin: true },
  { email: "demo-owner@workpilot.dev", fullName: "Demo Owner", role: "owner" },
  { email: "demo-admin@workpilot.dev", fullName: "Demo Admin", role: "admin" },
  { email: "demo-hr@workpilot.dev", fullName: "Demo HR", role: "hr" },
  { email: "demo-lead@workpilot.dev", fullName: "Demo Team Lead", role: "team_lead" },
  { email: "demo-employee@workpilot.dev", fullName: "Demo Employee", role: "employee" },
  { email: "demo-member@workpilot.dev", fullName: "Demo Member", role: "member" },
  { email: "demo-client@workpilot.dev", fullName: "Demo Client", role: "client" },
];

if (!URL || !SERVICE_KEY) {
  console.error("\n❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("   Get it from: Supabase Dashboard → Project Settings → API → service_role");
  console.error("   Add to .env:  SUPABASE_SERVICE_ROLE_KEY=your_key_here\n");
  console.error("   Or run supabase/DEMO_SETUP.sql in the Supabase SQL Editor instead.\n");
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

async function upsertUser({ email, fullName }) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return data.user.id;
}

async function main() {
  console.log("🔐 Creating demo users…");
  const userIds = {};
  for (const acc of ACCOUNTS) {
    userIds[acc.email] = await upsertUser(acc);
    console.log(`  ✓ ${acc.email}`);
  }

  const { error: tableErr } = await admin.from("organizations").select("id").limit(1);
  if (tableErr) {
    console.error("\n⚠️  SaaS tables missing. Apply migrations first.");
    console.error("   Error:", tableErr.message);
    process.exit(1);
  }

  let orgId;
  const { data: existingOrg } = await admin.from("organizations").select("id").eq("slug", DEMO_ORG_SLUG).maybeSingle();
  if (existingOrg) {
    orgId = existingOrg.id;
    console.log("\n🏢 Demo agency already exists");
  } else {
    const ownerId = userIds["demo-owner@workpilot.dev"];
    const { data: org, error } = await admin.from("organizations").insert({
      name: "Demo Agency",
      slug: DEMO_ORG_SLUG,
      status: "active",
      created_by: ownerId,
    }).select().single();
    if (error) throw error;
    orgId = org.id;
    const { data: plan } = await admin.from("subscription_plans").select("id").eq("slug", "growth").maybeSingle();
    await admin.from("organization_subscriptions").insert({
      organization_id: orgId,
      plan_id: plan?.id ?? null,
      status: "active",
      seat_count: ACCOUNTS.length,
    });
    console.log("\n🏢 Created Demo Agency workspace");
  }

  console.log("👥 Assigning roles…");
  for (const acc of ACCOUNTS) {
    if (acc.platformAdmin) continue;
    const uid = userIds[acc.email];
    await admin.from("organization_members").upsert(
      { organization_id: orgId, user_id: uid, role: acc.role },
      { onConflict: "organization_id,user_id" },
    );
    console.log(`  ✓ ${acc.role.padEnd(10)} ${acc.email}`);
  }

  const platformId = userIds[PLATFORM_ADMIN_EMAIL];
  await admin.from("platform_admins").upsert({ user_id: platformId }, { onConflict: "user_id" });

  const ownerId = userIds["demo-owner@workpilot.dev"];
  const leadId = userIds["demo-lead@workpilot.dev"];

  const { data: existingProject } = await admin.from("projects").select("id").eq("organization_id", orgId).limit(1).maybeSingle();
  let projectId = existingProject?.id;
  if (!projectId) {
    const { data: project } = await admin.from("projects").insert({
      name: "Helios Redesign",
      client: "Helios Inc.",
      status: "in_progress",
      progress: 68,
      organization_id: orgId,
      owner_id: ownerId,
    }).select("id").single();
    projectId = project?.id;
  }

  const { count: taskCount } = await admin.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", orgId);
  if (!taskCount) {
    const { data: parentTask } = await admin.from("tasks").insert({
      title: "Review Q4 roadmap",
      status: "in_progress",
      priority: "high",
      organization_id: orgId,
      project_id: projectId,
      created_by: leadId,
      position: 0,
    }).select("id").single();

    if (parentTask) {
      await admin.from("tasks").insert([
        { title: "Gather stakeholder feedback", status: "done", priority: "medium", organization_id: orgId, project_id: projectId, parent_id: parentTask.id, created_by: leadId, position: 0 },
        { title: "Draft milestone plan", status: "todo", priority: "high", organization_id: orgId, project_id: projectId, parent_id: parentTask.id, created_by: leadId, position: 1 },
      ]);
      await admin.from("task_assignees").insert([
        { task_id: parentTask.id, user_id: leadId },
        { task_id: parentTask.id, user_id: userIds["demo-employee@workpilot.dev"] },
      ]);
    }
  }

  const { data: generalChannel } = await admin.from("channels").select("id").eq("organization_id", orgId).eq("name", "general").maybeSingle();
  if (!generalChannel) {
    await admin.from("channels").insert({
      name: "general",
      description: "Team-wide chat",
      organization_id: orgId,
      created_by: ownerId,
    });
  }

  console.log(`\n🛡️  Platform admin: ${PLATFORM_ADMIN_EMAIL}`);
  console.log("\n✅ Demo accounts ready!");
  console.log(`   Password for all: ${DEMO_PASSWORD}`);
  console.log("   Sign in at http://127.0.0.1:8080/auth\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
