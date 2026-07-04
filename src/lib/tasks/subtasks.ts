import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesByIds } from "@/lib/tasks/org-members";
import type { TaskDetailRecord, TaskListItem } from "@/lib/tasks/types";

export async function fetchOrgSubtasksMap(orgId: string): Promise<Map<string, TaskListItem[]>> {
  const { data: rows, error } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, assignee_id, project_id, milestone_id, parent_id, created_by")
    .eq("organization_id", orgId)
    .not("parent_id", "is", null)
    .order("position");

  if (error) throw new Error(error.message);
  if (!rows?.length) return new Map();

  const taskIds = rows.map((row) => row.id);
  const { data: assigneeRows } = await supabase
    .from("task_assignees")
    .select("task_id, user_id")
    .in("task_id", taskIds);

  const assigneeByTask = new Map<string, string>();
  for (const row of rows) {
    if (row.assignee_id) assigneeByTask.set(row.id, row.assignee_id);
  }
  for (const row of assigneeRows ?? []) {
    if (!assigneeByTask.has(row.task_id)) assigneeByTask.set(row.task_id, row.user_id);
  }

  const assigneeIds = [...new Set(assigneeByTask.values())];
  const profileList = assigneeIds.length > 0
    ? await fetchProfilesByIds(assigneeIds, orgId)
    : [];
  const profileById = new Map(profileList.map((p) => [p.id, p]));

  const grouped = new Map<string, TaskListItem[]>();

  for (const row of rows) {
    if (!row.parent_id) continue;
    const assigneeId = assigneeByTask.get(row.id);
    const profile = assigneeId ? profileById.get(assigneeId) : null;
    const item: TaskListItem = {
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      due_date: row.due_date,
      assignee_id: assigneeId ?? row.assignee_id,
      project_id: row.project_id,
      milestone_id: row.milestone_id,
      created_by: row.created_by,
      profiles: profile
        ? {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            email: profile.email ?? null,
          }
        : null,
    };
    const list = grouped.get(row.parent_id) ?? [];
    list.push(item);
    grouped.set(row.parent_id, list);
  }

  return grouped;
}

export async function fetchSubtaskListItems(
  parentTaskId: string,
  orgId: string,
): Promise<TaskListItem[]> {
  const { data: rows, error } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, assignee_id, project_id, milestone_id, created_by")
    .eq("parent_id", parentTaskId)
    .order("position");

  if (error) throw new Error(error.message);
  if (!rows?.length) return [];

  const taskIds = rows.map((row) => row.id);
  const { data: assigneeRows } = await supabase
    .from("task_assignees")
    .select("task_id, user_id")
    .in("task_id", taskIds);

  const assigneeByTask = new Map<string, string>();
  for (const row of rows) {
    if (row.assignee_id) assigneeByTask.set(row.id, row.assignee_id);
  }
  for (const row of assigneeRows ?? []) {
    if (!assigneeByTask.has(row.task_id)) assigneeByTask.set(row.task_id, row.user_id);
  }

  const assigneeIds = [...new Set(assigneeByTask.values())];
  const profileList = assigneeIds.length > 0
    ? await fetchProfilesByIds(assigneeIds, orgId)
    : [];

  const profileById = new Map(profileList.map((p) => [p.id, p]));

  return rows.map((row) => {
    const assigneeId = assigneeByTask.get(row.id);
    const profile = assigneeId ? profileById.get(assigneeId) : null;
    return {
      ...row,
      assignee_id: assigneeId ?? row.assignee_id,
      profiles: profile
        ? {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            email: profile.email ?? null,
          }
        : null,
    };
  });
}

export async function fetchParentTaskSummary(parentId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, parent_id")
    .eq("id", parentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Pick<TaskDetailRecord, "id" | "title" | "parent_id"> | null;
}

export async function countSubtasks(parentTaskId: string): Promise<number> {
  const { count, error } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentTaskId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
