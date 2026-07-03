import { eachDateInRange } from "@/lib/attendance/date-utils";
import { DEFAULT_LEAVE_ALLOWANCES, LEAVE_TYPE_LABELS } from "@/lib/leave/constants";
import type { LeaveBalance, LeaveFormValues, LeaveOverview, LeaveRequest } from "@/lib/leave/types";

export function leaveTypeLabel(type: string): string {
  return LEAVE_TYPE_LABELS[type] ?? type;
}

export function computeLeaveDays(start: string, end: string, halfDay = false): number {
  const days = eachDateInRange(start, end).length;
  if (halfDay && start === end) return 0.5;
  return days;
}

export function formatLeaveDays(days: number): string {
  if (days === 0.5) return "0.5 day";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function formatDateRange(start: string, end: string): string {
  if (start === end) return start;
  return `${start} – ${end}`;
}

/** Newest submitted first. */
export function sortLeaveRequestsNewest(requests: LeaveRequest[]): LeaveRequest[] {
  return [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Upcoming/active team leave first, then by start date. */
export function sortLeaveRequestsForTeam(requests: LeaveRequest[], today: string): LeaveRequest[] {
  return [...requests].sort((a, b) => {
    const aActive =
      (a.status === "approved" || a.status === "pending") && a.end_date >= today;
    const bActive =
      (b.status === "approved" || b.status === "pending") && b.end_date >= today;
    if (aActive !== bActive) return aActive ? -1 : 1;
    const startCmp = a.start_date.localeCompare(b.start_date);
    if (startCmp !== 0) return startCmp;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function hasOverlappingLeave(
  existing: LeaveRequest[],
  start: string,
  end: string,
  excludeId?: string,
): boolean {
  return existing.some((r) => {
    if (excludeId && r.id === excludeId) return false;
    if (r.status === "rejected" || r.status === "cancelled") return false;
    return start <= r.end_date && end >= r.start_date;
  });
}

function normalizeLeaveType(type: string): string {
  return type === "personal" ? "casual" : type;
}

function leaveTypeMatches(requestType: string, balanceType: string): boolean {
  return normalizeLeaveType(requestType) === normalizeLeaveType(balanceType);
}

function yearBounds(year: number) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function requestOverlapsYear(request: LeaveRequest, year: number): boolean {
  const { start, end } = yearBounds(year);
  return request.start_date <= end && request.end_date >= start;
}

export function computeBalances(
  requests: LeaveRequest[],
  userId: string,
  year = new Date().getFullYear(),
): LeaveBalance[] {
  const approved = requests.filter(
    (r) =>
      r.user_id === userId &&
      r.status === "approved" &&
      requestOverlapsYear(r, year),
  );

  const pending = requests.filter(
    (r) =>
      r.user_id === userId &&
      r.status === "pending" &&
      requestOverlapsYear(r, year),
  );

  return ["annual", "sick", "casual"].map((type) => {
    const total = DEFAULT_LEAVE_ALLOWANCES[type] ?? 0;
    const used = approved
      .filter((r) => leaveTypeMatches(r.leave_type, type))
      .reduce((sum, r) => sum + computeLeaveDays(r.start_date, r.end_date, r.half_day), 0);
    const reserved = pending
      .filter((r) => leaveTypeMatches(r.leave_type, type))
      .reduce((sum, r) => sum + computeLeaveDays(r.start_date, r.end_date, r.half_day), 0);
    const remaining = Math.max(0, total - used - reserved);
    return {
      leave_type: type,
      label: leaveTypeLabel(type),
      total,
      used,
      reserved,
      remaining,
    };
  });
}

export function validateLeaveSubmission(
  values: LeaveFormValues,
  existing: LeaveRequest[],
  userId: string,
): { error?: string } {
  if (!values.start_date || !values.end_date) {
    return { error: "Start and end dates are required." };
  }
  if (values.end_date < values.start_date) {
    return { error: "End date cannot be before start date." };
  }

  const mine = existing.filter((r) => r.user_id === userId);
  if (hasOverlappingLeave(mine, values.start_date, values.end_date)) {
    return { error: "This leave overlaps with an existing request." };
  }

  const requestedDays = computeLeaveDays(values.start_date, values.end_date, values.half_day);
  const leaveType = normalizeLeaveType(values.leave_type);

  if (leaveType !== "unpaid" && DEFAULT_LEAVE_ALLOWANCES[leaveType] !== undefined) {
    const balances = computeBalances(existing, userId);
    const balance = balances.find((b) => b.leave_type === leaveType);
    if (balance && requestedDays > balance.remaining) {
      return {
        error: `Insufficient ${leaveTypeLabel(values.leave_type)} balance. ${formatLeaveDays(balance.remaining)} available.`,
      };
    }
  }

  return {};
}


export function computeOverview(requests: LeaveRequest[], today: string): LeaveOverview {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let onLeaveToday = 0;

  for (const r of requests) {
    if (r.status === "pending") pending += 1;
    else if (r.status === "approved") {
      approved += 1;
      if (today >= r.start_date && today <= r.end_date) onLeaveToday += 1;
    } else if (r.status === "rejected") rejected += 1;
  }

  return { pending, approved, rejected, onLeaveToday };
}

export function filterLeaveRequests(
  requests: LeaveRequest[],
  filters: {
    status?: string;
    leaveType?: string;
    userId?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
  },
  memberDepartments?: Map<string, string | null>,
): LeaveRequest[] {
  return requests.filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.leaveType && r.leave_type !== filters.leaveType) return false;
    if (filters.userId && r.user_id !== filters.userId) return false;
    if (filters.department && memberDepartments?.get(r.user_id) !== filters.department) return false;
    if (filters.startDate && r.end_date < filters.startDate) return false;
    if (filters.endDate && r.start_date > filters.endDate) return false;
    return true;
  });
}
