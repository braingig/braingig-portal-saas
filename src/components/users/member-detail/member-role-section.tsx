import { ROLE_LABEL } from "@/lib/users/permissions";
import type { OrgMember } from "@/lib/users/directory";
import { MEMBER_STATUS_LABEL } from "@/components/users/constants";
import { RoleBadge } from "@/components/users/role-badge";
import { DetailField, MemberDetailSection } from "./member-detail-section";

type MemberRoleSectionProps = {
  member: OrgMember;
};

export function MemberRoleSection({ member }: MemberRoleSectionProps) {
  return (
    <MemberDetailSection title="Role">
      <div className="mb-3">
        <RoleBadge role={member.role} />
      </div>
      <div className="space-y-0.5">
        <DetailField label="Workspace role" value={ROLE_LABEL[member.role]} />
        <DetailField label="Account status" value={MEMBER_STATUS_LABEL[member.memberStatus]} />
      </div>
    </MemberDetailSection>
  );
}
