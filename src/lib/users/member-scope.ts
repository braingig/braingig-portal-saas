import type { AppRole } from "@/lib/users/permissions";

/** Workspace members in operational workflows (assignees, team page, mentions). Excludes client. */
export const STAFF_ROLES: AppRole[] = [
  "owner",
  "admin",
  "hr",
  "team_lead",
  "employee",
  "member",
];

/** Alias — assignable members match staff (owner included, client excluded). */
export const ASSIGNABLE_ROLES = STAFF_ROLES;

/** Members eligible for @-mentions in task comments. */
export const MENTIONABLE_ROLES: AppRole[] = STAFF_ROLES;

export function isStaffRole(role: string): role is AppRole {
  return STAFF_ROLES.includes(role as AppRole);
}
