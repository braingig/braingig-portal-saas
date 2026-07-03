import { UsersTableRow } from "@/components/users/users-table-row";
import { tableGridClass } from "@/components/users/constants";
import type { AppRole } from "@/lib/users/permissions";
import type { MemberStatus, OrgMember } from "@/lib/users/directory";
import { cn } from "@/lib/utils";

type UsersTableProps = {
  members: OrgMember[];
  orgId: string;
  currentUserId: string | undefined;
  busyUserId: string | null;
  showWorkspace: boolean;
  memberWorkspaces: Map<string, string[]>;
  statusOptions: { value: MemberStatus; label: string }[];
  roleOptions: { value: AppRole; label: string }[];
  hasFilters: boolean;
  totalCount: number;
  onSelectMember: (member: OrgMember) => void;
  onStatusChange: (member: OrgMember, status: MemberStatus) => void;
  onRoleChange: (member: OrgMember, role: AppRole) => void;
  onSaved: () => void;
};

export function UsersTable({
  members,
  orgId,
  currentUserId,
  busyUserId,
  showWorkspace,
  memberWorkspaces,
  statusOptions,
  roleOptions,
  hasFilters,
  totalCount,
  onSelectMember,
  onStatusChange,
  onRoleChange,
  onSaved,
}: UsersTableProps) {
  const gridClass = tableGridClass(showWorkspace);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div
        className={cn(
          "grid items-center gap-3 border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
          gridClass,
        )}
      >
        <div>User Account</div>
        <div>Role</div>
        <div>Permissions</div>
        <div>Last Login</div>
        {showWorkspace && <div>Workspace</div>}
        <div>Status</div>
        <div>Manage</div>
      </div>

      {totalCount === 0 && (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          No workspace members yet.
        </p>
      )}

      {totalCount > 0 && members.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {hasFilters ? "No members match your search or filters." : "No members to show."}
        </p>
      )}

      {members.map((member) => {
        const isSelf = member.userId === currentUserId;
        const isBusy = busyUserId === member.userId;
        const canEdit = !isSelf && member.role !== "owner";

        return (
          <UsersTableRow
            key={member.userId}
            member={member}
            gridClass={gridClass}
            orgId={orgId}
            isSelf={isSelf}
            isBusy={isBusy}
            canEdit={canEdit}
            showWorkspace={showWorkspace}
            workspaces={memberWorkspaces.get(member.userId) ?? []}
            statusOptions={statusOptions}
            roleOptions={roleOptions}
            onSelect={onSelectMember}
            onStatusChange={onStatusChange}
            onRoleChange={onRoleChange}
            onSaved={onSaved}
          />
        );
      })}
    </div>
  );
}
