import type { EmailSendResult } from "@/lib/email/service.server";
import {
  sendInviteEmailFn,
  sendMemberJoinedEmailFn,
  sendOrganizationCreatedEmailFn,
  sendTaskAssignedEmailFn,
  sendTaskMentionEmailFn,
  sendTestEmailFn,
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

export { sendOrganizationCreatedEmailFn, sendTestEmailFn };
