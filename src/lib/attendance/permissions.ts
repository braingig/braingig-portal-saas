import type { AppRole } from "@/lib/users/permissions";

export function canManageAttendance(role: AppRole | null): boolean {
  return role === "owner" || role === "admin" || role === "hr";
}

export function canViewOrgSummary(role: AppRole | null): boolean {
  return canManageAttendance(role);
}

export function canViewTeamAttendance(role: AppRole | null): boolean {
  return role === "team_lead" || canManageAttendance(role);
}

export function canViewAllEmployees(role: AppRole | null): boolean {
  return canViewTeamAttendance(role);
}

export function scopeUserIds(
  role: AppRole | null,
  currentUserId: string,
  allUserIds: string[],
  teamUserIds: string[],
): string[] | null {
  if (canManageAttendance(role)) return null;
  if (role === "team_lead") return teamUserIds.length ? teamUserIds : [currentUserId];
  return [currentUserId];
}
