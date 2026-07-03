import { supabase } from "@/integrations/supabase/client";
import { fetchMembers } from "@/lib/attendance/queries";
import { validateLeaveSubmission } from "@/lib/leave/calculations";
import type { LeaveFormValues, LeavePageData, LeaveRequest } from "@/lib/leave/types";
import {
  fetchReviewerUserIds,
  notifyLeaveComment,
  notifyLeaveReviewed,
  notifyLeaveSubmitted,
} from "@/lib/leave/notifications";
import { isMissingColumnError } from "@/lib/projects/upload-attachment";
import { PROJECT_ATTACHMENTS_BUCKET, getAttachmentPublicUrl } from "@/lib/projects/attachments";

function mapLeave(row: Record<string, unknown>): LeaveRequest {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    user_id: row.user_id as string,
    leave_type: row.leave_type as string,
    start_date: row.start_date as string,
    end_date: row.end_date as string,
    reason: (row.reason as string) ?? null,
    status: row.status as LeaveRequest["status"],
    half_day: Boolean(row.half_day),
    attachment_url: (row.attachment_url as string) ?? null,
    review_comment: (row.review_comment as string) ?? null,
    reviewed_by: (row.reviewed_by as string) ?? null,
    reviewed_at: (row.reviewed_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) ?? (row.created_at as string),
  };
}

async function attachNames(requests: LeaveRequest[]): Promise<LeaveRequest[]> {
  const userIds = [...new Set(requests.flatMap((r) => [r.user_id, r.reviewed_by].filter(Boolean) as string[]))];
  if (!userIds.length) return requests;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Member"]));

  return requests.map((r) => ({
    ...r,
    user_name: names.get(r.user_id),
    reviewer_name: r.reviewed_by ? names.get(r.reviewed_by) : undefined,
  }));
}

export async function loadLeavePageData(orgId: string): Promise<LeavePageData> {
  const [members, { data }] = await Promise.all([
    fetchMembers(orgId),
    supabase
      .from("leave_requests")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  const requests = await attachNames((data ?? []).map((row) => mapLeave(row as Record<string, unknown>)));
  return { requests, members };
}

async function uploadLeaveAttachment(
  orgId: string,
  requestId: string,
  file: File,
): Promise<string | null> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const path = `${orgId}/leave/${requestId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

  const { error } = await supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.warn("Leave attachment upload failed:", error.message);
    return null;
  }

  return getAttachmentPublicUrl(path);
}

export async function submitLeaveRequest(
  orgId: string,
  userId: string,
  values: LeaveFormValues,
  existing: LeaveRequest[],
  requesterName: string,
): Promise<{ error?: string; request?: LeaveRequest }> {
  const validation = validateLeaveSubmission(values, existing, userId);
  if (validation.error) return { error: validation.error };

  const payload: Record<string, unknown> = {
    organization_id: orgId,
    user_id: userId,
    leave_type: values.leave_type,
    start_date: values.start_date,
    end_date: values.end_date,
    reason: values.reason.trim() || null,
    half_day: values.half_day,
  };

  let { data, error } = await supabase.from("leave_requests").insert(payload).select("*").single();

  if (error && isMissingColumnError(error)) {
    delete payload.half_day;
    ({ data, error } = await supabase.from("leave_requests").insert(payload).select("*").single());
  }

  if (error || !data) return { error: error?.message ?? "Failed to submit leave request." };

  let request = mapLeave(data as Record<string, unknown>);

  if (values.attachment) {
    const url = await uploadLeaveAttachment(orgId, request.id, values.attachment);
    if (url) {
      const { data: updated, error: updateError } = await supabase
        .from("leave_requests")
        .update({ attachment_url: url })
        .eq("id", request.id)
        .select("*")
        .single();

      if (!updateError && updated) {
        request = mapLeave(updated as Record<string, unknown>);
      } else if (!isMissingColumnError(updateError ?? {})) {
        request = { ...request, attachment_url: url };
      }
    }
  }

  const [enriched] = await attachNames([{ ...request, user_name: requesterName }]);
  const reviewerIds = await fetchReviewerUserIds(orgId, userId);
  await notifyLeaveSubmitted(orgId, enriched, requesterName, reviewerIds.filter((id) => id !== userId));

  return { request: enriched };
}

export async function reviewLeaveRequest(
  orgId: string,
  reviewerId: string,
  reviewerName: string,
  request: LeaveRequest,
  status: "approved" | "rejected",
  comment?: string,
): Promise<{ error?: string; request?: LeaveRequest }> {
  if (reviewerId === request.user_id) {
    return { error: "You cannot approve your own leave request." };
  }

  const payload: Record<string, unknown> = {
    status,
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  };

  if (comment?.trim()) payload.review_comment = comment.trim();

  const { data, error } = await supabase
    .from("leave_requests")
    .update(payload)
    .eq("id", request.id)
    .select("*")
    .single();

  if (error) {
    if (isMissingColumnError(error) && comment?.trim()) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("leave_requests")
        .update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
        .eq("id", request.id)
        .select("*")
        .single();
      if (fallbackError || !fallback) return { error: fallbackError?.message ?? "Failed to review leave." };
      const updated = mapLeave(fallback as Record<string, unknown>);
      await notifyLeaveReviewed(orgId, { ...request, ...updated }, status === "approved", reviewerName);
      return { request: updated };
    }
    return { error: error.message };
  }

  const updated = mapLeave(data as Record<string, unknown>);
  const merged = { ...request, ...updated };

  await notifyLeaveReviewed(orgId, merged, status === "approved", reviewerName);

  return { request: updated };
}

export async function addLeaveComment(
  orgId: string,
  reviewerId: string,
  reviewerName: string,
  request: LeaveRequest,
  comment: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("leave_requests")
    .update({ review_comment: comment.trim() })
    .eq("id", request.id);

  if (error) {
    if (isMissingColumnError(error)) return { error: "Comments are not available yet. Run the latest migration." };
    return { error: error.message };
  }

  await notifyLeaveComment(orgId, request, reviewerName, comment.trim());
  return {};
}
