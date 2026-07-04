import { supabase } from "@/integrations/supabase/client";

export type TaskChecklistAssignee = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export type TaskChecklistItem = {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  assignee_id: string | null;
  assignee: TaskChecklistAssignee | null;
  created_by: string | null;
  created_at: string;
};

export const TASK_CHECKLIST_MIGRATION_HINT =
  "Run supabase/migrations/20260706_task_checklist.sql in your Supabase SQL Editor to enable checklists.";

export const TASK_CHECKLIST_ASSIGNEE_MIGRATION_HINT =
  "Run supabase/migrations/20260706_task_checklist_assignee.sql in your Supabase SQL Editor to assign checklist items.";

function isMissingChecklistTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || error.message?.includes("task_checklist_items") === true;
}

type ChecklistRow = {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  assignee_id: string | null;
  created_by: string | null;
  created_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

function mapChecklistRow(row: ChecklistRow): TaskChecklistItem {
  return {
    id: row.id,
    task_id: row.task_id,
    title: row.title,
    is_completed: row.is_completed,
    position: row.position,
    assignee_id: row.assignee_id,
    assignee: row.assignee_id && row.profiles
      ? { id: row.assignee_id, full_name: row.profiles.full_name, avatar_url: row.profiles.avatar_url }
      : null,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

const CHECKLIST_SELECT =
  "id, task_id, title, is_completed, position, assignee_id, created_by, created_at, profiles:assignee_id(full_name, avatar_url)";

export async function fetchTaskChecklistItems(taskId: string): Promise<TaskChecklistItem[]> {
  const { data, error } = await supabase
    .from("task_checklist_items")
    .select(CHECKLIST_SELECT)
    .eq("task_id", taskId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingChecklistTable(error)) return [];
    if (error.message?.includes("assignee_id")) {
      const fallback = await supabase
        .from("task_checklist_items")
        .select("id, task_id, title, is_completed, position, created_by, created_at")
        .eq("task_id", taskId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (fallback.error) {
        if (isMissingChecklistTable(fallback.error)) return [];
        throw fallback.error;
      }
      return (fallback.data ?? []).map((row) => ({
        ...row,
        assignee_id: null,
        assignee: null,
      })) as TaskChecklistItem[];
    }
    throw error;
  }

  return (data ?? []).map((row) => mapChecklistRow(row as ChecklistRow));
}

export async function createTaskChecklistItem({
  taskId,
  title,
  position,
  userId,
  assigneeId,
}: {
  taskId: string;
  title: string;
  position: number;
  userId: string;
  assigneeId?: string | null;
}): Promise<TaskChecklistItem> {
  const basePayload = {
    task_id: taskId,
    title: title.trim(),
    position,
    created_by: userId,
  };

  let { data, error } = await supabase
    .from("task_checklist_items")
    .insert({
      ...basePayload,
      assignee_id: assigneeId ?? null,
    })
    .select(CHECKLIST_SELECT)
    .single();

  if (error?.message?.includes("assignee_id")) {
    ({ data, error } = await supabase
      .from("task_checklist_items")
      .insert(basePayload)
      .select("id, task_id, title, is_completed, position, created_by, created_at")
      .single());
    if (!error && data) {
      return { ...data, assignee_id: null, assignee: null } as TaskChecklistItem;
    }
  }

  if (error) throw error;
  return mapChecklistRow(data as ChecklistRow);
}

export async function updateTaskChecklistItem(
  id: string,
  patch: { title?: string; is_completed?: boolean; assignee_id?: string | null },
): Promise<TaskChecklistItem | void> {
  const needsReturn = patch.assignee_id !== undefined;
  const { data, error } = await supabase
    .from("task_checklist_items")
    .update(patch)
    .eq("id", id)
    .select(needsReturn ? CHECKLIST_SELECT : undefined)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapChecklistRow(data as ChecklistRow);
}

export async function deleteTaskChecklistItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("task_checklist_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
