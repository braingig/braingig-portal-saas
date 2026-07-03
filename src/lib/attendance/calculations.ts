import type { AttendanceStatus } from "@/lib/attendance/constants";
import { DEFAULT_SHIFT } from "@/lib/attendance/constants";
import {
  eachDateInRange,
  isDateInLeave,
  parseDateKey,
  parseTimeOnDate,
} from "@/lib/attendance/date-utils";
import type { AttendanceBreak, AttendanceRecord, WorkShift } from "@/lib/attendance/types";

export function getShiftForUser(
  userId: string,
  shifts: WorkShift[],
  assignments: Map<string, string>,
): WorkShift | null {
  const shiftId = assignments.get(userId);
  if (shiftId) return shifts.find((s) => s.id === shiftId) ?? null;
  return shifts[0] ?? null;
}

export function effectiveShift(shift: WorkShift | null) {
  return shift ?? {
    id: "default",
    organization_id: "",
    ...DEFAULT_SHIFT,
  };
}

export function isWeeklyOff(dateKey: string, shift: WorkShift | null): boolean {
  const s = effectiveShift(shift);
  const day = parseDateKey(dateKey).getDay();
  return s.weekly_off_days.includes(day);
}

export function computeLateMinutes(
  clockIn: string,
  workDate: string,
  shift: WorkShift | null,
): number {
  const s = effectiveShift(shift);
  const expected = parseTimeOnDate(workDate, s.start_time).getTime();
  const actual = new Date(clockIn).getTime();
  const diff = Math.floor((actual - expected) / 60_000);
  return diff > 0 ? diff : 0;
}

export function computeBreakMinutes(breaks: AttendanceBreak[], now = Date.now()): number {
  return breaks.reduce((sum, b) => {
    const end = b.ended_at ? new Date(b.ended_at).getTime() : now;
    const start = new Date(b.started_at).getTime();
    return sum + Math.max(0, Math.floor((end - start) / 60_000));
  }, 0);
}

export function computeWorkingMinutes(
  clockIn: string | null,
  clockOut: string | null,
  breakMinutes: number,
  now = Date.now(),
): number {
  if (!clockIn) return 0;
  const end = clockOut ? new Date(clockOut).getTime() : now;
  const start = new Date(clockIn).getTime();
  return Math.max(0, Math.floor((end - start) / 60_000) - breakMinutes);
}

export function computeOvertimeMinutes(
  clockOut: string | null,
  workDate: string,
  shift: WorkShift | null,
): number {
  if (!clockOut) return 0;
  const s = effectiveShift(shift);
  const expectedEnd = parseTimeOnDate(workDate, s.end_time).getTime();
  const actual = new Date(clockOut).getTime();
  const diff = Math.floor((actual - expectedEnd) / 60_000);
  return diff > 0 ? diff : 0;
}

export function deriveStatus(
  record: Partial<AttendanceRecord> | null,
  workDate: string,
  shift: WorkShift | null,
  onLeave: boolean,
): AttendanceStatus {
  if (onLeave) return "leave";
  if (isWeeklyOff(workDate, shift)) return "weekend";
  if (!record?.clock_in) return "absent";
  if (record.status === "half_day") return "half_day";
  const late = record.late_minutes ?? (record.clock_in ? computeLateMinutes(record.clock_in, workDate, shift) : 0);
  if (late > 0) return "late";
  return "present";
}

export function countWorkingDaysInRange(
  startKey: string,
  endKey: string,
  shift: WorkShift | null,
  holidayDates: Set<string> = new Set(),
): number {
  return eachDateInRange(startKey, endKey).filter((d) => {
    if (isWeeklyOff(d, shift)) return false;
    if (holidayDates.has(d)) return false;
    return true;
  }).length;
}

export function summarizeMonth(
  records: AttendanceRecord[],
  startKey: string,
  endKey: string,
  shift: WorkShift | null,
  leaveByUser: Map<string, { start_date: string; end_date: string }[]>,
  userId: string,
): import("@/lib/attendance/types").MonthlySummary {
  const byDate = new Map(records.map((r) => [r.work_date, r]));
  const leaves = leaveByUser.get(userId) ?? [];
  let present = 0;
  let late = 0;
  let absent = 0;
  let leave = 0;
  let holiday = 0;
  let weekend = 0;
  let totalWorkingMinutes = 0;
  let workingDays = 0;

  for (const d of eachDateInRange(startKey, endKey)) {
    const rec = byDate.get(d);
    const onLeave = isDateInLeave(d, leaves);
    const status = rec?.status ?? deriveStatus(rec ?? null, d, shift, onLeave);

    if (isWeeklyOff(d, shift)) {
      weekend += 1;
      continue;
    }
    if (status === "holiday") {
      holiday += 1;
      continue;
    }
    workingDays += 1;

    if (status === "leave") leave += 1;
    else if (status === "absent") absent += 1;
    else if (status === "late") {
      late += 1;
      present += 1;
    } else if (status === "present" || status === "half_day") present += 1;

    if (rec?.working_minutes) totalWorkingMinutes += rec.working_minutes;
    else if (rec?.clock_in) {
      totalWorkingMinutes += computeWorkingMinutes(rec.clock_in, rec.clock_out, rec.break_minutes ?? 0);
    }
  }

  const counted = present + late;
  return {
    workingDays,
    present,
    late,
    absent,
    leave,
    holiday,
    weekend,
    totalWorkingMinutes,
    averageWorkingMinutes: counted > 0 ? Math.round(totalWorkingMinutes / counted) : 0,
  };
}
