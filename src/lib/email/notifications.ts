import type { EmailSendResult } from "@/lib/email/service.server";
import {
  sendInviteEmailFn,
  sendMemberJoinedEmailFn,
  sendOrganizationCreatedEmailFn,
  sendProjectMentionEmailFn,
  sendProjectTaskCreatedEmailFn,
  sendTaskAssignedEmailFn,
  sendTaskCommentEmailFn,
  sendTaskMentionEmailFn,
  sendTaskUrgentPriorityEmailFn,
  sendTestEmailFn,
  sendWorkspaceProjectCreatedEmailFn,
} from "@/lib/email/notifications.server";

function logEmailFailure(label: string, err: unknown) {
  console.warn(`[email] ${label} failed:`, err instanceof Error ? err.message : err);
}

export async function sendOrganizationCreatedEmail(params: { orgId: string }): Promise<EmailSendResult> {
  try {
    return await sendOrganizationCreatedEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("organization created", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendInviteEmail(params: {
  orgId: string;
  toEmail: string;
  token: string;
  role: string;
  inviterName?: string;
}): Promise<EmailSendResult> {
  try {
    return await sendInviteEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("invite", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendMemberJoinedEmail(params: {
  orgId: string;
  memberUserId: string;
  role: string;
}): Promise<EmailSendResult> {
  try {
    return await sendMemberJoinedEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("member joined", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendTaskAssignedEmails(params: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  assigneeUserIds: string[];
  assignerName: string;
}): Promise<EmailSendResult> {
  if (!params.assigneeUserIds.length) return { sent: false, reason: "no_recipients" };
  try {
    return await sendTaskAssignedEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("task assigned", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendTaskMentionEmails(params: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  mentionUserIds: string[];
  authorName: string;
  context: "description" | "note" | "comment";
}): Promise<EmailSendResult> {
  if (!params.mentionUserIds.length) return { sent: false, reason: "no_recipients" };
  try {
    return await sendTaskMentionEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("task mention", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendWorkspaceProjectCreatedEmails(params: {
  orgId: string;
  projectId: string;
  projectName: string;
  actorName: string;
}): Promise<EmailSendResult> {
  try {
    return await sendWorkspaceProjectCreatedEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("workspace project created", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendProjectTaskCreatedEmails(params: {
  orgId: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  assigneeUserIds: string[];
  actorName: string;
}): Promise<EmailSendResult> {
  try {
    return await sendProjectTaskCreatedEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("project task created", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendProjectMentionEmails(params: {
  orgId: string;
  projectId: string;
  projectName: string;
  mentionUserIds: string[];
  authorName: string;
  context: "description" | "note";
}): Promise<EmailSendResult> {
  if (!params.mentionUserIds.length) return { sent: false, reason: "no_recipients" };
  try {
    return await sendProjectMentionEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("project mention", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendTaskCommentEmails(params: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  assigneeUserIds: string[];
  authorName: string;
  excerpt: string;
}): Promise<EmailSendResult> {
  if (!params.assigneeUserIds.length) return { sent: false, reason: "no_recipients" };
  try {
    return await sendTaskCommentEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("task comment", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendTaskUrgentPriorityEmails(params: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  assigneeUserIds: string[];
  actorName: string;
}): Promise<EmailSendResult> {
  if (!params.assigneeUserIds.length) return { sent: false, reason: "no_recipients" };
  try {
    return await sendTaskUrgentPriorityEmailFn({ data: params });
  } catch (err) {
    logEmailFailure("task urgent priority", err);
    return { sent: false, reason: "request_failed", message: err instanceof Error ? err.message : String(err) };
  }
}

export { sendOrganizationCreatedEmailFn, sendTestEmailFn };
