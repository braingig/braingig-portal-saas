import type { AppRole } from "@/lib/users/permissions";
import type { MemberStatus, OrgMember } from "@/lib/users/directory";

export type MemberSort = "last_login" | "newest" | "oldest";

export type MemberFilters = {
  query: string;
  role: AppRole | "all";
  status: MemberStatus | "all";
  sort: MemberSort;
};

export function matchesMemberQuery(member: OrgMember, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [member.fullName, member.email, member.jobTitle]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

export function filterAndSortMembers(members: OrgMember[], filters: MemberFilters) {
  let result = members.filter((member) => {
    if (!matchesMemberQuery(member, filters.query)) return false;
    if (filters.role !== "all" && member.role !== filters.role) return false;
    if (filters.status !== "all" && member.memberStatus !== filters.status) return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    if (filters.sort === "newest") {
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    }
    if (filters.sort === "oldest") {
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    }
    const aLogin = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
    const bLogin = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
    return bLogin - aLogin;
  });

  return result;
}
