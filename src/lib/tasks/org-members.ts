import { supabase } from "@/integrations/supabase/client";
import { fetchProfileEmails, withProfileEmail } from "@/lib/profile-emails";
import { STAFF_ROLES, MENTIONABLE_ROLES } from "@/lib/users/member-scope";
import type { TaskOrgMember } from "@/lib/tasks/types";

/** Load workspace members eligible for task assignment (excludes client). */
export async function fetchAssignableMembers(orgId: string): Promise<TaskOrgMember[]> {
  const { data: memberRows, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .in("role", STAFF_ROLES);

  if (membersError) {
    console.warn("Failed to load assignable members:", membersError.message);
    return [];
  }

  const ids = (memberRows ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title")
    .in("id", ids);

  if (profilesError) {
    console.warn("Failed to load member profiles:", profilesError.message);
    return [];
  }

  const emailMap = await fetchProfileEmails(orgId, ids);

  return (profiles ?? []).map((p) =>
    withProfileEmail(
      {
        id: p.id,
        full_name: p.full_name ?? "Unnamed",
        avatar_url: p.avatar_url,
        job_title: p.job_title ?? null,
      },
      emailMap,
    ),
  );
}

/** Load org members who can be @-mentioned in task comments. */
export async function fetchMentionableMembers(orgId: string): Promise<TaskOrgMember[]> {
  const { data: memberRows, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .in("role", MENTIONABLE_ROLES);

  if (membersError) {
    console.warn("Failed to load mentionable members:", membersError.message);
    return [];
  }

  const ids = (memberRows ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title")
    .in("id", ids);

  if (profilesError) {
    console.warn("Failed to load mentionable profiles:", profilesError.message);
    return [];
  }

  const emailMap = await fetchProfileEmails(orgId, ids);

  return (profiles ?? [])
    .map((p) =>
      withProfileEmail(
        {
          id: p.id,
          full_name: p.full_name ?? "Unnamed",
          avatar_url: p.avatar_url,
          job_title: p.job_title ?? null,
        },
        emailMap,
      ),
    )
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function fetchProfilesByIds(
  ids: string[],
  orgId?: string,
): Promise<TaskOrgMember[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title")
    .in("id", unique);

  if (error) {
    console.warn("Failed to load profiles:", error.message);
    return [];
  }

  const emailMap = orgId ? await fetchProfileEmails(orgId, unique) : new Map<string, string>();

  return (profiles ?? []).map((p) =>
    withProfileEmail(
      {
        id: p.id,
        full_name: p.full_name ?? "Unnamed",
        avatar_url: p.avatar_url,
        job_title: p.job_title ?? null,
      },
      emailMap,
    ),
  );
}
