/** Types users can create manually from the Calendar. */
export const MANUAL_EVENT_TYPES = ["meeting", "reminder", "personal", "holiday"] as const;
export type ManualEventType = (typeof MANUAL_EVENT_TYPES)[number];

/** Records visualized from other modules — never created on the Calendar. */
export const LINKED_RECORD_SOURCES = ["task", "milestone", "leave"] as const;
export type LinkedRecordSource = (typeof LINKED_RECORD_SOURCES)[number];

/** All display types on the calendar (manual + linked visualizations). */
export const EVENT_TYPES = [
  ...MANUAL_EVENT_TYPES,
  "task",
  "milestone",
  "leave",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const MANUAL_EVENT_TYPE_LABELS: Record<ManualEventType, string> = {
  meeting: "Meeting",
  reminder: "Reminder",
  personal: "Personal Event",
  holiday: "Holiday",
};

export const LINKED_RECORD_LABELS: Record<LinkedRecordSource, string> = {
  task: "Task",
  milestone: "Milestone",
  leave: "Leave",
};

/** @deprecated Use MANUAL_EVENT_TYPE_LABELS or LINKED_RECORD_LABELS */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: "Meeting",
  reminder: "Reminder",
  personal: "Personal Event",
  holiday: "Holiday",
  task: "Task",
  leave: "Leave",
  milestone: "Milestone",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting: "#3b82f6",
  reminder: "#f59e0b",
  personal: "#a855f7",
  holiday: "#ef4444",
  task: "#22c55e",
  leave: "#f97316",
  milestone: "#6366f1",
};

export const RECURRENCE_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export type Recurrence = (typeof RECURRENCE_OPTIONS)[number]["value"];

export const REMINDER_OPTIONS = [
  { value: 0, label: "At event time" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
] as const;

export type ReminderOffset = (typeof REMINDER_OPTIONS)[number]["value"];

export const CALENDAR_VIEWS = ["month", "week", "day", "agenda"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "team", label: "Team" },
  { value: "organization", label: "Organization" },
  { value: "clients", label: "Shared with clients" },
] as const;

export type EventVisibility = (typeof VISIBILITY_OPTIONS)[number]["value"];

export function defaultColorForType(type: EventType): string {
  return EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS.meeting;
}

export function isManualCalendarEvent(item: { source: string; readonly: boolean }): boolean {
  return item.source === "event" && !item.readonly;
}

export function isLinkedRecord(item: { source: string; readonly: boolean }): boolean {
  return item.readonly && LINKED_RECORD_SOURCES.includes(item.source as LinkedRecordSource);
}
