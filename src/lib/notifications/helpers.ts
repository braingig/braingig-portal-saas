import { supabase } from "@/integrations/supabase/client";

export type InAppNotificationRow = {
  user_id: string;
  organization_id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
};

export function uniqueUserIds(ids: string[], excludeId?: string | null): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!id || id === excludeId || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export async function insertInAppNotifications(rows: InAppNotificationRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.warn("Failed to create in-app notifications:", error.message);
}

export async function fetchOrgOwnerAndAdminIds(orgId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId)
    .in("role", ["owner", "admin"]);

  if (error) {
    console.warn("Failed to load org admins:", error.message);
    return [];
  }

  return uniqueUserIds((data ?? []).map((row) => row.user_id));
}

export async function fetchProjectOwnerId(projectId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load project owner:", error.message);
    return null;
  }

  return data?.owner_id ?? null;
}

export async function fetchTaskAssigneeIds(taskId: string): Promise<string[]> {
  const [taskRes, assigneeRes] = await Promise.all([
    supabase.from("tasks").select("assignee_id").eq("id", taskId).maybeSingle(),
    supabase.from("task_assignees").select("user_id").eq("task_id", taskId),
  ]);

  const ids: string[] = [];
  if (taskRes.data?.assignee_id) ids.push(taskRes.data.assignee_id);
  for (const row of assigneeRes.data ?? []) ids.push(row.user_id);
  return uniqueUserIds(ids);
}

export async function resolveActorName(userId: string, fallback = "Someone"): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  return data?.full_name?.trim() || fallback;
}

export function taskLink(taskId: string): string {
  return `/tasks/${taskId}`;
}

export function projectLink(projectId: string): string {
  return `/projects/${projectId}`;
}
