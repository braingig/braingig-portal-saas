import type { AppRole } from "@/lib/users/permissions";
import type { MemberStatus } from "@/lib/users/directory";

export const ASSIGNABLE_ROLES: AppRole[] = [
  "owner", "admin", "hr", "team_lead", "employee", "client",
];

export const INVITE_ROLES: AppRole[] = ["admin", "hr", "team_lead", "client"];

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

export const MEMBER_STATUS_CLASS: Record<MemberStatus, string> = {
  active: "border-success/30 bg-success/10 text-success",
  suspended: "border-danger/30 bg-danger/10 text-danger",
};

export const TOOLBAR_SELECT_CLASS =
  "cursor-pointer rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs";

import { profileInitials } from "@/lib/avatars";

export function memberInitials(name: string | null) {
  return profileInitials(name);
}

export function tableGridClass(showWorkspace: boolean) {
  return showWorkspace
    ? "min-w-[920px] grid-cols-[minmax(180px,1.4fr)_88px_minmax(180px,1.8fr)_100px_120px_80px_40px]"
    : "min-w-[800px] grid-cols-[minmax(180px,1.4fr)_88px_minmax(180px,1.8fr)_100px_80px_40px]";
}

export function pendingGridClass(showWorkspace: boolean) {
  return showWorkspace
    ? "min-w-[720px] grid-cols-[minmax(180px,1.4fr)_96px_120px_120px_72px]"
    : "min-w-[600px] grid-cols-[minmax(180px,1.4fr)_96px_120px_72px]";
}
