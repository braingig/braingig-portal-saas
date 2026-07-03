import type { AttendanceStatus, ClockState } from "@/lib/attendance/constants";

export type WorkShift = {
  id: string;
  organization_id: string;
  name: string;
  start_time: string;
  end_time: string;
  weekly_off_days: number[];
};

export type AttendanceRecord = {
  id: string;
  organization_id: string;
  user_id: string;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: AttendanceStatus;
  break_minutes: number;
  working_minutes: number | null;
  overtime_minutes: number;
  late_minutes: number;
  shift_id: string | null;
  missed_checkout: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceBreak = {
  id: string;
  record_id: string;
  started_at: string;
  ended_at: string | null;
};

export type AttendanceEvent = {
  id: string;
  organization_id: string;
  record_id: string | null;
  user_id: string;
  event_type: string;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
};

export type AttendanceMember = {
  user_id: string;
  full_name: string;
  department: string | null;
  manager_id: string | null;
};

export type TodaySummary = {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  currentlyWorking: number;
};

export type WorkSummary = {
  checkIn: string | null;
  checkOut: string | null;
  workingMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  clockState: ClockState;
};

export type MonthlySummary = {
  workingDays: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  holiday: number;
  weekend: number;
  totalWorkingMinutes: number;
  averageWorkingMinutes: number;
};

export type AttendanceReport = {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  totalWorkingMinutes: number;
  averageWorkingMinutes: number;
};

export type AttendanceFilters = {
  startDate: string;
  endDate: string;
  userId: string;
  department: string;
  status: string;
  teamUserId: string;
};

export type AttendanceFormValues = {
  user_id: string;
  work_date: string;
  clock_in: string;
  clock_out: string;
  status: AttendanceStatus;
  notes: string;
};

export type AttendancePageData = {
  members: AttendanceMember[];
  shifts: WorkShift[];
  todayRecords: AttendanceRecord[];
  historyRecords: AttendanceRecord[];
  todayEvents: AttendanceEvent[];
  breaks: AttendanceBreak[];
  leaveUserIdsToday: Set<string>;
  approvedLeaveByUser: Map<string, { start_date: string; end_date: string }[]>;
};
