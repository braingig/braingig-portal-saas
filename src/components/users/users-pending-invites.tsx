import { useState } from "react";
import { Copy, MoreHorizontal, UserX } from "lucide-react";
import { RoleBadge } from "@/components/users/role-badge";
import { pendingGridClass } from "@/components/users/constants";
import { HighlightedText } from "@/components/ui/highlighted-text";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/format";
import type { PendingOrgInvite } from "@/lib/users/directory";
import { cn } from "@/lib/utils";

type UsersPendingInvitesProps = {
  invites: PendingOrgInvite[];
  totalCount: number;
  showWorkspace: boolean;
  searchQuery: string;
  busyInviteId: string | null;
  onCopyToken: (token: string, email: string) => void;
  onRevokeInvite: (invite: PendingOrgInvite) => Promise<void>;
};

export function UsersPendingInvites({
  invites,
  totalCount,
  showWorkspace,
  searchQuery,
  busyInviteId,
  onCopyToken,
  onRevokeInvite,
}: UsersPendingInvitesProps) {
  const [revokeTarget, setRevokeTarget] = useState<PendingOrgInvite | null>(null);

  if (totalCount === 0) return null;

  const gridClass = pendingGridClass(showWorkspace);
  const revoking = revokeTarget ? busyInviteId === revokeTarget.id : false;

  async function handleRevoke() {
    if (!revokeTarget) return;
    try {
      await onRevokeInvite(revokeTarget);
      setRevokeTarget(null);
    } catch {
      // Parent surfaces errors via toast.
    }
  }

  return (
    <>
      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium">Pending invites</p>
          <p className="text-xs text-muted-foreground">
            Users who have not joined the workspace yet. Use Manage to revoke an invite.
          </p>
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
          <div>Manage</div>
        </div>
        {invites.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No pending invites match your search.
          </p>
        ) : (
          invites.map((invite) => {
            const invitedAgo = formatRelativeTime(invite.createdAt);
            const isBusy = busyInviteId === invite.id;

            return (
              <div
                key={invite.id}
                className={cn(
                  "grid items-center gap-3 border-b border-border px-4 py-3 last:border-0",
                  gridClass,
                  isBusy && "opacity-60",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <HighlightedText text={invite.email} query={searchQuery} />
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Invited {invitedAgo ?? "recently"}
                  </p>
                </div>
                <div>
                  <RoleBadge role={invite.role} />
                </div>
                <p className="text-[10px] text-muted-foreground">Never logged in</p>
                {showWorkspace && <p className="text-[10px] text-muted-foreground">—</p>}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={isBusy}
                      className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Manage invite for ${invite.email}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[10rem]">
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 text-xs"
                      onClick={() => onCopyToken(invite.token, invite.email)}
                    >
                      <Copy className="size-3.5" />
                      Copy invite code
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                      onClick={() => setRevokeTarget(invite)}
                    >
                      <UserX className="size-3.5" />
                      Revoke invite
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !revoking) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invite?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the pending invite for{" "}
              <span className="font-medium text-foreground">{revokeTarget?.email}</span>.
              They will no longer be able to join using this invite code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRevoke();
              }}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? "Revoking…" : "Revoke invite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
