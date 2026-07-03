import { createServerFn } from "@tanstack/react-start";
import type { AppRole } from "@/lib/users/permissions";

const DEMO_PASSWORD = "Wp9!kL2mNxQ7vR4sDemo";
const DEMO_ORG_SLUG = "demo-agency";
const PLATFORM_ADMIN_EMAIL = "polash.sahel@gmail.com";

type SeedAccount = {
  email: string;
  fullName: string;
  role: AppRole;
  platformAdmin?: boolean;
};

const ACCOUNTS: SeedAccount[] = [
  { email: PLATFORM_ADMIN_EMAIL, fullName: "Platform Admin", role: "owner", platformAdmin: true },
  { email: "demo-owner@workpilot.dev", fullName: "Demo Owner", role: "owner" },
  { email: "demo-admin@workpilot.dev", fullName: "Demo Admin", role: "admin" },
  { email: "demo-hr@workpilot.dev", fullName: "Demo HR", role: "hr" },
  { email: "demo-lead@workpilot.dev", fullName: "Demo Team Lead", role: "team_lead" },
  { email: "demo-employee@workpilot.dev", fullName: "Demo Employee", role: "employee" },
  { email: "demo-member@workpilot.dev", fullName: "Demo Member", role: "member" },
  { email: "demo-client@workpilot.dev", fullName: "Demo Client", role: "client" },
];

export const bootstrapDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const userIds: Record<string, string> = {};

  for (const acc of ACCOUNTS) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existing = list?.users?.find((u) => u.email === acc.email);
    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName },
      });
      userIds[acc.email] = existing.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName },
      });
      if (error) throw new Error(`${acc.email}: ${error.message}`);
      userIds[acc.email] = data.user.id;
    }
  }

  const { error: tableErr } = await supabaseAdmin.from("organizations").select("id").limit(1);
  if (tableErr) throw new Error("SaaS tables missing. Apply Supabase migrations first.");

  let orgId: string;
  const { data: existingOrg } = await supabaseAdmin.from("organizations").select("id").eq("slug", DEMO_ORG_SLUG).maybeSingle();
  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    const ownerId = userIds["demo-owner@workpilot.dev"];
    const { data: org, error } = await supabaseAdmin.from("organizations").insert({
      name: "Demo Agency",
      slug: DEMO_ORG_SLUG,
      status: "active",
      created_by: ownerId,
    }).select("id").single();
    if (error) throw error;
    orgId = org.id;

    const { data: plan } = await supabaseAdmin.from("subscription_plans").select("id").eq("slug", "growth").maybeSingle();
    await supabaseAdmin.from("organization_subscriptions").insert({
      organization_id: orgId,
      plan_id: plan?.id ?? null,
      status: "active",
      seat_count: ACCOUNTS.length,
    });
  }

  for (const acc of ACCOUNTS) {
    if (acc.platformAdmin) continue;
    await supabaseAdmin.from("organization_members").upsert(
      { organization_id: orgId, user_id: userIds[acc.email], role: acc.role },
      { onConflict: "organization_id,user_id" },
    );
  }

  await supabaseAdmin.from("platform_admins").upsert(
    { user_id: userIds[PLATFORM_ADMIN_EMAIL] },
    { onConflict: "user_id" },
  );

  const ownerId = userIds["demo-owner@workpilot.dev"];
  const leadId = userIds["demo-lead@workpilot.dev"];

  const { data: existingProject } = await supabaseAdmin.from("projects").select("id").eq("organization_id", orgId).limit(1).maybeSingle();
  let projectId = existingProject?.id;
  if (!projectId) {
    const { data: project } = await supabaseAdmin.from("projects").insert({
      name: "Helios Redesign",
      client: "Helios Inc.",
      status: "active",
      progress: 68,
      organization_id: orgId,
      owner_id: ownerId,
    }).select("id").single();
    projectId = project?.id;
  }

  const { count: taskCount } = await supabaseAdmin.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", orgId);
  if (!taskCount && projectId) {
    const { data: parentTask } = await supabaseAdmin.from("tasks").insert({
      title: "Review Q4 roadmap",
      status: "in_progress",
      priority: "high",
      organization_id: orgId,
      project_id: projectId,
      created_by: leadId,
      position: 0,
    }).select("id").single();

    if (parentTask) {
      await supabaseAdmin.from("tasks").insert([
        { title: "Gather stakeholder feedback", status: "done", priority: "medium", organization_id: orgId, project_id: projectId, parent_id: parentTask.id, created_by: leadId, position: 0 },
        { title: "Draft milestone plan", status: "todo", priority: "high", organization_id: orgId, project_id: projectId, parent_id: parentTask.id, created_by: leadId, position: 1 },
      ]);
      await supabaseAdmin.from("task_assignees").upsert([
        { task_id: parentTask.id, user_id: leadId },
        { task_id: parentTask.id, user_id: userIds["demo-employee@workpilot.dev"] },
      ], { onConflict: "task_id,user_id" });
    }
  }

  const { data: generalChannel } = await supabaseAdmin.from("channels").select("id").eq("organization_id", orgId).eq("name", "general").maybeSingle();
  if (!generalChannel) {
    await supabaseAdmin.from("channels").insert({
      name: "general",
      description: "Team-wide chat",
      organization_id: orgId,
      created_by: ownerId,
    });
  }

  return { ok: true, password: DEMO_PASSWORD };
});
