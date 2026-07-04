import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { isMissingColumnError } from "@/lib/projects/upload-attachment";
import { uploadTaskFiles } from "./attachments";
import type { TaskFormValues } from "./constants";
import { extractMentionIdsFromHtml } from "@/lib/tasks/comment-mentions";
import { sendTaskAssignedEmails } from "@/lib/email/notifications";
import { notifyTaskMentions } from "@/lib/tasks/mention-notifications";
import type { TaskOrgMember } from "@/lib/tasks/types";

type UpdateTaskInput = {
  taskId: string;
  orgId: string;
  userId: string;
  authorName: string;
  values: TaskFormValues;
  files: File[];
  mentionMembers?: TaskOrgMember[];
  previousDescription?: string | null;
  previousNote?: string | null;
  previousAssigneeIds?: string[];
};

function buildBasePayload(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    status: values.status || "todo",
    priority: values.priority,
    project_id: values.projectId || null,
    description: values.description || null,
    due_date: values.dueDate || null,
    assignee_id: values.assigneeIds[0] ?? null,
  };
}

function buildExtendedPayload(values: TaskFormValues) {
  return {
    ...buildBasePayload(values),
    note: values.note || null,
    estimated_hours: values.estimatedHours ? Number(values.estimatedHours) : null,
    milestone_id: values.milestoneId || null,
    start_date: values.startDate || null,
  };
}

async function syncAssignees(taskId: string, assigneeIds: string[]) {
  await supabase.from("task_assignees").delete().eq("task_id", taskId);
  if (assigneeIds.length === 0) return;

  const rows = assigneeIds.map((user_id) => ({ task_id: taskId, user_id }));
  const { error } = await supabase.from("task_assignees").insert(rows);
  if (error) console.warn("Failed to sync assignees:", error.message);
}

export async function updateTask({
  taskId,
  orgId,
  userId,
  authorName,
  values,
  files,
  mentionMembers = [],
  previousDescription,
  previousNote,
  previousAssigneeIds = [],
}: UpdateTaskInput) {
  let payload = buildExtendedPayload(values);
  let usedFallback = false;

  let { error } = await supabase.from("tasks").update(payload).eq("id", taskId);

  if (error && isMissingColumnError(error)) {
    payload = buildBasePayload(values);
    ({ error } = await supabase.from("tasks").update(payload).eq("id", taskId));
    usedFallback = true;
  }

  if (error) throw error;

  await syncAssignees(taskId, values.assigneeIds);

  let uploadedCount = 0;
  if (files.length > 0) {
    const uploaded = await uploadTaskFiles(orgId, userId, taskId, files);
    uploadedCount = uploaded.length;
  }

  await logAudit("task.updated", "task", taskId, {
    title: values.title,
    projectId: values.projectId || null,
    assigneeCount: values.assigneeIds.length,
    attachmentCount: uploadedCount,
    partialSave: usedFallback,
  });

  const taskTitle = values.title.trim();
  const previousAssignees = new Set(previousAssigneeIds);
  const newAssignees = values.assigneeIds.filter(
    (id) => id !== userId && !previousAssignees.has(id),
  );

  if (newAssignees.length > 0) {
    await sendTaskAssignedEmails({
      orgId,
      taskId,
      taskTitle,
      assigneeUserIds: newAssignees,
      assignerName: authorName,
    });
  }

  await Promise.all([
    notifyTaskMentions({
      mentionIds: extractMentionIdsFromHtml(values.description, mentionMembers),
      previousMentionIds: extractMentionIdsFromHtml(previousDescription ?? "", mentionMembers),
      authorId: userId,
      authorName,
      taskId,
      taskTitle,
      orgId,
      context: "description",
    }),
    notifyTaskMentions({
      mentionIds: extractMentionIdsFromHtml(values.note, mentionMembers),
      previousMentionIds: extractMentionIdsFromHtml(previousNote ?? "", mentionMembers),
      authorId: userId,
      authorName,
      taskId,
      taskTitle,
      orgId,
      context: "note",
    }),
  ]);

  return {
    attachmentUploaded: uploadedCount > 0,
    attachmentsFailed: files.length > uploadedCount,
    needsMigration: usedFallback,
  };
}
