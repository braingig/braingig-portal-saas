import { Copy } from "lucide-react";
import { RoleBadge } from "@/components/users/role-badge";
import { pendingGridClass } from "@/components/users/constants";
import { formatRelativeTime } from "@/lib/format";
import type { PendingOrgInvite } from "@/lib/users/directory";
import { cn } from "@/lib/utils";

type UsersPendingInvitesProps = {
  invites: PendingOrgInvite[];
  totalCount: number;
  showWorkspace: boolean;
  searchActive: boolean;
  onCopyToken: (token: string, email: string) => void;
};

export function UsersPendingInvites({
  invites,
  totalCount,
  showWorkspace,
  searchActive,
  onCopyToken,
}: UsersPendingInvitesProps) {
  if (totalCount === 0) return null;

  const gridClass = pendingGridClass(showWorkspace);

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-medium">Pending invites</p>
        <p className="text-xs text-muted-foreground">Users who have not joined the workspace yet.</p>
      </div>
      <div
        className={cn(
          "grid items-center gap-3 border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
          gridClass,
        )}
      >
        <div>User Account</div>
        <div>Role</div>
        <div>Last Login</div>
        {showWorkspace && <div>Workspace</div>}
        <div />
      </div>
      {invites.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No pending invites match your search.
        </p>
      ) : (
        invites.map((invite) => {
          const invitedAgo = formatRelativeTime(invite.createdAt);
          return (
            <div
              key={invite.id}
              className={cn(
                "grid items-center gap-3 border-b border-border px-4 py-3 last:border-0",
                gridClass,
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{invite.email}</p>
                <p className="text-[10px] text-muted-foreground">
                  Invited {invitedAgo ?? "recently"}
                </p>
              </div>
              <div>
                <RoleBadge role={invite.role} />
              </div>
              <p className="text-[10px] text-muted-foreground">Never logged in</p>
              {showWorkspace && <p className="text-[10px] text-muted-foreground">—</p>}
              <button
                type="button"
                onClick={() => onCopyToken(invite.token, invite.email)}
                className="inline-flex cursor-pointer items-center justify-end gap-1 text-xs font-medium text-brand"
              >
                <Copy className="size-3.5" />
                Copy
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
