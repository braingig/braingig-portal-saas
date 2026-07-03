export const ATTENDANCE_STATUSES = [
  "present",
  "late",
  "half_day",
  "absent",
  "leave",
  "holiday",
  "weekend",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  half_day: "Half Day",
  absent: "Absent",
  leave: "Leave",
  holiday: "Holiday",
  weekend: "Weekend",
};

export const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-success/10 text-success",
  late: "bg-warning/10 text-warning",
  half_day: "bg-brand/10 text-brand",
  absent: "bg-danger/10 text-danger",
  leave: "bg-brand/10 text-brand",
  holiday: "bg-muted text-muted-foreground",
  weekend: "bg-muted text-muted-foreground",
};

export const EVENT_LABELS: Record<string, string> = {
  clock_in: "Clock In",
  clock_out: "Clock Out",
  break_start: "Break Started",
  break_end: "Break Ended",
  manual_correction: "Manual Correction",
};

export const CLOCK_STATES = ["working", "on_break", "checked_out", "not_started", "on_leave"] as const;
export type ClockState = (typeof CLOCK_STATES)[number];

export const CLOCK_STATE_LABELS: Record<ClockState, string> = {
  working: "Working",
  on_break: "On Break",
  checked_out: "Checked Out",
  not_started: "Not Started",
  on_leave: "On Leave",
};

export const DEFAULT_SHIFT = {
  name: "General",
  start_time: "09:00:00",
  end_time: "18:00:00",
  weekly_off_days: [0, 6] as number[],
};

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
