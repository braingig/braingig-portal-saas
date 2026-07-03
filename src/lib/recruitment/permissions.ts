import type { AppRole } from "@/lib/users/permissions";

export function canManageRecruitment(role: AppRole | null): boolean {
  return role === "owner" || role === "admin" || role === "hr";
}
