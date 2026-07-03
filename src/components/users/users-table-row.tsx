import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { MemberPermissionsEditor } from "@/components/users/member-permissions-editor";
import { MemberRoleMenu } from "@/components/users/member-role-menu";
import { HoverTableSelect } from "@/components/users/hover-table-select";
import { LastLoginCell } from "@/components/users/last-login-cell";
import { RoleBadge } from "@/components/users/role-badge";
import {
  MEMBER_STATUS_CLASS,
} from "@/components/users/constants";
import type { AppRole } from "@/lib/users/permissions";
import type { MemberStatus, OrgMember } from "@/lib/users/directory";
import { cn } from "@/lib/utils";

type UsersTableRowProps = {
  member: OrgMember;
  gridClass: string;
  orgId: string;
  isSelf: boolean;
  isBusy: boolean;
  canEdit: boolean;
  showWorkspace: boolean;
  workspaces: string[];
  statusOptions: { value: MemberStatus; label: string }[];
  roleOptions: { value: AppRole; label: string }[];
  onSelect: (member: OrgMember) => void;
  onStatusChange: (member: OrgMember, status: MemberStatus) => void;
  onRoleChange: (member: OrgMember, role: AppRole) => void;
  onSaved: () => void;
};

function stopRowClick(e: React.MouseEvent) {
  e.stopPropagation();
}

export function UsersTableRow({
  member,
  gridClass,
  orgId,
  isSelf,
  isBusy,
  canEdit,
  showWorkspace,
  workspaces,
  statusOptions,
  roleOptions,
  onSelect,
  onStatusChange,
  onRoleChange,
  onSaved,
}: UsersTableRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(member)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(member);
        }
      }}
      className={cn(
        "grid cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-surface/60",
        gridClass,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ProfileAvatar
          userId={member.userId}
          name={member.fullName}
          avatarUrl={member.avatarUrl}
          email={member.email}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{member.fullName ?? "Unnamed"}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {member.email ?? member.jobTitle ?? "—"}
          </p>
        </div>
      </div>

      <div onClick={stopRowClick}>
        <RoleBadge role={member.role} />
      </div>

      <div className="min-w-0" onClick={stopRowClick}>
        {member.role === "owner" ? (
          <span className="inline-flex w-fit rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
            Full access
          </span>
        ) : (
          <MemberPermissionsEditor
            orgId={orgId}
            member={member}
            disabled={!canEdit || isBusy}
            onSaved={onSaved}
          />
        )}
      </div>

      <LastLoginCell at={member.lastLoginAt} />

      {showWorkspace && (
        <div className="min-w-0">
          {workspaces.length > 0 ? (
            <p className="truncate text-[10px] text-muted-foreground" title={workspaces.join(", ")}>
              {workspaces.join(", ")}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">—</p>
          )}
        </div>
      )}

      <div onClick={stopRowClick}>
        <HoverTableSelect
          value={member.memberStatus}
          options={statusOptions}
          onChange={(status) => onStatusChange(member, status)}
          disabled={!canEdit || isBusy}
          variant="badge"
          badgeClassName={MEMBER_STATUS_CLASS[member.memberStatus]}
          aria-label={`Account status for ${member.fullName ?? "member"}`}
        />
      </div>

      <div onClick={stopRowClick}>
        <MemberRoleMenu
          role={member.role}
          options={roleOptions}
          onChange={(role) => onRoleChange(member, role)}
          disabled={isSelf || isBusy || member.role === "owner"}
        />
      </div>
    </div>
  );
}
