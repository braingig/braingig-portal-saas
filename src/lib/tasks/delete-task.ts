import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { PROJECT_ATTACHMENTS_BUCKET } from "@/lib/projects/attachments";
import { listTaskAttachments } from "@/lib/tasks/attachments";
import type { AppRole } from "@/lib/users/permissions";

export function canDeleteTask(
  task: { created_by?: string | null },
  userId: string,
  hasAnyRole: (...roles: AppRole[]) => boolean,
): boolean {
  if (hasAnyRole("owner", "admin")) return true;
  return Boolean(task.created_by && task.created_by === userId);
}

async function collectTaskSubtreeIds(rootId: string): Promise<string[]> {
  const ids: string[] = [rootId];
  const { data, error } = await supabase.from("tasks").select("id").eq("parent_id", rootId);
  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const childIds = await collectTaskSubtreeIds(row.id);
    ids.push(...childIds);
  }

  return ids;
}

async function deleteAttachmentsForTasks(orgId: string, taskIds: string[]): Promise<void> {
  for (const taskId of taskIds) {
    let attachments: Awaited<ReturnType<typeof listTaskAttachments>>;
    try {
      attachments = await listTaskAttachments(orgId, taskId);
    } catch {
      continue;
    }

    if (attachments.length === 0) continue;

    const paths = attachments.map((a) => a.storage_path);
    await supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).remove(paths);

    const { error } = await supabase
      .from("file_assets")
      .delete()
      .in(
        "id",
        attachments.map((a) => a.id),
      );

    if (error) console.warn("Failed to delete task file records:", error.message);
  }
}

async function deleteTimeEntriesForTasks(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) return;

  const { error } = await supabase.from("time_entries").delete().in("task_id", taskIds);
  if (error) console.warn("Failed to delete time entries:", error.message);
}

export type DeleteTaskResult = {
  deletedIds: string[];
};

/** Deletes a task and its subtree, including attachments and related rows. */
export async function deleteTaskRecord(
  orgId: string,
  taskId: string,
  actorId?: string,
): Promise<DeleteTaskResult> {
  const { data: taskRow, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title, parent_id, project_id, created_by")
    .eq("id", taskId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  if (taskRow && actorId) {
    const { notifyTaskDeleted, resolveNotificationActorName } = await import(
      "@/lib/notifications/task-notifications"
    );
    const actorName = await resolveNotificationActorName(actorId);
    await notifyTaskDeleted({
      orgId,
      taskId: taskRow.id,
      taskTitle: taskRow.title,
      projectId: taskRow.project_id,
      actorId,
      actorName,
    }).catch((err) => console.warn("Task deleted notification failed:", err));
  }

  const taskIds = await collectTaskSubtreeIds(taskId);

  await deleteAttachmentsForTasks(orgId, taskIds);
  await deleteTimeEntriesForTasks(taskIds);

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);

  await logAudit("task.deleted", "task", taskId, {
    title: taskRow?.title ?? null,
    descendantCount: Math.max(0, taskIds.length - 1),
  });

  if (taskRow?.parent_id) {
    await logAudit("task.subtask.deleted", "task", taskRow.parent_id, {
      subtaskTitle: taskRow.title,
      subtaskId: taskId,
    });
  }

  return { deletedIds: taskIds };
}

export function taskDeleteConfirmMessage(options?: {
  isSubtask?: boolean;
  subtaskCount?: number;
}): string {
  if (options?.isSubtask) {
    return "Delete this subtask? This cannot be undone.";
  }

  const count = options?.subtaskCount ?? 0;
  if (count > 0) {
    return `Delete this task and ${count} subtask${count === 1 ? "" : "s"}? Comments, checklist items, and other related data will also be removed. This cannot be undone.`;
  }

  return "Delete this task? Comments, checklist items, attachments, and other related data will also be removed. This cannot be undone.";
}
