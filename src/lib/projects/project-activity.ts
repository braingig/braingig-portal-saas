import { supabase } from "@/integrations/supabase/client";
import { getProjectStatusMeta } from "@/lib/projects/status";
import { formatTaskAuditMessage, type TaskAuditRow } from "@/lib/tasks/task-audit";

export type ProjectActivityAudit = TaskAuditRow & {
  entity_id: string | null;
  entity_type: string | null;
};

function quoteTitle(title: string) {
  const trimmed = title.trim();
  return trimmed ? `"${trimmed}"` : "a task";
}

export function formatProjectActivityMessage(
  row: ProjectActivityAudit,
  nameOf: (id: string | null | undefined) => string,
  taskTitles: Map<string, string>,
): { text: string } {
  const meta = row.metadata ?? {};
  const actor = nameOf(row.actor_id);
  const taskTitle = row.entity_id ? taskTitles.get(row.entity_id) : undefined;
  const taskLabel = taskTitle ? quoteTitle(taskTitle) : "a task";

  if (row.action === "project.created") {
    return { text: `${actor} created this project` };
  }

  if (row.action === "project.updated") {
    const field = meta.field as string | undefined;
    if (field === "status" || meta.status) {
      const status = String(field === "status" ? meta.value ?? meta.status : meta.status);
      return { text: `${actor} set status to ${getProjectStatusMeta(status).label}` };
    }
    const attachments = Number(meta.attachmentCount ?? 0);
    if (attachments > 0) {
      return { text: `${actor} added ${attachments} file${attachments === 1 ? "" : "s"}` };
    }
    return { text: `${actor} updated project details` };
  }

  if (row.action === "project.deleted") {
    return { text: `${actor} deleted this project` };
  }

  if (row.action === "milestone.deleted") {
    return { text: `${actor} removed a folder` };
  }

  if (row.action === "task.created") {
    const title = meta.title ? String(meta.title) : taskTitle;
    return { text: `${actor} added task ${title ? quoteTitle(String(title)) : taskLabel}` };
  }

  if (row.action === "task.deleted") {
    const title = meta.title ? String(meta.title) : taskTitle;
    return { text: `${actor} deleted task ${title ? quoteTitle(title) : taskLabel}` };
  }

  if (row.action === "task.updated" && meta.field) {
    const { text } = formatTaskAuditMessage(row, nameOf);
    const message = text.replace("this task", taskLabel);
    if (taskTitle && !message.includes(taskLabel)) {
      return { text: `${message} on ${taskLabel}` };
    }
    return { text: message };
  }

  const { text, detail } = formatTaskAuditMessage(row, nameOf);

  if (row.action === "task.updated" && !meta.field && (meta.title || taskTitle)) {
    return { text: `${actor} updated task ${taskLabel}` };
  }

  if (row.action === "task.subtask.deleted") {
    const title = meta.subtaskTitle ? quoteTitle(String(meta.subtaskTitle)) : "a subtask";
    return { text: `${actor} deleted subtask ${title} on ${taskLabel}` };
  }

  if (row.action === "task.attachment.deleted") {
    const name = meta.fileName ? quoteTitle(String(meta.fileName)) : "a file";
    return { text: `${actor} removed ${name} from ${taskLabel}` };
  }

  if (row.action === "task.comment.deleted") {
    return { text: `${actor} deleted a comment on ${taskLabel}` };
  }

  let message = text
    .replace("this task", taskLabel)
    .replace("the description", `description on ${taskLabel}`)
    .replace("the internal note", `note on ${taskLabel}`);

  if (detail && !message.includes(detail)) {
    if (message.includes("renamed")) {
      message = `${actor} renamed task to ${quoteTitle(detail)}`;
    } else if (message.includes("assignees") && message.includes("updated")) {
      message = `${actor} assigned ${detail}`;
    }
  }

  return { text: message };
}

export async function fetchProjectActivityAudits(projectId: string, orgId: string) {
  const { data: taskRows, error: taskError } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("project_id", projectId);

  if (taskError) throw new Error(taskError.message);

  const taskTitles = new Map((taskRows ?? []).map((row) => [row.id, row.title]));
  const taskIds = [...taskTitles.keys()];

  const auditSelect =
    "id, action, actor_id, created_at, metadata, entity_id, entity_type" as const;

  const [projectRes, taskRes] = await Promise.all([
    supabase
      .from("audit_logs")
      .select(auditSelect)
      .eq("organization_id", orgId)
      .eq("entity_type", "project")
      .eq("entity_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50),
    taskIds.length > 0
      ? supabase
          .from("audit_logs")
          .select(auditSelect)
          .eq("organization_id", orgId)
          .eq("entity_type", "task")
          .in("entity_id", taskIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (projectRes.error) throw new Error(projectRes.error.message);
  if (taskRes.error) throw new Error(taskRes.error.message);

  const merged = [...(projectRes.data ?? []), ...(taskRes.data ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50) as ProjectActivityAudit[];

  return { audits: merged, taskTitles };
}
