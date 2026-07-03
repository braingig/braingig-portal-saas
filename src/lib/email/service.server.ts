import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmail } from "@/lib/email/send.server";
import {
  resolveOrgAdminEmails,
  resolvePlatformAdminEmails,
  resolveUserEmail,
  resolveUserEmails,
} from "@/lib/email/resolve-emails.server";
import { getAppUrl, getOrgNotificationEmail, readPlatformSmtp, resolveSmtpConfig } from "@/lib/email/smtp-config.server";
import {
  inviteEmailTemplate,
  memberJoinedEmailTemplate,
  organizationCreatedEmailTemplate,
  taskAssignedEmailTemplate,
  taskMentionEmailTemplate,
} from "@/lib/email/templates.server";

export type EmailSendResult = {
  sent: boolean;
  recipientCount?: number;
  reason?: string;
  message?: string;
};

async function loadOrg(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("name, slug, settings, created_by")
    .eq("id", orgId)
    .single();
  if (error || !data) throw new Error("Organization not found");
  return data;
}

async function sendWithSmtp(
  smtp: NonNullable<ReturnType<typeof readPlatformSmtp>>,
  to: string,
  subject: string,
  html: string,
  label: string,
): Promise<EmailSendResult> {
  try {
    await sendEmail(smtp, to, subject, html);
    console.info(`[email] ${label} sent to`, to);
    return { sent: true, recipientCount: 1 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] ${label} failed for`, to, "—", message);
    return { sent: false, reason: "send_failed", message };
  }
}

async function sendOrgEmail(
  orgId: string,
  to: string,
  subject: string,
  html: string,
  label: string,
): Promise<EmailSendResult> {
  const org = await loadOrg(orgId);
  const smtp = resolveSmtpConfig(org.settings);
  if (!smtp) {
    console.warn(`[email] ${label} skipped — SMTP not configured for org`, orgId);
    return { sent: false, reason: "smtp_not_configured" };
  }
  return sendWithSmtp(smtp, to, subject, html, label);
}

async function sendPlatformEmail(
  to: string,
  subject: string,
  html: string,
  label: string,
): Promise<EmailSendResult> {
  const smtp = readPlatformSmtp();
  if (!smtp) {
    console.warn(`[email] ${label} skipped — platform SMTP not configured`);
    return { sent: false, reason: "smtp_not_configured" };
  }
  return sendWithSmtp(smtp, to, subject, html, label);
}

async function sendToMany(
  send: (to: string) => Promise<EmailSendResult>,
  recipients: string[],
): Promise<EmailSendResult> {
  const unique = [...new Set(recipients.map((e) => e.trim()).filter(Boolean))];
  if (!unique.length) return { sent: false, reason: "no_recipients" };

  const results = await Promise.all(unique.map(send));
  const sentCount = results.filter((r) => r.sent).length;
  return {
    sent: sentCount > 0,
    recipientCount: sentCount,
    reason: sentCount === 0 ? results[0]?.reason : undefined,
    message: sentCount === 0 ? results[0]?.message : undefined,
  };
}

export async function resolveWorkspaceNotificationEmails(orgId: string, settings: unknown): Promise<string[]> {
  const configured = getOrgNotificationEmail(settings);
  if (configured) return [configured];
  return resolveOrgAdminEmails(orgId);
}

export async function sendOrganizationCreatedNotification(
  orgId: string,
  actorUserId: string,
): Promise<EmailSendResult> {
  const org = await loadOrg(orgId);
  if (org.created_by !== actorUserId) throw new Error("Forbidden");

  const creatorEmail = await resolveUserEmail(actorUserId);
  if (!creatorEmail) return { sent: false, reason: "no_creator_email" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", actorUserId)
    .maybeSingle();

  const creatorName = profile?.full_name?.trim() || creatorEmail;
  const { subject, html } = organizationCreatedEmailTemplate({
    orgName: org.name,
    orgSlug: org.slug,
    creatorName,
    creatorEmail,
    platformUrl: `${getAppUrl()}/platform/organizations`,
  });

  const recipients = await resolvePlatformAdminEmails();
  return sendToMany(
    (to) => sendPlatformEmail(to, subject, html, "organization created"),
    recipients,
  );
}

export async function sendInviteNotification(input: {
  orgId: string;
  toEmail: string;
  token: string;
  role: string;
  inviterName?: string;
}): Promise<EmailSendResult> {
  const org = await loadOrg(input.orgId);
  const inviteUrl = `${getAppUrl()}/auth`;
  const { subject, html } = inviteEmailTemplate({
    orgName: org.name,
    role: input.role,
    inviteCode: input.token,
    inviteUrl,
    inviterName: input.inviterName,
  });
  return sendOrgEmail(input.orgId, input.toEmail.trim(), subject, html, "workspace invite");
}

export async function sendMemberJoinedNotification(input: {
  orgId: string;
  memberUserId: string;
  role: string;
}): Promise<EmailSendResult> {
  const org = await loadOrg(input.orgId);
  const memberEmail = await resolveUserEmail(input.memberUserId, input.orgId);
  if (!memberEmail) return { sent: false, reason: "no_member_email" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", input.memberUserId)
    .maybeSingle();

  const memberName = profile?.full_name?.trim() || memberEmail;
  const { subject, html } = memberJoinedEmailTemplate({
    orgName: org.name,
    memberName,
    memberEmail,
    role: input.role,
  });

  const recipients = await resolveWorkspaceNotificationEmails(input.orgId, org.settings);
  return sendToMany(
    (to) => sendOrgEmail(input.orgId, to, subject, html, "member joined"),
    recipients,
  );
}

export async function sendTaskAssignedNotification(input: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  assigneeUserIds: string[];
  assignerUserId: string;
  assignerName: string;
}): Promise<EmailSendResult> {
  const org = await loadOrg(input.orgId);
  const assigneeIds = input.assigneeUserIds.filter((id) => id !== input.assignerUserId);
  if (!assigneeIds.length) return { sent: false, reason: "no_recipients" };

  const emailMap = await resolveUserEmails(input.orgId, assigneeIds);
  const taskUrl = `${getAppUrl()}/tasks/${input.taskId}`;
  const { subject, html } = taskAssignedEmailTemplate({
    orgName: org.name,
    assignerName: input.assignerName,
    taskTitle: input.taskTitle,
    taskUrl,
  });

  const recipients = assigneeIds
    .map((userId) => emailMap.get(userId))
    .filter((email): email is string => Boolean(email));

  return sendToMany(
    (to) => sendOrgEmail(input.orgId, to, subject, html, "task assigned"),
    recipients,
  );
}

export async function sendTaskMentionNotification(input: {
  orgId: string;
  taskId: string;
  taskTitle: string;
  mentionUserIds: string[];
  authorUserId: string;
  authorName: string;
  context: "description" | "note" | "comment";
}): Promise<EmailSendResult> {
  const org = await loadOrg(input.orgId);
  const mentionIds = input.mentionUserIds.filter((id) => id !== input.authorUserId);
  if (!mentionIds.length) return { sent: false, reason: "no_recipients" };

  const emailMap = await resolveUserEmails(input.orgId, mentionIds);
  const taskUrl = `${getAppUrl()}/tasks/${input.taskId}`;
  const { subject, html } = taskMentionEmailTemplate({
    orgName: org.name,
    authorName: input.authorName,
    taskTitle: input.taskTitle,
    context: input.context,
    taskUrl,
  });

  const recipients = mentionIds
    .map((userId) => emailMap.get(userId))
    .filter((email): email is string => Boolean(email));

  return sendToMany(
    (to) => sendOrgEmail(input.orgId, to, subject, html, "task mention"),
    recipients,
  );
}

export async function sendTestOrgEmail(orgId: string, toEmail: string): Promise<EmailSendResult> {
  const org = await loadOrg(orgId);
  const smtp = resolveSmtpConfig(org.settings);
  if (!smtp) throw new Error("SMTP is not configured. Set platform env vars or enable custom SMTP.");
  return sendWithSmtp(
    smtp,
    toEmail.trim(),
    "WorkPilot test email",
    `<p>This is a test email from <strong>${org.name}</strong> on WorkPilot.</p>`,
    "test",
  );
}
