import { useMemo } from "react";
import { useOrganization } from "./use-organization";
import {
  ROLE_PERMS,
  resolveMemberPermissions,
  type AppRole,
  type Permission,
} from "@/lib/users/permissions";

export type { AppRole, Permission };
export { ROLE_PERMS };

export function useRoles() {
  const { memberships, orgId, loading } = useOrganization();

  const membership = useMemo(
    () => memberships.find((m) => m.organization_id === orgId),
    [memberships, orgId],
  );

  const roles: AppRole[] = membership ? [membership.role] : [];
  const perms = new Set<Permission>(
    membership
      ? resolveMemberPermissions(membership.role, membership.custom_permissions as Permission[] | null)
      : roles.flatMap((r) => ROLE_PERMS[r] ?? []),
  );
  const can = (p: Permission) => perms.has(p);
  const has = (r: AppRole) => roles.includes(r);
  const hasAny = (...rs: AppRole[]) => rs.some((r) => roles.includes(r));

  const primary: AppRole = roles.includes("owner") ? "owner"
    : roles.includes("admin") ? "admin"
    : roles.includes("hr") ? "hr"
    : roles.includes("team_lead") ? "team_lead"
    : roles.includes("client") ? "client"
    : roles[0] ?? "employee";

  return { roles, primary, loading, can, has, hasAny };
}

export { ROLE_LABEL } from "@/lib/users/permissions";
