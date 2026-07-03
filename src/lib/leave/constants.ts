import type { LeaveStatus } from "@/lib/leave/types";

export const LEAVE_TYPES = ["annual", "sick", "casual", "unpaid"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  casual: "Casual Leave",
  unpaid: "Unpaid Leave",
  personal: "Casual Leave",
};

/** Default annual allowances — replaceable by leave policies in future. */
export const DEFAULT_LEAVE_ALLOWANCES: Record<string, number> = {
  annual: 15,
  sick: 10,
  casual: 5,
  unpaid: 0,
  personal: 5,
};

export const LEAVE_STATUSES: LeaveStatus[] = ["pending", "approved", "rejected", "cancelled"];

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const LEAVE_STATUS_STYLES: Record<LeaveStatus, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
  cancelled: "bg-muted text-muted-foreground",
};
