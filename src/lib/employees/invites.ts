import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/use-role";
import type { PendingInvite } from "@/lib/employees/workspace-status";
import { normalizeEmail } from "@/lib/employees/workspace-status";

export async function createEmployeeWorkspaceInvite(
  orgId: string,
  invitedBy: string,
  email: string,
  role: AppRole = "employee",
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

export async function fetchPendingInvites(orgId: string): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from("organization_invites")
    .select("email, token")
    .eq("organization_id", orgId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString());

  if (error) throw error;
  return (data ?? []).map((row) => ({
    email: row.email,
    token: row.token,
  }));
}

/** Emails that have already accepted a workspace invite for this org. */
export async function fetchAcceptedInviteEmails(orgId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("organization_invites")
    .select("email")
    .eq("organization_id", orgId)
    .not("accepted_at", "is", null);

  if (error) throw error;
  return new Set((data ?? []).map((row) => normalizeEmail(row.email)));
}

export function pendingInvitesByEmail(invites: PendingInvite[]) {
  const map = new Map<string, PendingInvite>();
  for (const invite of invites) {
    map.set(normalizeEmail(invite.email), invite);
  }
  return map;
}

export async function syncEmployeeWorkspaceLinks(orgId: string): Promise<boolean> {
  const { error } = await supabase.rpc("link_organization_employees", { _org_id: orgId });
  if (error) {
    console.warn("Employee link sync skipped:", error.message);
    return false;
  }
  return true;
}

export { ensureOrganizationEmployeeRecords } from "@/lib/employees/directory";

/** Called after a user joins — links their HR row by auth email (no admin role needed). */
export async function linkMyEmployeeRecord(): Promise<void> {
  const { error } = await supabase.rpc("link_my_employee_record");
  if (error) {
    console.warn("Self employee link skipped:", error.message);
  }
}
