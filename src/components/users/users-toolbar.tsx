import { Search } from "lucide-react";
import { ROLE_LABEL, type AppRole } from "@/lib/users/permissions";
import type { MemberStatus } from "@/lib/users/directory";
import type { MemberSort } from "@/lib/users/member-filters";
import {
  ASSIGNABLE_ROLES,
  TOOLBAR_SELECT_CLASS,
} from "@/components/users/constants";

type UsersToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: AppRole | "all";
  onRoleFilterChange: (value: AppRole | "all") => void;
  statusFilter: MemberStatus | "all";
  onStatusFilterChange: (value: MemberStatus | "all") => void;
  sort: MemberSort;
  onSortChange: (value: MemberSort) => void;
};

export function UsersToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
}: UsersToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-xs"
        />
      </div>
      <select
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value as AppRole | "all")}
        className={TOOLBAR_SELECT_CLASS}
        aria-label="Filter by role"
      >
        <option value="all">All roles</option>
        {ASSIGNABLE_ROLES.map((role) => (
          <option key={role} value={role}>{ROLE_LABEL[role]}</option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as MemberStatus | "all")}
        className={TOOLBAR_SELECT_CLASS}
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as MemberSort)}
        className={TOOLBAR_SELECT_CLASS}
        aria-label="Sort members"
      >
        <option value="last_login">Last login</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  );
}
