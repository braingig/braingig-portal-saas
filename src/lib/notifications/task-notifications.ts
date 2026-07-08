import {
  sendProjectTaskCreatedEmails,
  sendTaskAssignedEmails,
  sendTaskCommentEmails,
  sendTaskUrgentPriorityEmails,
} from "@/lib/email/notifications";
import {
  fetchOrgOwnerAndAdminIds,
  fetchProjectOwnerId,
  fetchTaskAssigneeIds,
  insertInAppNotifications,
  projectLink,
  resolveActorName,
  taskLink,
  uniqueUserIds,
} from "@/lib/notifications/helpers";
import { supabase } from "@/integrations/supabase/client";

export type TaskAssignContext = "task" | "subtask" | "checklist";

function assignContextLabel(context: TaskAssignContext, checklistItemTitle?: string) {
  if (context === "subtask") return "a subtask";
  if (context === "checklist") {
    return checklistItemTitle ? `checklist item "${checklistItemTitle}"` : "a checklist item";
  }
  return "a task";
}

export async function notifyTaskAssignees({
  orgId,
  taskId,
  taskTitle,
  assigneeUserIds,
  actorId,
  actorName,
  context = "task",
  checklistItemTitle,
}: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  assigneeUserIds: string[];
  actorId: string;
  actorName: string;
  context?: TaskAssignContext;
  checklistItemTitle?: string;
}) {
  const recipients = uniqueUserIds(assigneeUserIds, actorId);
  if (recipients.length === 0) return;

  const label = assignContextLabel(context, checklistItemTitle);
  const title = context === "checklist" ? "Checklist item assigned" : "Task assigned to you";

  await insertInAppNotifications(
    recipients.map((userId) => ({
      user_id: userId,
      organization_id: orgId,
      type: "task_assigned",
      title,
      body: `${actorName} assigned you to ${label}: ${taskTitle}`,
      link: taskLink(taskId),
      entity_type: "task",
      entity_id: taskId,
    })),
  );

  await sendTaskAssignedEmails({
    orgId,
    taskId,
    taskTitle,
    assigneeUserIds: recipients,
    assignerName: actorName,
  });
}

export async function notifyProjectTaskCreated({
  orgId,
  projectId,
  taskId,
  taskTitle,
  assigneeUserIds,
  actorId,
  actorName,
}: {
  orgId: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  assigneeUserIds: string[];
  actorId: string;
  actorName: string;
}) {
  const { data: project } = await supabase
    .from("projects")
    .select("name, owner_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project?.name) return;

  const recipientIds = uniqueUserIds(
    [
      ...(await fetchOrgOwnerAndAdminIds(orgId)),
      project.owner_id ?? null,
      ...assigneeUserIds,
    ],
    actorId,
  );

  if (recipientIds.length === 0) return;

  await insertInAppNotifications(
    recipientIds.map((userId) => ({
      user_id: userId,
      organization_id: orgId,
      type: "project_task_created",
      title: "Task added to project",
      body: `${actorName} added "${taskTitle}" to ${project.name}`,
      link: taskLink(taskId),
      entity_type: "task",
      entity_id: taskId,
    })),
  );

  await sendProjectTaskCreatedEmails({
    orgId,
    projectId,
    projectName: project.name,
    taskId,
    taskTitle,
    assigneeUserIds,
    actorName,
  });
}

export async function notifyTaskComment({
  orgId,
  taskId,
  taskTitle,
  authorId,
  authorName,
  body,
  mentionedUserIds = [],
}: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  authorId: string;
  authorName: string;
  body: string;
  mentionedUserIds?: string[];
}) {
  const assigneeIds = await fetchTaskAssigneeIds(taskId);
  const mentionSet = new Set(mentionedUserIds);
  const recipients = uniqueUserIds(
    assigneeIds.filter((id) => !mentionSet.has(id)),
    authorId,
  );

  if (recipients.length === 0) return;

  const excerpt = body.trim().slice(0, 240) + (body.trim().length > 240 ? "…" : "");

  await insertInAppNotifications(
    recipients.map((userId) => ({
      user_id: userId,
      organization_id: orgId,
      type: "task_comment",
      title: "New comment on your task",
      body: `${authorName} commented on "${taskTitle}"`,
      link: taskLink(taskId),
      entity_type: "task",
      entity_id: taskId,
    })),
  );

  await sendTaskCommentEmails({
    orgId,
    taskId,
    taskTitle,
    assigneeUserIds: recipients,
    authorName,
    excerpt,
  });
}

export async function notifyTaskDeleted({
  orgId,
  taskId,
  taskTitle,
  projectId,
  actorId,
  actorName,
}: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  projectId: string | null;
  actorId: string;
  actorName: string;
}) {
  const assigneeIds = await fetchTaskAssigneeIds(taskId);
  const ownerId = projectId ? await fetchProjectOwnerId(projectId) : null;
  const recipientIds = uniqueUserIds(
    [
      ...(await fetchOrgOwnerAndAdminIds(orgId)),
      ownerId,
      ...assigneeIds,
    ],
    actorId,
  );

  if (recipientIds.length === 0) return;

  const link = projectId ? projectLink(projectId) : "/tasks";

  await insertInAppNotifications(
    recipientIds.map((userId) => ({
      user_id: userId,
      organization_id: orgId,
      type: "task_deleted",
      title: "Task deleted",
      body: `${actorName} deleted "${taskTitle}"`,
      link,
      entity_type: "task",
      entity_id: taskId,
    })),
  );
}

export async function notifyUrgentTaskPriority({
  orgId,
  taskId,
  taskTitle,
  assigneeUserIds,
  actorId,
  actorName,
}: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  assigneeUserIds: string[];
  actorId: string;
  actorName: string;
}) {
  const recipients = uniqueUserIds(assigneeUserIds, actorId);
  if (recipients.length === 0) return;

  await insertInAppNotifications(
    recipients.map((userId) => ({
      user_id: userId,
      organization_id: orgId,
      type: "task_urgent",
      title: "Urgent priority task",
      body: `${actorName} marked "${taskTitle}" as urgent`,
      link: taskLink(taskId),
      entity_type: "task",
      entity_id: taskId,
    })),
  );

  await sendTaskUrgentPriorityEmails({
    orgId,
    taskId,
    taskTitle,
    assigneeUserIds: recipients,
    actorName,
  });
}

export async function resolveNotificationActorName(userId: string): Promise<string> {
  return resolveActorName(userId);
}
