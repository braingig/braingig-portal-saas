import type { AttendanceMember } from "@/lib/attendance/types";
import { teamMemberIds } from "@/lib/attendance/queries";
import { sortLeaveRequestsForTeam, sortLeaveRequestsNewest } from "@/lib/leave/calculations";
import type { LeaveRequest } from "@/lib/leave/types";
import type { AppRole } from "@/lib/users/permissions";

export function canReviewLeave(role: AppRole | null): boolean {
  return role === "owner" || role === "admin" || role === "hr";
}

/** Workspace members who can request leave (excludes client and unauthenticated). */
export function canRequestLeave(role: AppRole | null): boolean {
  if (!role || role === "client") return false;
  return (
    role === "owner"
    || role === "employee"
    || role === "member"
    || role === "admin"
    || role === "hr"
    || role === "team_lead"
  );
}

export function canViewTeamLeave(role: AppRole | null): boolean {
  return role === "owner" || role === "admin" || role === "hr" || role === "team_lead";
}

export function canApproveLeave(
  role: AppRole | null,
  currentUserId: string,
  requestUserId: string,
  members: AttendanceMember[],
): boolean {
  if (currentUserId === requestUserId) return false;
  if (canReviewLeave(role)) return true;
  if (role === "team_lead") {
    const teamIds = teamMemberIds(members, currentUserId);
    return teamIds.includes(requestUserId) && requestUserId !== currentUserId;
  }
  return false;
}

export function scopeLeaveUserIds(
  role: AppRole | null,
  currentUserId: string,
  teamUserIds: string[],
): string[] | null {
  if (canReviewLeave(role)) return null;
  if (role === "team_lead") return teamUserIds.length ? teamUserIds : [currentUserId];
  return [currentUserId];
}

/** Single source of truth for leave lists visible to the current user. */
export function scopeLeaveRequests(
  requests: LeaveRequest[],
  role: AppRole | null,
  currentUserId: string,
  teamUserIds: string[],
): LeaveRequest[] {
  const ids = scopeLeaveUserIds(role, currentUserId, teamUserIds);
  if (ids === null) return requests;
  return requests.filter((r) => ids.includes(r.user_id));
}

export function showEmployeeInLeaveLists(role: AppRole | null, scopedCount: number, isOrgWide: boolean): boolean {
  if (isOrgWide) return true;
  return role === "team_lead" && scopedCount > 1;
}

/** Personal leave history for the signed-in user. */
export function scopePersonalLeaveRequests(requests: LeaveRequest[], userId: string): LeaveRequest[] {
  return sortLeaveRequestsNewest(requests.filter((r) => r.user_id === userId));
}

/** Team leave visible to managers — org-wide for Owner/Admin/HR, direct reports for Team Lead. */
export function scopeTeamLeaveRequests(
  requests: LeaveRequest[],
  role: AppRole | null,
  currentUserId: string,
  teamUserIds: string[],
  today: string,
): LeaveRequest[] {
  if (!canViewTeamLeave(role)) return [];

  let pool: LeaveRequest[];
  if (canReviewLeave(role)) {
    pool = requests.filter((r) => r.user_id !== currentUserId);
  } else if (role === "team_lead") {
    const teamSet = new Set(teamUserIds);
    pool = requests.filter((r) => teamSet.has(r.user_id) && r.user_id !== currentUserId);
  } else {
    return [];
  }

  return sortLeaveRequestsForTeam(pool, today);
}
