import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import {
  getActiveTaskTimer,
  getTimerElapsedSeconds,
  setActiveTaskTimer,
} from "@/lib/task-timer";

export function isTaskAssignee(
  userId: string,
  assigneeIds: string[],
  legacyAssigneeId: string | null,
): boolean {
  return assigneeIds.includes(userId) || legacyAssigneeId === userId;
}

export function getTimerHintLabel(isTracking: boolean, isAssignee: boolean): string {
  if (isTracking) return "Stop timer";
  if (isAssignee) return "Start timer";
  return "Assignees only — click to start and assign yourself";
}

/** True when another task's timer is running and this task is not the active one. */
export function isTimerStartBlocked(isTrackingThisTask: boolean): boolean {
  if (isTrackingThisTask) return false;
  return getActiveTaskTimer() !== null;
}

type ToggleTaskTimerInput = {
  userId: string;
  userName: string;
  orgId: string;
  taskId: string;
  taskTitle: string;
  projectId: string | null;
  assigneeIds: string[];
  legacyAssigneeId: string | null;
};

export type ToggleTaskTimerResult =
  | { ok: true; action: "stopped" }
  | { ok: true; action: "started"; autoAssigned: boolean }
  | { ok: false; message: string };

async function assignUserToTask(
  taskId: string,
  userId: string,
  userName: string,
  assigneeIds: string[],
  legacyAssigneeId: string | null,
): Promise<string[] | null> {
  const merged = new Set(assigneeIds);
  if (legacyAssigneeId) merged.add(legacyAssigneeId);
  if (merged.has(userId)) return null;

  merged.add(userId);
  const idsToSet = [...merged];
  const primaryId = legacyAssigneeId ?? idsToSet[0];

  const { error: taskError } = await supabase
    .from("tasks")
    .update({ assignee_id: primaryId })
    .eq("id", taskId);
  if (taskError) throw new Error(taskError.message);

  await supabase.from("task_assignees").delete().eq("task_id", taskId);
  const { error: assigneeError } = await supabase.from("task_assignees").insert(
    idsToSet.map((user_id) => ({ task_id: taskId, user_id })),
  );
  if (assigneeError) throw new Error(assigneeError.message);

  await logAudit("task.assigned_via_timer", "task", taskId, {
    assigneeId: userId,
    assigneeName: userName,
    assigneeCount: idsToSet.length,
  });

  return idsToSet;
}

export async function toggleTaskTimer(input: ToggleTaskTimerInput): Promise<ToggleTaskTimerResult> {
  const {
    userId,
    userName,
    orgId,
    taskId,
    taskTitle,
    projectId,
    assigneeIds,
    legacyAssigneeId,
  } = input;

  const active = getActiveTaskTimer();

  if (active?.taskId === taskId) {
    const elapsed = getTimerElapsedSeconds(active);
    const { error } = await supabase.from("time_entries").insert({
      user_id: userId,
      task_id: taskId,
      project_id: projectId,
      organization_id: orgId,
      started_at: new Date(active.startedAt).toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: elapsed,
    });
    if (error) return { ok: false, message: error.message };
    setActiveTaskTimer(null);
    return { ok: true, action: "stopped" };
  }

  if (active) {
    return { ok: false, message: "Stop the timer on the other task first." };
  }

  let autoAssigned = false;
  const isAssignee = isTaskAssignee(userId, assigneeIds, legacyAssigneeId);

  if (!isAssignee) {
    try {
      const newIds = await assignUserToTask(
        taskId,
        userId,
        userName,
        assigneeIds,
        legacyAssigneeId,
      );
      if (newIds) autoAssigned = true;
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Failed to assign you to this task",
      };
    }
  }

  setActiveTaskTimer({
    taskId,
    taskTitle,
    projectId,
    startedAt: Date.now(),
    elapsedBefore: 0,
  });

  return { ok: true, action: "started", autoAssigned };
}
