import { supabase } from "@/integrations/supabase/client";

/** Resolve member emails from HR employee records linked to workspace accounts. */
export async function fetchProfileEmails(
  orgId: string,
  userIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length || !orgId) return new Map();

  const { data, error } = await supabase
    .from("employees")
    .select("user_id, email")
    .eq("organization_id", orgId)
    .in("user_id", unique);

  if (error) {
    console.warn("Failed to load profile emails:", error.message);
    return new Map();
  }

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.user_id && row.email?.trim()) {
      map.set(row.user_id, row.email.trim());
    }
  }
  return map;
}

export function withProfileEmail<T extends { id: string }>(
  profile: T,
  emailMap: Map<string, string>,
): T & { email: string | null } {
  return {
    ...profile,
    email: emailMap.get(profile.id) ?? null,
  };
}
