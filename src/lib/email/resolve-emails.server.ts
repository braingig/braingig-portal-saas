import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function resolveUserEmails(
  orgId: string,
  userIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return new Map();

  const map = new Map<string, string>();

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("user_id, email")
    .eq("organization_id", orgId)
    .in("user_id", unique);

  for (const row of employees ?? []) {
    if (row.user_id && row.email?.trim()) {
      map.set(row.user_id, row.email.trim());
    }
  }

  const missing = unique.filter((id) => !map.has(id));
  for (const userId of missing) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!error && data.user?.email?.trim()) {
      map.set(userId, data.user.email.trim());
    }
  }

  return map;
}

export async function resolveUserEmail(userId: string, orgId?: string): Promise<string | null> {
  if (orgId) {
    const map = await resolveUserEmails(orgId, [userId]);
    const email = map.get(userId);
    if (email) return email;
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user?.email?.trim()) return null;
  return data.user.email.trim();
}

export async function resolvePlatformAdminEmails(): Promise<string[]> {
  const emails = new Set<string>();

  const envEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim();
  if (envEmail) emails.add(envEmail);

  const { data: admins } = await supabaseAdmin
    .from("platform_admins")
    .select("user_id");

  for (const admin of admins ?? []) {
    const email = await resolveUserEmail(admin.user_id);
    if (email) emails.add(email);
  }

  return [...emails];
}

export async function resolveOrgAdminEmails(orgId: string): Promise<string[]> {
  const { data: members } = await supabaseAdmin
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId)
    .in("role", ["owner", "admin", "hr"]);

  const userIds = (members ?? []).map((m) => m.user_id);
  const emailMap = await resolveUserEmails(orgId, userIds);
  return [...new Set([...emailMap.values()].filter(Boolean))];
}
