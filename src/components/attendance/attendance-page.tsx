import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AttendanceFormModal } from "@/components/attendance/attendance-form-modal";
import { EmployeeAttendanceDrawer } from "@/components/attendance/employee-detail-drawer";
import { HistoryModal, HistoryPreview } from "@/components/attendance/history-table";
import { MonthlySummaryDrawer, MonthlySummaryPreview } from "@/components/attendance/monthly-summary";
import { QuickActions } from "@/components/attendance/quick-actions";
import { ReportsModal } from "@/components/attendance/reports-modal";
import { ShiftsModal } from "@/components/attendance/shifts-modal";
import { TeamAttendanceDrawer, TeamAttendancePreview } from "@/components/attendance/team-attendance";
import type { TeamRow } from "@/components/attendance/team-attendance";
import { TimelineDrawer, TimelinePreview } from "@/components/attendance/timeline-drawer";
import { SECTION_STACK } from "@/components/attendance/attendance-styles";
import { ClockPanel } from "@/components/attendance/clock-panel";
import { TodaySummaryCards } from "@/components/attendance/today-summary";
import { WorkSummaryCard } from "@/components/attendance/work-summary";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useRoles } from "@/hooks/use-role";
import {
  computeBreakMinutes,
  computeOvertimeMinutes,
  computeWorkingMinutes,
  deriveStatus,
  getShiftForUser,
  summarizeMonth,
} from "@/lib/attendance/calculations";
import type { ClockState } from "@/lib/attendance/constants";
import { eachDateInRange, isDateInLeave, monthRange, toDateKey } from "@/lib/attendance/date-utils";
import {
  canManageAttendance,
  canViewOrgSummary,
  canViewTeamAttendance,
  scopeUserIds,
} from "@/lib/attendance/permissions";
import {
  assignShift,
  clockIn,
  clockOut,
  deleteAttendanceRecord,
  endBreak,
  fetchEvents,
  loadAttendancePageData,
  saveAttendanceRecord,
  saveShift,
  startBreak,
  teamMemberIds,
} from "@/lib/attendance/queries";
import type {
  AttendanceFilters,
  AttendanceFormValues,
  AttendanceMember,
  AttendanceRecord,
  AttendanceReport,
  TodaySummary,
  WorkSummary,
} from "@/lib/attendance/types";
import { toast } from "sonner";

function defaultFilters(): AttendanceFilters {
  const { start, end } = monthRange();
  return {
    startDate: start,
    endDate: end,
    userId: "",
    department: "",
    status: "",
    teamUserId: "",
  };
}

function buildTodaySummary(
  members: { user_id: string }[],
  todayRecords: AttendanceRecord[],
  leaveUserIdsToday: Set<string>,
): TodaySummary {
  const recordByUser = new Map(todayRecords.map((r) => [r.user_id, r]));
  let present = 0;
  let absent = 0;
  let late = 0;
  let onLeave = 0;
  let currentlyWorking = 0;

  for (const m of members) {
    if (leaveUserIdsToday.has(m.user_id)) {
      onLeave += 1;
      continue;
    }
    const rec = recordByUser.get(m.user_id);
    if (!rec?.clock_in) {
      absent += 1;
      continue;
    }
    if (!rec.clock_out) currentlyWorking += 1;
    if (rec.status === "late") late += 1;
    else present += 1;
  }

  return { present, absent, late, onLeave, currentlyWorking };
}

export function AttendancePageContent() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const { primary: role } = useRoles();

  const today = toDateKey();
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const [members, setMembers] = useState<AttendanceMember[]>([]);
  const [shifts, setShifts] = useState<Awaited<ReturnType<typeof loadAttendancePageData>>["shifts"]>([]);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [breaks, setBreaks] = useState<Awaited<ReturnType<typeof loadAttendancePageData>>["breaks"]>([]);
  const [leaveByUser, setLeaveByUser] = useState<Map<string, { start_date: string; end_date: string }[]>>(new Map());
  const [todayEvents, setTodayEvents] = useState<Awaited<ReturnType<typeof fetchEvents>>>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [teamFilter, setTeamFilter] = useState("");

  const [timelineOpen, setTimelineOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [shiftsOpen, setShiftsOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<AttendanceMember | null>(null);
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null);

  const manage = canManageAttendance(role);
  const showOrgSummary = canViewOrgSummary(role);
  const showTeam = canViewTeamAttendance(role);
  const showEmployeeColumn = manage || showTeam;

  const teamIds = useMemo(() => {
    if (!user) return [] as string[];
    return teamMemberIds(members, user.id);
  }, [members, user]);

  const scopedUserIds = useMemo(() => {
    if (!user) return [""];
    return scopeUserIds(role, user.id, members.map((m) => m.user_id), teamIds);
  }, [role, user, members, teamIds]);

  const visibleMembers = useMemo(() => {
    if (!scopedUserIds) return members;
    const set = new Set(scopedUserIds);
    return members.filter((m) => set.has(m.user_id));
  }, [members, scopedUserIds]);

  const leaveToday = useMemo(() => {
    const set = new Set<string>();
    for (const m of members) {
      const leaves = leaveByUser.get(m.user_id) ?? [];
      if (isDateInLeave(today, leaves)) set.add(m.user_id);
    }
    return set;
  }, [members, leaveByUser, today]);

  const myRecord = useMemo(
    () => todayRecords.find((r) => r.user_id === user?.id) ?? null,
    [todayRecords, user?.id],
  );

  const myBreaks = useMemo(
    () => breaks.filter((b) => b.record_id === myRecord?.id),
    [breaks, myRecord?.id],
  );

  const activeBreak = useMemo(() => myBreaks.find((b) => !b.ended_at) ?? null, [myBreaks]);

  const clockState: ClockState = useMemo(() => {
    if (user && leaveToday.has(user.id)) return "on_leave";
    if (!myRecord?.clock_in) return "not_started";
    if (myRecord.clock_out) return "checked_out";
    if (activeBreak) return "on_break";
    return "working";
  }, [user, leaveToday, myRecord, activeBreak]);

  const workSummary: WorkSummary = useMemo(() => {
    const breakMinutes = computeBreakMinutes(myBreaks);
    const workingMinutes = computeWorkingMinutes(myRecord?.clock_in ?? null, myRecord?.clock_out ?? null, breakMinutes);
    const shift = user ? getShiftForUser(user.id, shifts, assignments) : null;
    const overtimeMinutes = computeOvertimeMinutes(myRecord?.clock_out ?? null, today, shift);

    return {
      checkIn: myRecord?.clock_in ?? null,
      checkOut: myRecord?.clock_out ?? null,
      workingMinutes,
      breakMinutes,
      overtimeMinutes,
      lateMinutes: myRecord?.late_minutes ?? 0,
      clockState,
    };
  }, [myRecord, myBreaks, shifts, assignments, user, today, clockState, tick]);

  const orgSummary = useMemo(
    () => buildTodaySummary(members, todayRecords, leaveToday),
    [members, todayRecords, leaveToday],
  );

  const teamMembersForView = useMemo(() => {
    if (!teamFilter) return visibleMembers;
    const ids = new Set(teamMemberIds(members, teamFilter));
    return visibleMembers.filter((m) => ids.has(m.user_id));
  }, [teamFilter, visibleMembers, members]);

  const teamSummary = useMemo(
    () => buildTodaySummary(teamMembersForView, todayRecords, leaveToday),
    [teamMembersForView, todayRecords, leaveToday],
  );

  const teamRows: TeamRow[] = useMemo(() => {
    const recordByUser = new Map(todayRecords.map((r) => [r.user_id, r]));
    return teamMembersForView.map((member) => {
      const onLeave = leaveToday.has(member.user_id);
      const record = recordByUser.get(member.user_id) ?? null;
      const shift = getShiftForUser(member.user_id, shifts, assignments);
      const status = onLeave ? "leave" : deriveStatus(record, today, shift, onLeave);
      let state: TeamRow["clockState"] = "not_started";
      if (onLeave) state = "on_leave";
      else if (record?.clock_in && !record.clock_out) state = "working";
      else if (record?.clock_out) state = "checked_out";
      return { member, record, onLeave, status, clockState: state };
    });
  }, [teamMembersForView, todayRecords, leaveToday, shifts, assignments, today]);

  const monthly = useMemo(() => {
    const targetUser = filters.userId || user?.id || "";
    const userRecords = records.filter((r) => r.user_id === targetUser);
    const shift = getShiftForUser(targetUser, shifts, assignments);
    const { start, end } = monthRange();
    return summarizeMonth(userRecords, start, end, shift, leaveByUser, targetUser);
  }, [records, filters.userId, user?.id, shifts, assignments, leaveByUser]);

  const report: AttendanceReport = useMemo(() => {
    const scoped = records.filter((r) => {
      if (filters.userId && r.user_id !== filters.userId) return false;
      if (filters.department) {
        const dept = members.find((m) => m.user_id === r.user_id)?.department;
        if (dept !== filters.department) return false;
      }
      if (filters.teamUserId) {
        const ids = new Set(teamMemberIds(members, filters.teamUserId));
        if (!ids.has(r.user_id)) return false;
      }
      if (r.work_date < filters.startDate || r.work_date > filters.endDate) return false;
      return true;
    });

    const presentDays = scoped.filter((r) => r.status === "present" || r.status === "half_day").length;
    const lateDays = scoped.filter((r) => r.status === "late").length;
    const absentDays = scoped.filter((r) => r.status === "absent").length;
    const leaveDays = scoped.filter((r) => r.status === "leave").length;
    const totalWorkingMinutes = scoped.reduce((s, r) => s + (r.working_minutes ?? 0), 0);
    const counted = presentDays + lateDays;

    return {
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      totalWorkingMinutes,
      averageWorkingMinutes: counted > 0 ? Math.round(totalWorkingMinutes / counted) : 0,
    };
  }, [records, filters, members]);

  const displayRecords = useMemo(() => {
    const existing = new Set(records.map((r) => `${r.user_id}:${r.work_date}`));
    const extra: AttendanceRecord[] = [];
    const scope = visibleMembers.map((m) => m.user_id);

    for (const uid of scope) {
      const leaves = leaveByUser.get(uid) ?? [];
      for (const d of eachDateInRange(filters.startDate, filters.endDate)) {
        if (!isDateInLeave(d, leaves) || existing.has(`${uid}:${d}`)) continue;
        extra.push({
          id: `leave-${uid}-${d}`,
          organization_id: orgId ?? "",
          user_id: uid,
          work_date: d,
          clock_in: null,
          clock_out: null,
          status: "leave",
          break_minutes: 0,
          working_minutes: null,
          overtime_minutes: 0,
          late_minutes: 0,
          shift_id: null,
          missed_checkout: false,
          notes: null,
          created_at: d,
          updated_at: d,
        });
      }
    }

    return [...records, ...extra].sort((a, b) => b.work_date.localeCompare(a.work_date));
  }, [records, visibleMembers, leaveByUser, filters.startDate, filters.endDate, orgId]);

  const teamOptions = useMemo(() => {
    const leads = members.filter((m) => members.some((x) => x.manager_id === m.user_id));
    return leads.map((l) => ({ userId: l.user_id, label: `${l.full_name}'s team` }));
  }, [members]);

  const load = useCallback(async () => {
    if (!orgId || !user) return;
    setLoading(true);
    try {
      const data = await loadAttendancePageData(
        orgId,
        filters.startDate,
        filters.endDate,
        scopedUserIds,
        today,
      );
      setMembers(data.members);
      setShifts(data.shifts);
      setAssignments(data.assignments);
      setRecords(data.records);
      setTodayRecords(data.todayRecords);
      setBreaks(data.breaks);
      setLeaveByUser(data.leaveByUser);

      const events = await fetchEvents(orgId, user.id, today);
      setTodayEvents(events);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [orgId, user, filters.startDate, filters.endDate, scopedUserIds, today]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  function openDetail(member: AttendanceMember, record: AttendanceRecord | null) {
    setDetailMember(member);
    setDetailRecord(record);
    setDetailOpen(true);
  }

  function openRecordDetail(record: AttendanceRecord) {
    const member = members.find((m) => m.user_id === record.user_id) ?? null;
    if (member) openDetail(member, record);
  }

  async function runAction(action: () => Promise<void>) {
    if (!orgId || !user) return;
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(values: AttendanceFormValues, recordId?: string) {
    if (!orgId) return;
    await saveAttendanceRecord(orgId, values, shifts, assignments, recordId);
    toast.success(recordId ? "Attendance updated" : "Attendance added");
    await load();
  }

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todaySubtitle = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (!orgId || !user) {
    return (
      <AppShell title="Attendance">
        <div className="text-[13px] text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Attendance" subtitle={`Today · ${todaySubtitle}`}>
      <div className={SECTION_STACK}>
        {showOrgSummary && <TodaySummaryCards summary={orgSummary} />}

        <ClockPanel
          clockState={clockState}
          onLeave={leaveToday.has(user.id)}
          busy={busy}
          onClockIn={() => runAction(() => clockIn(orgId, user.id, shifts, assignments))}
          onClockOut={() => {
            if (!myRecord) return;
            runAction(() => clockOut(orgId, user.id, myRecord, myBreaks, shifts, assignments));
          }}
          onStartBreak={() => {
            if (!myRecord) return;
            runAction(() => startBreak(orgId, user.id, myRecord, myBreaks));
          }}
          onEndBreak={() => {
            if (!myRecord || !activeBreak) return;
            runAction(() => endBreak(orgId, user.id, myRecord, activeBreak));
          }}
        />

        <WorkSummaryCard summary={workSummary} />

        <TimelinePreview events={todayEvents} onViewAll={() => setTimelineOpen(true)} />

        {showTeam && (
          <TeamAttendancePreview
            rows={teamRows}
            onViewAll={() => setTeamOpen(true)}
            onSelectMember={(row) => openDetail(row.member, row.record)}
          />
        )}

        <HistoryPreview
          records={displayRecords}
          members={visibleMembers}
          showEmployeeColumn={showEmployeeColumn}
          onViewAll={() => setHistoryOpen(true)}
          onSelectRecord={openRecordDetail}
        />

        <MonthlySummaryPreview
          summary={monthly}
          monthLabel={monthLabel}
          onViewAll={() => setMonthlyOpen(true)}
        />

        <QuickActions
          onGenerateReport={() => setReportsOpen(true)}
          onManageShifts={() => setShiftsOpen(true)}
          showShifts={manage}
        />
      </div>

      <TimelineDrawer open={timelineOpen} onOpenChange={setTimelineOpen} events={todayEvents} />

      <TeamAttendanceDrawer
        open={teamOpen}
        onOpenChange={setTeamOpen}
        rows={teamRows}
        summary={teamSummary}
        teamFilter={teamFilter}
        teams={teamOptions}
        onTeamFilterChange={setTeamFilter}
        onSelectMember={(row) => openDetail(row.member, row.record)}
      />

      <HistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        records={displayRecords}
        members={visibleMembers}
        filters={filters}
        onFiltersChange={setFilters}
        canManage={manage}
        showEmployeeColumn={showEmployeeColumn}
        onAdd={() => {
          setEditingRecord(null);
          setFormOpen(true);
        }}
        onEdit={(r) => {
          setEditingRecord(r);
          setFormOpen(true);
        }}
        onDelete={(r) => {
          if (r.id.startsWith("leave-")) return;
          if (!confirm("Delete this attendance record?")) return;
          runAction(async () => {
            await deleteAttendanceRecord(r.id);
            toast.success("Record deleted");
          });
        }}
      />

      <MonthlySummaryDrawer
        open={monthlyOpen}
        onOpenChange={setMonthlyOpen}
        summary={monthly}
        monthLabel={monthLabel}
      />

      <ReportsModal
        open={reportsOpen}
        onOpenChange={setReportsOpen}
        report={report}
        records={displayRecords}
        members={visibleMembers}
        filters={filters}
        onFiltersChange={setFilters}
        teams={teamOptions}
        showEmployeeFilter={showEmployeeColumn}
      />

      {manage && (
        <ShiftsModal
          open={shiftsOpen}
          onOpenChange={setShiftsOpen}
          shifts={shifts}
          members={members}
          assignments={assignments}
          onSaveShift={async (shift, shiftId) => {
            await saveShift(orgId, shift, shiftId);
            toast.success("Shift saved");
            await load();
          }}
          onAssignShift={async (userId, shiftId) => {
            await assignShift(orgId, userId, shiftId);
            toast.success("Shift assigned");
            await load();
          }}
        />
      )}

      <EmployeeAttendanceDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        member={detailMember}
        record={detailRecord}
      />

      <AttendanceFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        members={members}
        initial={editingRecord}
        onSave={handleSave}
      />
    </AppShell>
  );
}
