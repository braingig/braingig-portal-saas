import { supabase } from "@/integrations/supabase/client";
import { leaveTypeLabel } from "@/lib/leave/calculations";
import type { LeaveRequest } from "@/lib/leave/types";
import { formatDate } from "@/lib/format";

async function insertNotifications(
  rows: {
    user_id: string;
    organization_id: string;
    type: string;
    title: string;
    body: string;
    entity_id?: string;
  }[],
) {
  if (!rows.length) return;
  await supabase.from("notifications").insert(
    rows.map((r) => ({
      ...r,
      link: "/leave",
      entity_type: "leave_request",
    })),
  );
}

export async function notifyLeaveSubmitted(
  orgId: string,
  request: LeaveRequest,
  requesterName: string,
  reviewerUserIds: string[],
) {
  const range = `${formatDate(request.start_date)} – ${formatDate(request.end_date)}`;
  const typeLabel = leaveTypeLabel(request.leave_type);

  await insertNotifications([
    ...reviewerUserIds.map((userId) => ({
      user_id: userId,
      organization_id: orgId,
      type: "leave_request",
      title: "New leave request",
      body: `${requesterName} requested ${typeLabel} (${range}).`,
      entity_id: request.id,
    })),
    {
      user_id: request.user_id,
      organization_id: orgId,
      type: "leave_request",
      title: "Leave request submitted",
      body: `Your ${typeLabel} request (${range}) has been submitted for review.`,
      entity_id: request.id,
    },
  ]);
}

export async function notifyLeaveReviewed(
  orgId: string,
  request: LeaveRequest,
  approved: boolean,
  reviewerName: string,
) {
  const range = `${formatDate(request.start_date)} – ${formatDate(request.end_date)}`;
  const typeLabel = leaveTypeLabel(request.leave_type);

  await insertNotifications([
    {
      user_id: request.user_id,
      organization_id: orgId,
      type: approved ? "leave_approved" : "leave_rejected",
      title: approved ? "Leave request approved" : "Leave request rejected",
      body: approved
        ? `Your ${typeLabel} leave (${range}) was approved by ${reviewerName}.`
        : `Your ${typeLabel} leave (${range}) was rejected by ${reviewerName}.`,
      entity_id: request.id,
    },
  ]);
}

export async function notifyLeaveComment(
  orgId: string,
  request: LeaveRequest,
  reviewerName: string,
  comment: string,
) {
  await insertNotifications([
    {
      user_id: request.user_id,
      organization_id: orgId,
      type: "leave_comment",
      title: "Comment on your leave request",
      body: `${reviewerName} commented: ${comment}`,
      entity_id: request.id,
    },
  ]);
}

export async function fetchReviewerUserIds(orgId: string, employeeUserId: string): Promise<string[]> {
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId)
    .in("role", ["owner", "admin", "hr"]);

  const reviewerIds = new Set((members ?? []).map((m) => m.user_id));

  const { data: employee } = await supabase
    .from("employees")
    .select("manager_id")
    .eq("organization_id", orgId)
    .eq("user_id", employeeUserId)
    .maybeSingle();

  if (employee?.manager_id) {
    const { data: manager } = await supabase
      .from("employees")
      .select("user_id")
      .eq("id", employee.manager_id)
      .maybeSingle();
    if (manager?.user_id) reviewerIds.add(manager.user_id);
  }

  return [...reviewerIds];
}
