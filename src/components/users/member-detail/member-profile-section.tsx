import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { formatDate, formatDuration, formatLastLoginParts, formatRelativeTime } from "@/lib/format";
import type { OrgMember } from "@/lib/users/directory";
import { DetailField, MemberDetailSection } from "./member-detail-section";

type MemberProfileSectionProps = {
  member: OrgMember;
  assignedTaskCount: number;
  totalTrackedSeconds: number;
  showWorkspace?: boolean;
  workspaces?: string[];
};

export function MemberProfileSection({
  member,
  assignedTaskCount,
  totalTrackedSeconds,
  showWorkspace,
  workspaces = [],
}: MemberProfileSectionProps) {
  const login = formatLastLoginParts(member.lastLoginAt);
  const joinedAgo = formatRelativeTime(member.joinedAt);

  return (
    <MemberDetailSection title="Profile">
      <div className="mb-4 flex items-center gap-3">
        <ProfileAvatar
          userId={member.userId}
          name={member.fullName}
          avatarUrl={member.avatarUrl}
          email={member.email}
          size="xl"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{member.fullName ?? "Unnamed"}</p>
          <p className="truncate text-xs text-muted-foreground">{member.email ?? "—"}</p>
        </div>
      </div>
      <div className="space-y-0.5">
        <DetailField label="Job title" value={member.jobTitle ?? "—"} />
        <DetailField
          label="Last login"
          value={login ? `${login.time} · ${login.label}` : "Never logged in"}
        />
        <DetailField label="Joined" value={joinedAgo ? `${joinedAgo}` : formatDate(member.joinedAt)} />
        <DetailField label="Assigned tasks" value={String(assignedTaskCount)} />
        <DetailField label="Total tracked" value={totalTrackedSeconds > 0 ? formatDuration(totalTrackedSeconds) : "—"} />
        {showWorkspace && (
          <DetailField
            label="Workspaces"
            value={workspaces.length > 0 ? workspaces.join(", ") : "—"}
          />
        )}
      </div>
    </MemberDetailSection>
  );
}
