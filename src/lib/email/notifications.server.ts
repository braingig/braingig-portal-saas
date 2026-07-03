import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  sendInviteNotification,
  sendMemberJoinedNotification,
  sendOrganizationCreatedNotification,
  sendTaskAssignedNotification,
  sendTaskMentionNotification,
  sendTestOrgEmail,
} from "@/lib/email/service.server";

async function assertOrgMember(userId: string, orgId: string) {
  const { data } = await supabaseAdmin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

async function assertCanManageInvites(userId: string, orgId: string) {
  const { data } = await supabaseAdmin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || !["owner", "admin", "hr"].includes(data.role)) {
    throw new Error("Forbidden");
  }
}

export const sendOrganizationCreatedEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { orgId: string }) => data)
  .handler(async ({ data, context }) => {
    return sendOrganizationCreatedNotification(data.orgId, context.userId);
  });

export const sendInviteEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    orgId: string;
    toEmail: string;
    token: string;
    role: string;
    inviterName?: string;
  }) => data)
  .handler(async ({ data, context }) => {
    await assertCanManageInvites(context.userId, data.orgId);
    return sendInviteNotification(data);
  });

export const sendMemberJoinedEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { orgId: string; memberUserId: string; role: string }) => data)
  .handler(async ({ data, context }) => {
    if (context.userId !== data.memberUserId) throw new Error("Forbidden");
    await assertOrgMember(data.memberUserId, data.orgId);
    return sendMemberJoinedNotification(data);
  });

export const sendTaskAssignedEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    orgId: string;
    taskId: string;
    taskTitle: string;
    assigneeUserIds: string[];
    assignerName: string;
  }) => data)
  .handler(async ({ data, context }) => {
    await assertOrgMember(context.userId, data.orgId);
    return sendTaskAssignedNotification({
      ...data,
      assignerUserId: context.userId,
    });
  });

export const sendTaskMentionEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    orgId: string;
    taskId: string;
    taskTitle: string;
    mentionUserIds: string[];
    authorName: string;
    context: "description" | "note" | "comment";
  }) => data)
  .handler(async ({ data, context }) => {
    await assertOrgMember(context.userId, data.orgId);
    return sendTaskMentionNotification({
      ...data,
      authorUserId: context.userId,
    });
  });

export const sendTestEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { orgId: string; toEmail: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", data.orgId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!member || !["owner", "admin"].includes(member.role)) {
      throw new Error("Forbidden");
    }
    return sendTestOrgEmail(data.orgId, data.toEmail);
  });
