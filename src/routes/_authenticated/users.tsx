import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, ShieldOff, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MemberDetailDrawer } from "@/components/users/member-detail/member-detail-drawer";
import { UsersPendingInvites } from "@/components/users/users-pending-invites";
import { UsersTable } from "@/components/users/users-table";
import { UsersToolbar } from "@/components/users/users-toolbar";
import {
  ASSIGNABLE_ROLES,
  INVITE_ROLES,
  MEMBER_STATUS_LABEL,
} from "@/components/users/constants";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { usePlatformAdmin } from "@/hooks/use-platform-admin";
import { useRoles, ROLE_LABEL, type AppRole } from "@/hooks/use-role";
import { logAudit } from "@/lib/audit";
import {
  createWorkspaceInvite,
  loadMemberWorkspaces,
  loadOrganizationDirectory,
  loadPendingOrgInvites,
  revokeOrgInvite,
  updateMemberRole,
  updateMemberStatus,
  type MemberStatus,
  type OrgMember,
  type PendingOrgInvite,
} from "@/lib/users/directory";
import { sendInviteEmail } from "@/lib/email/notifications";
import {
  filterAndSortMembers,
  matchesMemberQuery,
  type MemberSort,
} from "@/lib/users/member-filters";
import { toast } from "sonner";

const STATUS_OPTIONS = (["active", "suspended"] as const).map((status) => ({
  value: status,
  label: MEMBER_STATUS_LABEL[status],
}));

const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABEL[role],
}));

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "User Management · WorkPilot" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const { has, loading: roleLoading } = useRoles();
  const { isPlatformAdmin, loading: platformLoading } = usePlatformAdmin();
  const isOwner = has("owner") || has("admin");

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [memberWorkspaces, setMemberWorkspaces] = useState<Map<string, string[]>>(new Map());
  const [pendingInvites, setPendingInvites] = useState<Awaited<ReturnType<typeof loadPendingOrgInvites>>>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("admin");
  const [lastToken, setLastToken] = useState<{ email: string; token: string } | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "all">("all");
  const [sort, setSort] = useState<MemberSort>("last_login");
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showWorkspace = isPlatformAdmin;

  async function load() {
    if (!orgId) return;
    setLoading(true);
    try {
      const [directory, invites] = await Promise.all([
        loadOrganizationDirectory(orgId),
        loadPendingOrgInvites(orgId),
      ]);
      setMembers(directory);
      setPendingInvites(invites);

      if (isPlatformAdmin && directory.length > 0) {
        const workspaces = await loadMemberWorkspaces(directory.map((m) => m.userId));
        setMemberWorkspaces(workspaces);
      } else {
        setMemberWorkspaces(new Map());
      }

      setSelectedMember((current) => {
        if (!current) return null;
        return directory.find((m) => m.userId === current.userId) ?? null;
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOwner && orgId) load();
    else setLoading(false);
  }, [isOwner, orgId, isPlatformAdmin]);

  async function setRole(member: OrgMember, newRole: AppRole) {
    if (!orgId || member.role === newRole) return;
    setBusyUserId(member.userId);
    try {
      await updateMemberRole(orgId, member.userId, newRole);
      await logAudit("role.assigned", "user", member.userId, { role: newRole });
      toast.success(`Role updated for ${member.fullName ?? "member"}`);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyUserId(null);
    }
  }

  async function setStatus(member: OrgMember, status: MemberStatus) {
    if (!orgId || member.memberStatus === status) return;
    setBusyUserId(member.userId);
    try {
      await updateMemberStatus(orgId, member.userId, status);
      await logAudit("member.status_changed", "user", member.userId, { status });
      toast.success(`Account status updated for ${member.fullName ?? "member"}`);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusyUserId(null);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !orgId || !inviteEmail.trim()) return;
    try {
      const token = await createWorkspaceInvite(orgId, user.id, inviteEmail.trim(), inviteRole);
      setLastToken({ email: inviteEmail.trim(), token });
      const emailResult = await sendInviteEmail({
        orgId,
        toEmail: inviteEmail.trim(),
        token,
        role: inviteRole,
        inviterName: user.user_metadata?.full_name ?? user.email ?? undefined,
      });
      setInviteEmail("");
      if (emailResult.sent) {
        toast.success(`Invite email sent to ${inviteEmail.trim()}`);
      } else {
        toast.warning(`Invite created but email was not sent. Copy the token below. (${emailResult.reason ?? "unknown"})`);
      }
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    }
  }

  function copyToken(token: string, email?: string) {
    navigator.clipboard.writeText(token);
    toast.success(email ? `Invite code copied for ${email}` : "Copied to clipboard");
  }

  async function revokeInvite(invite: PendingOrgInvite) {
    if (!orgId) return;
    setBusyInviteId(invite.id);
    try {
      await revokeOrgInvite(orgId, invite.id);
      await logAudit("invite.revoked", "invite", invite.id, {
        email: invite.email,
        role: invite.role,
      });
      if (lastToken?.email === invite.email) {
        setLastToken(null);
      }
      toast.success(`Invite revoked for ${invite.email}`);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invite");
      throw err;
    } finally {
      setBusyInviteId(null);
    }
  }

  function openMemberDrawer(member: OrgMember) {
    setSelectedMember(member);
    setDrawerOpen(true);
  }

  const filteredMembers = useMemo(
    () => filterAndSortMembers(members, { query: search, role: roleFilter, status: statusFilter, sort }),
    [members, search, roleFilter, statusFilter, sort],
  );

  const filteredInvites = useMemo(
    () => pendingInvites.filter((invite) => matchesMemberQuery(
      {
        userId: invite.id,
        email: invite.email,
        fullName: invite.email,
        avatarUrl: null,
        jobTitle: null,
        role: invite.role,
        joinedAt: invite.createdAt,
        lastLoginAt: null,
        memberStatus: "active",
        customPermissions: null,
      },
      search,
    )),
    [pendingInvites, search],
  );

  const drawerCanEdit = selectedMember
    ? selectedMember.userId !== user?.id && selectedMember.role !== "owner"
    : false;

  if (roleLoading || platformLoading || loading) {
    return (
      <AppShell title="User Management">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (!isOwner || !orgId) {
    return (
      <AppShell title="User Management">
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <ShieldOff className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-semibold">Access restricted</p>
          <p className="mt-1 text-sm text-muted-foreground">Only Owners and Admins can manage users.</p>
        </div>
      </AppShell>
    );
  }

  const activeCount = members.filter((m) => m.memberStatus === "active").length;
  const hasFilters = Boolean(search.trim()) || roleFilter !== "all" || statusFilter !== "all";

  return (
    <AppShell
      title="User Management"
      subtitle={`${filteredMembers.length} of ${members.length} members · ${activeCount} active · ${pendingInvites.length} pending invites`}
    >
      <form onSubmit={invite} className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <input
          required
          type="email"
          placeholder="Invite email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="min-w-[200px] flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as AppRole)}
          className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          {INVITE_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          <UserPlus className="size-4" />
          Invite
        </button>
      </form>

      {lastToken && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Invite code for {lastToken.email}</p>
            <code className="mt-1 block truncate font-mono text-xs text-muted-foreground">{lastToken.token}</code>
          </div>
          <button
            type="button"
            onClick={() => copyToken(lastToken.token, lastToken.email)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-brand"
          >
            <Copy className="size-3.5" />
            Copy code
          </button>
        </div>
      )}

      <UsersToolbar
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sort={sort}
        onSortChange={setSort}
      />

      <UsersTable
        members={filteredMembers}
        orgId={orgId}
        currentUserId={user?.id}
        busyUserId={busyUserId}
        showWorkspace={showWorkspace}
        memberWorkspaces={memberWorkspaces}
        searchQuery={search}
        statusOptions={STATUS_OPTIONS}
        roleOptions={ROLE_OPTIONS}
        hasFilters={hasFilters}
        totalCount={members.length}
        onSelectMember={openMemberDrawer}
        onStatusChange={setStatus}
        onRoleChange={setRole}
        onSaved={load}
      />

      <UsersPendingInvites
        invites={filteredInvites}
        totalCount={pendingInvites.length}
        showWorkspace={showWorkspace}
        searchQuery={search}
        busyInviteId={busyInviteId}
        onCopyToken={copyToken}
        onRevokeInvite={revokeInvite}
      />

      <MemberDetailDrawer
        member={selectedMember}
        orgId={orgId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        canEdit={drawerCanEdit}
        isBusy={selectedMember ? busyUserId === selectedMember.userId : false}
        showWorkspace={showWorkspace}
        workspaces={selectedMember ? (memberWorkspaces.get(selectedMember.userId) ?? []) : []}
        onSaved={load}
      />
    </AppShell>
  );
}
