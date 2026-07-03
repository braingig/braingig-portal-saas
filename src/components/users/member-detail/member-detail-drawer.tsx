import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { loadMemberDetail, type MemberDetail } from "@/lib/users/member-detail";
import type { OrgMember } from "@/lib/users/directory";
import { MemberActivitySection } from "./member-activity-section";
import { MemberPermissionsSection } from "./member-permissions-section";
import { MemberProfileSection } from "./member-profile-section";
import { MemberRoleSection } from "./member-role-section";
import { MemberSessionsSection } from "./member-sessions-section";

type MemberDetailDrawerProps = {
  member: OrgMember | null;
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  isBusy: boolean;
  showWorkspace?: boolean;
  workspaces?: string[];
  onSaved: () => void;
};

export function MemberDetailDrawer({
  member,
  orgId,
  open,
  onOpenChange,
  canEdit,
  isBusy,
  showWorkspace,
  workspaces,
  onSaved,
}: MemberDetailDrawerProps) {
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !member || !orgId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    loadMemberDetail(orgId, member.userId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, member, orgId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        {member && (
          <>
            <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
              <div className="flex items-center gap-3 pr-6">
                <ProfileAvatar
                  userId={member.userId}
                  name={member.fullName}
                  avatarUrl={member.avatarUrl}
                  email={member.email}
                  size="lg"
                />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">
                    {member.fullName ?? "Unnamed"}
                  </SheetTitle>
                  <SheetDescription className="truncate">
                    {member.email ?? "Workspace member"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <p className="px-5 py-8 text-sm text-muted-foreground">Loading details…</p>
              )}

              {!loading && detail && (
                <>
                  <MemberProfileSection
                    member={member}
                    assignedTaskCount={detail.assignedTaskCount}
                    totalTrackedSeconds={detail.totalTrackedSeconds}
                    showWorkspace={showWorkspace}
                    workspaces={workspaces}
                  />
                  <MemberRoleSection member={member} />
                  <MemberPermissionsSection
                    orgId={orgId}
                    member={member}
                    canEdit={canEdit}
                    isBusy={isBusy}
                    onSaved={onSaved}
                  />
                  <MemberSessionsSection
                    sessions={detail.sessions}
                    lastLoginAt={member.lastLoginAt}
                  />
                  <MemberActivitySection
                    taskActivity={detail.taskActivity}
                    auditEvents={detail.auditEvents}
                  />
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
