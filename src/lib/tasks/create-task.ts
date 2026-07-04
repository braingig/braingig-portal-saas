import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { isMissingColumnError } from "@/lib/projects/upload-attachment";
import { uploadTaskFiles } from "./attachments";
import type { TaskFormValues } from "./constants";
import { extractMentionIdsFromHtml } from "@/lib/tasks/comment-mentions";
import { sendTaskAssignedEmails } from "@/lib/email/notifications";
import { notifyTaskMentions } from "@/lib/tasks/mention-notifications";
import type { TaskOrgMember } from "@/lib/tasks/types";

type CreateTaskInput = {
  orgId: string;
  userId: string;
  authorName: string;
  values: TaskFormValues;
  files: File[];
  mentionMembers?: TaskOrgMember[];
  parentId?: string | null;
  position?: number;
};

function buildBasePayload(
  values: TaskFormValues,
  orgId: string,
  userId: string,
  parentId?: string | null,
  position?: number,
) {
  return {
    title: values.title.trim(),
    organization_id: orgId,
    created_by: userId,
    status: values.status || "todo",
    priority: values.priority,
    position: position ?? 0,
    project_id: values.projectId || null,
    description: values.description || null,
    due_date: values.dueDate || null,
    assignee_id: values.assigneeIds[0] ?? null,
    ...(parentId ? { parent_id: parentId } : {}),
  };
}

function buildExtendedPayload(
  values: TaskFormValues,
  orgId: string,
  userId: string,
  parentId?: string | null,
  position?: number,
) {
  return {
    ...buildBasePayload(values, orgId, userId, parentId, position),
    note: values.note || null,
    estimated_hours: values.estimatedHours ? Number(values.estimatedHours) : null,
    milestone_id: values.milestoneId || null,
    start_date: values.startDate || null,
  };
}

export async function createTask({
  orgId,
  userId,
  authorName,
  values,
  files,
  mentionMembers = [],
  parentId,
  position,
}: CreateTaskInput) {
  let payload = buildExtendedPayload(values, orgId, userId, parentId, position);
  let usedFallback = false;

  let { data, error } = await supabase.from("tasks").insert(payload).select().single();

  if (error && isMissingColumnError(error)) {
    payload = buildBasePayload(values, orgId, userId, parentId, position);
    ({ data, error } = await supabase.from("tasks").insert(payload).select().single());
    usedFallback = true;
  }

  if (error) throw error;

  if (values.assigneeIds.length > 0) {
    const rows = values.assigneeIds.map((user_id) => ({
      task_id: data.id,
      user_id,
    }));
    const { error: assigneeError } = await supabase.from("task_assignees").insert(rows);
    if (assigneeError) console.warn("Failed to assign users:", assigneeError.message);
  }

  let uploadedCount = 0;
  if (files.length > 0) {
    const uploaded = await uploadTaskFiles(orgId, userId, data.id, files);
    uploadedCount = uploaded.length;
  }

  await logAudit("task.created", "task", data.id, {
    title: values.title,
    projectId: values.projectId || null,
    assigneeCount: values.assigneeIds.length,
    attachmentCount: uploadedCount,
    partialSave: usedFallback,
  });

  const taskTitle = values.title.trim();

  if (values.assigneeIds.length > 0) {
    await sendTaskAssignedEmails({
      orgId,
      taskId: data.id,
      taskTitle,
      assigneeUserIds: values.assigneeIds,
      assignerName: authorName,
    });
  }

  await Promise.all([
    notifyTaskMentions({
      mentionIds: extractMentionIdsFromHtml(values.description, mentionMembers),
      authorId: userId,
      authorName,
      taskId: data.id,
      taskTitle,
      orgId,
      context: "description",
    }),
    notifyTaskMentions({
      mentionIds: extractMentionIdsFromHtml(values.note, mentionMembers),
      authorId: userId,
      authorName,
      taskId: data.id,
      taskTitle,
      orgId,
      context: "note",
    }),
  ]);

  return {
    task: data,
    attachmentUploaded: uploadedCount > 0,
    attachmentsFailed: files.length > uploadedCount,
    needsMigration: usedFallback,
  };
}

export const TASK_MIGRATION_HINT =
  "Run supabase/migrations/20260619_task_fields.sql in your Supabase SQL Editor to save notes, estimated time, and folder.";
