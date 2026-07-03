import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LEAVE_SECTION_STACK } from "@/components/leave/leave-styles";
import { toDateKey } from "@/lib/attendance/date-utils";
import { teamMemberIds } from "@/lib/attendance/queries";
import { LeaveBalanceDrawer, LeaveBalancePreview } from "@/components/leave/leave-balance";
import { LeaveDetailDrawer } from "@/components/leave/leave-detail-drawer";
import { LeaveHistoryModal, LeaveHistoryPreview } from "@/components/leave/leave-history-table";
import { LeaveRequestFormModal } from "@/components/leave/leave-request-form-modal";
import { LeaveReviewModal } from "@/components/leave/leave-review-modal";
import { LeaveSummaryCards } from "@/components/leave/leave-summary-cards";
import { TeamLeaveDrawer, TeamLeavePreview } from "@/components/leave/team-leave-preview";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useRoles } from "@/hooks/use-role";
import { computeBalances, computeOverview } from "@/lib/leave/calculations";
import {
  canApproveLeave,
  canRequestLeave,
  canReviewLeave,
  canViewTeamLeave,
  scopeLeaveRequests,
  scopePersonalLeaveRequests,
  scopeTeamLeaveRequests,
} from "@/lib/leave/permissions";
import {
  addLeaveComment,
  loadLeavePageData,
  reviewLeaveRequest,
  submitLeaveRequest,
} from "@/lib/leave/queries";
import type { AttendanceMember } from "@/lib/attendance/types";
import type { LeaveFilters, LeaveFormValues, LeaveRequest } from "@/lib/leave/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function defaultFilters(): LeaveFilters {
  return {
    status: "",
    leaveType: "",
    userId: "",
    department: "",
    startDate: "",
    endDate: "",
  };
}

export function LeavePageContent() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const { primary: role } = useRoles();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [members, setMembers] = useState<AttendanceMember[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");
  const [selected, setSelected] = useState<LeaveRequest | null>(null);

  const [historyFilters, setHistoryFilters] = useState(defaultFilters);
  const [teamFilters, setTeamFilters] = useState(defaultFilters);

  const showTeam = canViewTeamLeave(role);
  const canRequest = canRequestLeave(role);
  const today = toDateKey();

  const teamIds = useMemo(() => {
    if (!user) return [] as string[];
    return teamMemberIds(members, user.id);
  }, [members, user]);

  const scopedRequests = useMemo(() => {
    if (!user) return [];
    return scopeLeaveRequests(requests, role, user.id, teamIds);
  }, [requests, role, user, teamIds]);

  const myRequests = useMemo(() => {
    if (!user) return [];
    return scopePersonalLeaveRequests(requests, user.id);
  }, [requests, user]);

  const teamRequests = useMemo(() => {
    if (!user) return [];
    return scopeTeamLeaveRequests(requests, role, user.id, teamIds, today);
  }, [requests, role, teamIds, today, user]);

  const teamDrawerMembers = useMemo(() => {
    if (canReviewLeave(role)) return members;
    return members.filter((m) => teamIds.includes(m.user_id));
  }, [members, role, teamIds]);

  const overview = useMemo(
    () => computeOverview(canReviewLeave(role) ? scopedRequests : myRequests, today),
    [scopedRequests, myRequests, role, today],
  );

  const balances = useMemo(() => {
    if (!user) return [];
    return computeBalances(requests, user.id);
  }, [requests, user]);

  const showEmployeeColumn = false;

  const recentEmptyDescription = canRequest
    ? "Request your first leave using the button above."
    : "Leave requests will appear here when submitted.";

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      const data = await loadLeavePageData(orgId);
      setRequests(data.requests);
      setMembers(data.members);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load leave data.");
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`leave-page-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests", filter: `organization_id=eq.${orgId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, load]);

  function openDetail(request: LeaveRequest) {
    setSelected(request);
    setDetailOpen(true);
  }

  function openReview(mode: "approve" | "reject") {
    setReviewMode(mode);
    setReviewOpen(true);
  }

  function openBalanceDrawer() {
    if (!user || balances.length === 0) return;
    setBalanceOpen(true);
  }

  async function handleSubmit(values: LeaveFormValues) {
    if (!user || !orgId) return;
    const requester = members.find((m) => m.user_id === user.id)?.full_name ?? "Member";
    const result = await submitLeaveRequest(orgId, user.id, values, requests, requester);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Leave request submitted.");
    await load();
  }

  async function handleReview(status: "approved" | "rejected", comment?: string) {
    if (!user || !orgId || !selected) return;
    if (selected.user_id === user.id) {
      toast.error("You cannot approve your own leave request.");
      return;
    }
    const reviewer = members.find((m) => m.user_id === user.id)?.full_name ?? "Reviewer";
    const result = await reviewLeaveRequest(orgId, user.id, reviewer, selected, status, comment);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(status === "approved" ? "Leave approved." : "Leave rejected.");
    setDetailOpen(false);
    setReviewOpen(false);
    await load();
  }

  async function handleComment(comment: string) {
    if (!user || !orgId || !selected) return;
    const reviewer = members.find((m) => m.user_id === user.id)?.full_name ?? "Reviewer";
    const result = await addLeaveComment(orgId, user.id, reviewer, selected, comment);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Comment added.");
    setDetailOpen(false);
    await load();
  }

  const canApproveSelected =
    selected && user
      ? canApproveLeave(role, user.id, selected.user_id, members)
      : false;

  if (!orgId) {
    return (
      <AppShell title="Leave">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Leave"
      subtitle="Manage leave requests and balances."
      actions={
        canRequest ? (
          <Button
            className="h-8 bg-brand text-brand-foreground hover:brightness-110"
            size="sm"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-1.5 size-3.5" />
            Request Leave
          </Button>
        ) : undefined
      }
    >
      <div className={LEAVE_SECTION_STACK}>
        <LeaveSummaryCards overview={overview} />
        <LeaveBalancePreview
          balances={balances}
          onViewDetails={openBalanceDrawer}
          showViewDetails={balances.length > 0}
        />
        <LeaveHistoryPreview
          requests={myRequests}
          onViewAll={() => setHistoryOpen(true)}
          onSelect={openDetail}
          showViewAll
          emptyDescription={recentEmptyDescription}
        />
        {showTeam && (
          <TeamLeavePreview
            requests={teamRequests}
            members={members}
            onViewAll={() => setTeamOpen(true)}
            onSelect={openDetail}
            showViewAll
          />
        )}
      </div>

      {canRequest && (
        <LeaveRequestFormModal
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
        />
      )}

      <LeaveHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        requests={myRequests}
        members={members}
        filters={historyFilters}
        onFiltersChange={setHistoryFilters}
        showEmployeeColumn={showEmployeeColumn}
        onSelect={openDetail}
      />

      {user && balances.length > 0 && (
        <LeaveBalanceDrawer
          open={balanceOpen}
          onOpenChange={setBalanceOpen}
          balances={balances}
          requests={myRequests}
          userId={user.id}
          onSelectRequest={(r) => {
            setBalanceOpen(false);
            openDetail(r);
          }}
        />
      )}

      {showTeam && (
        <TeamLeaveDrawer
          open={teamOpen}
          onOpenChange={setTeamOpen}
          requests={teamRequests}
          members={teamDrawerMembers}
          filters={teamFilters}
          onFiltersChange={setTeamFilters}
          onSelect={openDetail}
        />
      )}

      <LeaveDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        request={selected}
        canApprove={canApproveSelected}
        onOpenApprove={() => openReview("approve")}
        onOpenReject={() => openReview("reject")}
        onComment={canApproveSelected && selected?.status !== "pending" ? handleComment : undefined}
      />

      <LeaveReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        mode={reviewMode}
        request={selected}
        onConfirm={(comment) => handleReview(reviewMode === "approve" ? "approved" : "rejected", comment)}
      />
    </AppShell>
  );
}
