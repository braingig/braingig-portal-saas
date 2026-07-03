import { supabase } from "@/integrations/supabase/client";
import type { AttendanceStatus } from "@/lib/attendance/constants";
import { DEFAULT_SHIFT } from "@/lib/attendance/constants";
import {
  computeBreakMinutes,
  computeLateMinutes,
  computeOvertimeMinutes,
  computeWorkingMinutes,
  deriveStatus,
  getShiftForUser,
} from "@/lib/attendance/calculations";
import { toDateKey } from "@/lib/attendance/date-utils";
import type {
  AttendanceBreak,
  AttendanceEvent,
  AttendanceFormValues,
  AttendanceMember,
  AttendanceRecord,
  WorkShift,
} from "@/lib/attendance/types";

function mapRecord(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    user_id: row.user_id as string,
    work_date: (row.work_date as string) ?? toDateKey(new Date(row.clock_in as string)),
    clock_in: (row.clock_in as string) ?? null,
    clock_out: (row.clock_out as string) ?? null,
    status: (row.status as AttendanceStatus) ?? "present",
    break_minutes: (row.break_minutes as number) ?? 0,
    working_minutes: (row.working_minutes as number) ?? null,
    overtime_minutes: (row.overtime_minutes as number) ?? 0,
    late_minutes: (row.late_minutes as number) ?? 0,
    shift_id: (row.shift_id as string) ?? null,
    missed_checkout: Boolean(row.missed_checkout),
    notes: (row.notes as string) ?? null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) ?? (row.created_at as string),
  };
}

async function logEvent(
  orgId: string,
  userId: string,
  recordId: string | null,
  eventType: string,
  metadata?: Record<string, unknown>,
) {
  await supabase.from("attendance_events").insert({
    organization_id: orgId,
    user_id: userId,
    record_id: recordId,
    event_type: eventType,
    metadata: metadata ?? null,
  });
}

async function notifyMissedCheckout(userId: string, workDate: string) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "attendance",
    title: "Missed check out",
    body: `You did not check out on ${workDate}. Please contact HR if correction is needed.`,
    link: "/attendance",
    entity_type: "attendance",
  });
}

export async function ensureDefaultShift(orgId: string): Promise<WorkShift[]> {
  const { data: existing } = await supabase
    .from("work_shifts")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at");

  if (existing?.length) return existing as WorkShift[];

  const { data: created, error } = await supabase
    .from("work_shifts")
    .insert({
      organization_id: orgId,
      name: DEFAULT_SHIFT.name,
      start_time: DEFAULT_SHIFT.start_time,
      end_time: DEFAULT_SHIFT.end_time,
      weekly_off_days: DEFAULT_SHIFT.weekly_off_days,
    })
    .select()
    .single();

  if (error) throw error;
  return [created as WorkShift];
}

export async function fetchShiftAssignments(orgId: string): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("employee_shift_assignments")
    .select("user_id, shift_id")
    .eq("organization_id", orgId);

  return new Map((data ?? []).map((r) => [r.user_id, r.shift_id]));
}

export async function fetchMembers(orgId: string): Promise<AttendanceMember[]> {
  const { data: employees } = await supabase
    .from("employees")
    .select("user_id, full_name, department, manager_id")
    .eq("organization_id", orgId)
    .not("user_id", "is", null);

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", (members ?? []).map((m) => m.user_id));

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Member"]));
  const empMap = new Map(
    (employees ?? [])
      .filter((e) => e.user_id)
      .map((e) => [
        e.user_id as string,
        {
          user_id: e.user_id as string,
          full_name: e.full_name ?? profileMap.get(e.user_id as string) ?? "Member",
          department: e.department as string | null,
          manager_id: e.manager_id as string | null,
        },
      ]),
  );

  for (const m of members ?? []) {
    if (!empMap.has(m.user_id)) {
      empMap.set(m.user_id, {
        user_id: m.user_id,
        full_name: profileMap.get(m.user_id) ?? "Member",
        department: null,
        manager_id: null,
      });
    }
  }

  return [...empMap.values()].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function fetchApprovedLeave(orgId: string, start: string, end: string) {
  const { data } = await supabase
    .from("leave_requests")
    .select("user_id, start_date, end_date")
    .eq("organization_id", orgId)
    .eq("status", "approved")
    .lte("start_date", end)
    .gte("end_date", start);

  const byUser = new Map<string, { start_date: string; end_date: string }[]>();
  for (const row of data ?? []) {
    const list = byUser.get(row.user_id) ?? [];
    list.push({ start_date: row.start_date, end_date: row.end_date });
    byUser.set(row.user_id, list);
  }
  return byUser;
}

export function teamMemberIds(members: AttendanceMember[], leadUserId: string): string[] {
  const leadEmployee = members.find((m) => m.user_id === leadUserId);
  if (!leadEmployee) return [leadUserId];
  const direct = members
    .filter((m) => m.manager_id === leadEmployee.id)
    .map((m) => m.user_id);
  return [leadUserId, ...direct];
}

export async function fetchAttendanceRecords(
  orgId: string,
  start: string,
  end: string,
  userIds?: string[] | null,
): Promise<AttendanceRecord[]> {
  let q = supabase
    .from("attendance_records")
    .select("*")
    .eq("organization_id", orgId)
    .gte("work_date", start)
    .lte("work_date", end)
    .order("work_date", { ascending: false });

  if (userIds?.length) q = q.in("user_id", userIds);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapRecord(r as Record<string, unknown>));
}

export async function fetchBreaksForRecords(recordIds: string[]): Promise<AttendanceBreak[]> {
  if (!recordIds.length) return [];
  const { data } = await supabase
    .from("attendance_breaks")
    .select("*")
    .in("record_id", recordIds);
  return (data ?? []) as AttendanceBreak[];
}

export async function fetchEvents(
  orgId: string,
  userId: string,
  dateKey: string,
): Promise<AttendanceEvent[]> {
  const start = `${dateKey}T00:00:00`;
  const end = `${dateKey}T23:59:59`;
  const { data } = await supabase
    .from("attendance_events")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: true });
  return (data ?? []) as AttendanceEvent[];
}

export async function processMissedCheckouts(orgId: string, records: AttendanceRecord[]) {
  const today = toDateKey();
  const stale = records.filter(
    (r) => r.work_date < today && r.clock_in && !r.clock_out && !r.missed_checkout,
  );
  for (const rec of stale) {
    await supabase
      .from("attendance_records")
      .update({ missed_checkout: true })
      .eq("id", rec.id);
    await notifyMissedCheckout(rec.user_id, rec.work_date);
  }
}

async function isOnLeaveToday(orgId: string, userId: string, dateKey: string): Promise<boolean> {
  const leave = await fetchApprovedLeave(orgId, dateKey, dateKey);
  const userLeaves = leave.get(userId) ?? [];
  return userLeaves.some((l) => dateKey >= l.start_date && dateKey <= l.end_date);
}

export async function clockIn(
  orgId: string,
  userId: string,
  shifts: WorkShift[],
  assignments: Map<string, string>,
): Promise<void> {
  const today = toDateKey();
  if (await isOnLeaveToday(orgId, userId, today)) {
    throw new Error("You are on approved leave today. Clock in is disabled.");
  }

  const { data: existing } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .eq("work_date", today)
    .maybeSingle();

  if (existing?.clock_in && !existing.clock_out) {
    throw new Error("You are already clocked in.");
  }
  if (existing?.clock_in && existing.clock_out) {
    throw new Error("You have already completed attendance for today.");
  }

  const shift = getShiftForUser(userId, shifts, assignments);
  const now = new Date().toISOString();
  const lateMinutes = computeLateMinutes(now, today, shift);
  const status: AttendanceStatus = lateMinutes > 0 ? "late" : "present";

  let recordId: string;
  if (existing) {
    const { data, error } = await supabase
      .from("attendance_records")
      .update({
        clock_in: now,
        clock_out: null,
        status,
        late_minutes: lateMinutes,
        shift_id: shift?.id ?? null,
        missed_checkout: false,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw error;
    recordId = data.id;
  } else {
    const { data, error } = await supabase
      .from("attendance_records")
      .insert({
        organization_id: orgId,
        user_id: userId,
        work_date: today,
        clock_in: now,
        status,
        late_minutes: lateMinutes,
        shift_id: shift?.id ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    recordId = data.id;
  }

  await logEvent(orgId, userId, recordId, "clock_in", { late_minutes: lateMinutes });
}

export async function clockOut(
  orgId: string,
  userId: string,
  record: AttendanceRecord,
  breaks: AttendanceBreak[],
  shifts: WorkShift[],
  assignments: Map<string, string>,
): Promise<void> {
  if (!record.clock_in) throw new Error("Clock in first before clocking out.");
  if (record.clock_out) throw new Error("Already checked out.");

  const activeBreak = breaks.find((b) => b.record_id === record.id && !b.ended_at);
  if (activeBreak) {
    await endBreak(orgId, userId, record, activeBreak);
  }

  const refreshedBreaks = await fetchBreaksForRecords([record.id]);
  const breakMinutes = computeBreakMinutes(refreshedBreaks);
  const now = new Date().toISOString();
  const shift = getShiftForUser(userId, shifts, assignments);
  const workingMinutes = computeWorkingMinutes(record.clock_in, now, breakMinutes);
  const overtimeMinutes = computeOvertimeMinutes(now, record.work_date, shift);

  const { error } = await supabase
    .from("attendance_records")
    .update({
      clock_out: now,
      break_minutes: breakMinutes,
      working_minutes: workingMinutes,
      overtime_minutes: overtimeMinutes,
      missed_checkout: false,
    })
    .eq("id", record.id);

  if (error) throw error;
  await logEvent(orgId, userId, record.id, "clock_out");
}

export async function startBreak(
  orgId: string,
  userId: string,
  record: AttendanceRecord,
  breaks: AttendanceBreak[],
): Promise<void> {
  if (!record.clock_in || record.clock_out) {
    throw new Error("You must be clocked in to start a break.");
  }
  if (breaks.some((b) => b.record_id === record.id && !b.ended_at)) {
    throw new Error("A break is already active.");
  }

  const { data, error } = await supabase
    .from("attendance_breaks")
    .insert({ record_id: record.id })
    .select("id")
    .single();
  if (error) throw error;
  await logEvent(orgId, userId, record.id, "break_start", { break_id: data.id });
}

export async function endBreak(
  orgId: string,
  userId: string,
  record: AttendanceRecord,
  activeBreak: AttendanceBreak,
): Promise<void> {
  if (activeBreak.ended_at) throw new Error("No active break to end.");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("attendance_breaks")
    .update({ ended_at: now })
    .eq("id", activeBreak.id);
  if (error) throw error;

  const breaks = await fetchBreaksForRecords([record.id]);
  const breakMinutes = computeBreakMinutes(breaks);
  await supabase.from("attendance_records").update({ break_minutes: breakMinutes }).eq("id", record.id);
  await logEvent(orgId, userId, record.id, "break_end", { break_id: activeBreak.id });
}

export async function saveAttendanceRecord(
  orgId: string,
  values: AttendanceFormValues,
  shifts: WorkShift[],
  assignments: Map<string, string>,
  recordId?: string,
): Promise<void> {
  const shift = getShiftForUser(values.user_id, shifts, assignments);
  const clockInIso = values.clock_in
    ? new Date(`${values.work_date}T${values.clock_in}`).toISOString()
    : null;
  const clockOutIso = values.clock_out
    ? new Date(`${values.work_date}T${values.clock_out}`).toISOString()
    : null;

  const lateMinutes = clockInIso ? computeLateMinutes(clockInIso, values.work_date, shift) : 0;
  const status = values.status || (lateMinutes > 0 ? "late" : clockInIso ? "present" : "absent");
  const workingMinutes = clockInIso
    ? computeWorkingMinutes(clockInIso, clockOutIso, 0)
    : null;
  const overtimeMinutes = clockOutIso
    ? computeOvertimeMinutes(clockOutIso, values.work_date, shift)
    : 0;

  const payload = {
    organization_id: orgId,
    user_id: values.user_id,
    work_date: values.work_date,
    clock_in: clockInIso,
    clock_out: clockOutIso,
    status: deriveStatus({ status, clock_in: clockInIso, late_minutes: lateMinutes }, values.work_date, shift, status === "leave"),
    late_minutes: lateMinutes,
    working_minutes: workingMinutes,
    overtime_minutes: overtimeMinutes,
    notes: values.notes || null,
    shift_id: shift?.id ?? null,
    missed_checkout: false,
  };

  if (recordId) {
    const { error } = await supabase.from("attendance_records").update(payload).eq("id", recordId);
    if (error) throw error;
    await logEvent(orgId, values.user_id, recordId, "manual_correction");
  } else {
    const { data, error } = await supabase
      .from("attendance_records")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    await logEvent(orgId, values.user_id, data.id, "manual_correction");
  }
}

export async function deleteAttendanceRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from("attendance_records").delete().eq("id", recordId);
  if (error) throw error;
}

export async function assignShift(orgId: string, userId: string, shiftId: string): Promise<void> {
  const { error } = await supabase.from("employee_shift_assignments").upsert(
    { organization_id: orgId, user_id: userId, shift_id: shiftId },
    { onConflict: "organization_id,user_id" },
  );
  if (error) throw error;
}

export async function saveShift(
  orgId: string,
  shift: Omit<WorkShift, "organization_id"> & { organization_id?: string },
  shiftId?: string,
): Promise<void> {
  if (shiftId) {
    const { error } = await supabase
      .from("work_shifts")
      .update({
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        weekly_off_days: shift.weekly_off_days,
      })
      .eq("id", shiftId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("work_shifts").insert({
      organization_id: orgId,
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      weekly_off_days: shift.weekly_off_days,
    });
    if (error) throw error;
  }
}

export async function loadAttendancePageData(
  orgId: string,
  start: string,
  end: string,
  userIds: string[] | null,
  today: string,
): Promise<{
  members: AttendanceMember[];
  shifts: WorkShift[];
  assignments: Map<string, string>;
  records: AttendanceRecord[];
  todayRecords: AttendanceRecord[];
  breaks: AttendanceBreak[];
  leaveByUser: Map<string, { start_date: string; end_date: string }[]>;
}> {
  const [members, shifts, assignments, leaveByUser] = await Promise.all([
    fetchMembers(orgId),
    ensureDefaultShift(orgId),
    fetchShiftAssignments(orgId),
    fetchApprovedLeave(orgId, start, end),
  ]);

  const scope = userIds ?? members.map((m) => m.user_id);
  const records = await fetchAttendanceRecords(orgId, start, end, scope);
  await processMissedCheckouts(orgId, records);

  const todayRecords = records.filter((r) => r.work_date === today);
  const recordIds = records.map((r) => r.id);
  const breaks = await fetchBreaksForRecords(recordIds);

  return { members, shifts, assignments, records, todayRecords, breaks, leaveByUser };
}
