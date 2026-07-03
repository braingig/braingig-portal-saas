import { MemberPermissionsEditor } from "@/components/users/member-permissions-editor";
import { PermissionBadges } from "@/components/users/permission-badges";
import { resolveMemberPermissions } from "@/lib/users/permissions";
import type { OrgMember } from "@/lib/users/directory";
import { MemberDetailSection } from "./member-detail-section";

type MemberPermissionsSectionProps = {
  orgId: string;
  member: OrgMember;
  canEdit: boolean;
  isBusy: boolean;
  onSaved: () => void;
};

export function MemberPermissionsSection({
  orgId,
  member,
  canEdit,
  isBusy,
  onSaved,
}: MemberPermissionsSectionProps) {
  const effective = resolveMemberPermissions(member.role, member.customPermissions);

  return (
    <MemberDetailSection title="Permissions">
      {member.role === "owner" ? (
        <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
          Full access
        </span>
      ) : (
        <div className="space-y-3">
          <PermissionBadges permissions={effective} max={8} />
          {canEdit && (
            <MemberPermissionsEditor
              orgId={orgId}
              member={member}
              disabled={isBusy}
              onSaved={onSaved}
            />
          )}
        </div>
      )}
    </MemberDetailSection>
  );
}
