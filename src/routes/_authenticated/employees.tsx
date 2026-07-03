import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmployeeFormModal } from "@/components/employees/employee-form-modal";
import { EmployeeWorkspaceBadge } from "@/components/employees/employee-workspace-badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useRoles } from "@/hooks/use-role";
import {
  createEmployeeWorkspaceInvite,
  fetchAcceptedInviteEmails,
  fetchPendingInvites,
  pendingInvitesByEmail,
  syncEmployeeWorkspaceLinks,
} from "@/lib/employees/invites";
import { sendInviteEmail } from "@/lib/email/notifications";
import {
  isVirtualEmployeeRecord,
  loadEmployeeDirectory,
} from "@/lib/employees/directory";
import {
  getEmployeeWorkspaceStatus,
  type EmployeeRecord,
} from "@/lib/employees/workspace-status";
import { logAudit } from "@/lib/audit";
import { formatCents, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({ meta: [{ title: "Employees · WorkPilot" }] }),
  component: EmployeesPage,
});

function salaryLabel(employee: EmployeeRecord) {
  const amount = formatCents(employee.salary_cents);
  if (!amount || amount === "—") return "—";
  if (employee.salary_type === "hourly") return `${amount}/hr`;
  return `${amount}/yr`;
}

function employeeDetailLine(employee: EmployeeRecord, skillsSnippet: string) {
  const parts = [
    skillsSnippet || employee.job_title || null,
    salaryLabel(employee) !== "—" ? salaryLabel(employee) : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function EmployeesPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const { hasAny } = useRoles();
  const canManage = hasAny("owner", "admin", "hr");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [memberUserIds, setMemberUserIds] = useState<Set<string>>(new Set());
  const [pendingByEmail, setPendingByEmail] = useState(pendingInvitesByEmail([]));
  const [acceptedEmails, setAcceptedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<{ email: string; token: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeRecord | null>(null);

  async function load() {
    if (!orgId) return;
    setLoading(true);

    if (canManage) {
      await syncEmployeeWorkspaceLinks(orgId);
    }

    const [employeeData, memberRes, inviteRes, acceptedRes] = await Promise.all([
      loadEmployeeDirectory(orgId),
      supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", orgId),
      canManage ? fetchPendingInvites(orgId) : Promise.resolve([]),
      canManage ? fetchAcceptedInviteEmails(orgId) : Promise.resolve(new Set<string>()),
    ]);

    const owners = new Set(
      (memberRes.data ?? []).filter((m) => m.role === "owner").map((m) => m.user_id),
    );
    const visibleEmployees = employeeData.filter(
      (employee) => !employee.user_id || !owners.has(employee.user_id),
    );

    setEmployees(visibleEmployees);
    setMemberUserIds(new Set((memberRes.data ?? []).map((m) => m.user_id)));
    setPendingByEmail(pendingInvitesByEmail(inviteRes));
    setAcceptedEmails(acceptedRes);
    setLoading(false);
  }

  async function openEdit(employee: EmployeeRecord) {
    if (!isVirtualEmployeeRecord(employee)) {
      setEditEmployee(employee);
      return;
    }

    if (!orgId) return;
    setLoading(true);
    const refreshed = await loadEmployeeDirectory(orgId);
    setEmployees(refreshed);
    setLoading(false);

    const linked = refreshed.find((row) => row.user_id === employee.user_id && !isVirtualEmployeeRecord(row));
    if (linked) {
      setEditEmployee(linked);
      return;
    }

    toast.error("Could not load HR record for this workspace member. Run the employee sync migration in Supabase.");
  }

  useEffect(() => { load(); }, [orgId, canManage]);

  async function remove(id: string) {
    if (!confirm("Remove employee record?")) return;
    await supabase.from("employees").delete().eq("id", id);
    load();
  }

  async function sendInvite(employee: EmployeeRecord) {
    if (!user || !orgId || !canManage) return;
    setInvitingId(employee.id);
    try {
      const token = await createEmployeeWorkspaceInvite(orgId, user.id, employee.email);
      setLastInvite({ email: employee.email, token });
      const emailResult = await sendInviteEmail({
        orgId,
        toEmail: employee.email,
        token,
        role: "employee",
        inviterName: user.user_metadata?.full_name ?? user.email ?? undefined,
      });
      if (emailResult.sent) {
        toast.success(`Invite email sent to ${employee.full_name}`);
      } else {
        toast.warning(`Invite created for ${employee.full_name} but email was not sent. Copy the token below.`);
      }
      await logAudit("employee.invited", "employee", employee.id, { email: employee.email });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setInvitingId(null);
    }
  }

  function copyInviteToken(token: string, email: string) {
    navigator.clipboard.writeText(token);
    toast.success(`Invite code copied for ${email}`);
  }

  if (!orgId) {
    return (
      <AppShell title="Employees">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  const linkedCount = employees.filter(
    (e) => getEmployeeWorkspaceStatus(e, memberUserIds, pendingByEmail, acceptedEmails) === "active",
  ).length;

  return (
    <AppShell
      title="Employees"
      subtitle={`${employees.length} employees · ${linkedCount} with workspace access`}
      actions={
        canManage ? (
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-brand text-brand-foreground hover:brightness-110"
          >
            <Plus className="size-4" />
            Add employee
          </Button>
        ) : undefined
      }
    >
      <EmployeeFormModal
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgId}
        onSuccess={load}
      />

      <EmployeeFormModal
        mode="edit"
        open={!!editEmployee}
        onOpenChange={(open) => { if (!open) setEditEmployee(null); }}
        orgId={orgId}
        employee={editEmployee}
        onSuccess={load}
      />

      {lastInvite && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Invite code for {lastInvite.email}</p>
            <code className="mt-1 block truncate text-xs font-mono text-muted-foreground">{lastInvite.token}</code>
          </div>
          <button
            type="button"
            onClick={() => copyInviteToken(lastInvite.token, lastInvite.email)}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand"
          >
            <Copy className="size-3.5" /> Copy code
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[1fr_1fr_110px_120px_100px_120px] gap-3 border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Name</div>
          <div>Email</div>
          <div>Department</div>
          <div>Workspace</div>
          <div>Hired</div>
          <div />
        </div>

        {loading && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading employees…</p>
        )}

        {!loading && employees.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No employee records yet.</p>
        )}

        {!loading && employees.map((employee) => {
          const isVirtual = isVirtualEmployeeRecord(employee);
          const workspaceStatus = getEmployeeWorkspaceStatus(
            employee,
            memberUserIds,
            pendingByEmail,
            acceptedEmails,
          );
          const pendingInvite = pendingByEmail.get(employee.email.trim().toLowerCase());
          const isBusy = invitingId === employee.id;
          const skillsSnippet = employee.skills?.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 2).join(", ");
          const detailLine = employeeDetailLine(employee, skillsSnippet);

          return (
            <div
              key={employee.id}
              className="grid grid-cols-[1fr_1fr_110px_120px_100px_120px] items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{employee.full_name}</p>
                {detailLine && (
                  <p className="text-[10px] text-muted-foreground">{detailLine}</p>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {employee.email || (isVirtual ? "Workspace member" : "—")}
              </p>
              <p className="text-xs">{employee.department ?? "—"}</p>
              <div>
                <EmployeeWorkspaceBadge status={workspaceStatus} />
              </div>
              <p className="text-xs">{formatDate(employee.hire_date)}</p>
              <div className="flex items-center justify-end gap-1">
                {canManage && !isVirtual && workspaceStatus === "not_invited" && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => sendInvite(employee)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-foreground transition-colors hover:bg-surface disabled:opacity-50"
                    title="Send workspace invite"
                  >
                    <UserPlus className="size-3" />
                    Invite
                  </button>
                )}
                {canManage && workspaceStatus === "pending" && pendingInvite && !isVirtual && (
                  <button
                    type="button"
                    onClick={() => copyInviteToken(pendingInvite.token, employee.email)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-foreground transition-colors hover:bg-surface"
                    title="Copy invite code"
                  >
                    <Copy className="size-3" />
                    Copy
                  </button>
                )}
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEdit(employee)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      aria-label={`Edit ${employee.full_name}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    {!isVirtual && (
                      <button
                        type="button"
                        onClick={() => remove(employee.id)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label={`Remove ${employee.full_name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
