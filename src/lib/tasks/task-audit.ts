import { format, parseISO } from "date-fns";
import { logAudit } from "@/lib/audit";
import { getTaskStatusMeta } from "@/lib/tasks/status";

export type TaskAuditRow = {
  id: string;
  action: string;
  actor_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function formatDateValue(value: unknown): string {
  if (!value || typeof value !== "string") return "none";
  try {
    const d = value.includes("T") ? parseISO(value) : parseISO(`${value}T12:00:00`);
    return format(d, "MMM d, yyyy");
  } catch {
    return String(value);
  }
}

export function formatTaskAuditMessage(
  row: TaskAuditRow,
  nameOf: (id: string | null | undefined) => string,
): { text: string; detail?: string } {
  const meta = row.metadata ?? {};
  const actor = nameOf(row.actor_id);

  if (row.action === "task.created") {
    return { text: `${actor} created this task` };
  }

  if (row.action === "task.deleted") {
    const title = meta.title ? String(meta.title) : "this task";
    const descendants = Number(meta.descendantCount ?? 0);
    if (descendants > 0) {
      return {
        text: `${actor} deleted this task`,
        detail: `Including ${descendants} subtask${descendants === 1 ? "" : "s"}`,
      };
    }
    return { text: `${actor} deleted ${title}` };
  }

  if (row.action === "task.subtask.deleted") {
    const title = meta.subtaskTitle ? String(meta.subtaskTitle) : "a subtask";
    return { text: `${actor} deleted subtask`, detail: title };
  }

  if (row.action === "task.attachment.deleted") {
    const name = meta.fileName ? String(meta.fileName) : "a file";
    return { text: `${actor} removed attachment`, detail: name };
  }

  if (row.action === "task.comment.deleted") {
    return { text: `${actor} deleted a comment` };
  }

  if (row.action === "task.assigned_via_timer") {
    const assigneeName = meta.assigneeName ? String(meta.assigneeName) : nameOf(meta.assigneeId as string);
    return { text: `${assigneeName} was assigned by starting the timer` };
  }

  if (row.action === "task.updated") {
    const field = meta.field as string | undefined;

    if (field === "status" || meta.status) {
      const status = String(field === "status" ? meta.value : meta.status);
      const label = getTaskStatusMeta(status).label;
      return { text: `${actor} changed status to ${label}` };
    }

    if (field === "priority" || meta.priority) {
      const priority = String(field === "priority" ? meta.value : meta.priority);
      return { text: `${actor} changed priority to ${priority}` };
    }

    if (field === "due_date") {
      const value = meta.value;
      if (!value) return { text: `${actor} cleared the end date` };
      return { text: `${actor} set end date to ${formatDateValue(value)}` };
    }

    if (field === "start_date") {
      const value = meta.value;
      if (!value) return { text: `${actor} cleared the start date` };
      return { text: `${actor} set start date to ${formatDateValue(value)}` };
    }

    if (field === "estimated_hours") {
      const value = meta.value;
      if (value == null || value === "") return { text: `${actor} cleared the time estimate` };
      return { text: `${actor} set time estimate to ${value}h` };
    }

    if (field === "title") {
      const title = meta.value ? String(meta.value) : "untitled";
      return { text: `${actor} renamed this task`, detail: title };
    }

    if (field === "description") {
      return { text: `${actor} updated the description` };
    }

    if (field === "note") {
      return { text: `${actor} updated the internal note` };
    }

    if (field === "assignees" || meta.assigneeCount !== undefined) {
      const names = meta.assigneeNames as string[] | undefined;
      if (names?.length === 1) return { text: `${actor} assigned ${names[0]}` };
      if (names && names.length > 1) return { text: `${actor} updated assignees`, detail: names.join(", ") };
      const count = Number(meta.assigneeCount ?? 0);
      if (count === 0) return { text: `${actor} removed all assignees` };
      return { text: `${actor} updated assignees (${count})` };
    }

    if (meta.title && !field) {
      return { text: `${actor} updated this task`, detail: String(meta.title) };
    }
  }

  return { text: `${actor} updated this task` };
}

export async function logTaskFieldChange(
  taskId: string,
  field: string,
  value: unknown,
  previous?: unknown,
) {
  await logAudit("task.updated", "task", taskId, {
    field,
    value: value ?? null,
    previous: previous ?? null,
  });
}

export async function logTaskAssigneeChange(
  taskId: string,
  assigneeIds: string[],
  assigneeNames: string[],
) {
  await logAudit("task.updated", "task", taskId, {
    field: "assignees",
    assigneeCount: assigneeIds.length,
    assigneeIds,
    assigneeNames,
  });
}

export async function logTaskAttachmentDeleted(taskId: string, fileName: string) {
  await logAudit("task.attachment.deleted", "task", taskId, { fileName });
}

export async function logTaskCommentDeleted(taskId: string) {
  await logAudit("task.comment.deleted", "task", taskId, {});
}
