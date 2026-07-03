import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Permission } from "@/hooks/use-role";

export type MemberStatus = "active" | "suspended";

export type OrgMember = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  role: AppRole;
  joinedAt: string;
  lastLoginAt: string | null;
  memberStatus: MemberStatus;
  customPermissions: Permission[] | null;
};

export type PendingOrgInvite = {
  id: string;
  email: string;
  role: AppRole;
  token: string;
  expiresAt: string;
  createdAt: string;
};

type DirectoryRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  role: AppRole;
  joined_at: string;
  last_login_at: string | null;
  member_status: MemberStatus;
  custom_permissions: string[] | null;
};

function mapDirectoryRow(row: DirectoryRow): OrgMember {
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    jobTitle: row.job_title,
    role: row.role,
    joinedAt: row.joined_at,
    lastLoginAt: row.last_login_at,
    memberStatus: row.member_status ?? "active",
    customPermissions: (row.custom_permissions as Permission[] | null) ?? null,
  };
}

async function loadDirectoryFallback(orgId: string): Promise<OrgMember[]> {
  const withExtras = await supabase
    .from("organization_members")
    .select("user_id, role, joined_at, status, custom_permissions")
    .eq("organization_id", orgId);

  const memberResult = withExtras.error
    ? await supabase
        .from("organization_members")
        .select("user_id, role, joined_at")
        .eq("organization_id", orgId)
    : withExtras;

  if (memberResult.error) throw memberResult.error;

  const memberRows = memberResult.data ?? [];
  const ids = memberRows.map((m) => m.user_id);
  if (!ids.length) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title")
    .in("id", ids);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return memberRows.map((m) => {
    const profile = profileMap.get(m.user_id);
    const row = m as {
      user_id: string;
      role: string;
      joined_at: string;
      status?: MemberStatus;
      custom_permissions?: string[] | null;
    };
    return {
      userId: row.user_id,
      email: null,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      jobTitle: profile?.job_title ?? null,
      role: row.role as AppRole,
      joinedAt: row.joined_at,
      lastLoginAt: null,
      memberStatus: row.status ?? "active",
      customPermissions: (row.custom_permissions as Permission[] | null) ?? null,
    };
  });
}

export async function loadOrganizationDirectory(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase.rpc("get_organization_directory", {
    _org_id: orgId,
  });

  if (error) {
    const missingRpc =
      error.code === "PGRST202"
      || error.code === "42883"
      || /get_organization_directory/i.test(error.message);
    if (missingRpc) {
      return loadDirectoryFallback(orgId);
    }
    throw error;
  }

  return ((data ?? []) as DirectoryRow[]).map(mapDirectoryRow);
}

export async function loadMemberWorkspaces(
  userIds: string[],
): Promise<Map<string, string[]>> {
  if (!userIds.length) return new Map();

  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, organizations(name)")
    .in("user_id", userIds);

  if (error) throw error;

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const orgName = (row.organizations as { name: string } | null)?.name;
    if (!orgName) continue;
    const existing = map.get(row.user_id) ?? [];
    if (!existing.includes(orgName)) existing.push(orgName);
    map.set(row.user_id, existing);
  }
  return map;
}

export async function loadPendingOrgInvites(orgId: string): Promise<PendingOrgInvite[]> {
  const { data, error } = await supabase
    .from("organization_invites")
    .select("id, email, role, token, expires_at, created_at")
    .eq("organization_id", orgId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as AppRole,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: AppRole,
): Promise<void> {
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("organization_id", orgId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateMemberStatus(
  orgId: string,
  userId: string,
  status: MemberStatus,
): Promise<void> {
  const { error } = await supabase
    .from("organization_members")
    .update({ status })
    .eq("organization_id", orgId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateMemberPermissions(
  orgId: string,
  userId: string,
  permissions: Permission[] | null,
): Promise<void> {
  const { error } = await supabase
    .from("organization_members")
    .update({ custom_permissions: permissions })
    .eq("organization_id", orgId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function createWorkspaceInvite(
  orgId: string,
  invitedBy: string,
  email: string,
  role: AppRole,
): Promise<string> {
  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: orgId,
      email: email.trim(),
      role,
      invited_by: invitedBy,
    })
    .select("token")
    .single();

  if (error) throw error;
  return data.token;
}
