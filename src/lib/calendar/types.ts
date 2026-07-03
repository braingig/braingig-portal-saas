import type { EventType, EventVisibility, LinkedRecordSource, ManualEventType, Recurrence } from "./constants";

export type CalendarEventRecord = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  event_type: EventType;
  color: string | null;
  location: string | null;
  notes: string | null;
  user_id: string | null;
  project_id: string | null;
  task_id: string | null;
  created_by: string;
  recurrence: Recurrence;
  recurrence_end_at: string | null;
  recurrence_parent_id: string | null;
  visibility: EventVisibility;
  created_at: string;
  updated_at: string;
};

export type CalendarParticipant = {
  id: string;
  event_id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string | null;
};

export type CalendarItemSource = "event" | "task" | "milestone" | "leave";

export type CalendarItem = {
  id: string;
  source: CalendarItemSource;
  sourceId: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  eventType: EventType;
  color: string;
  location: string | null;
  notes: string | null;
  projectId: string | null;
  projectName: string | null;
  taskId: string | null;
  userId: string | null;
  userName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  updatedAt: string | null;
  readonly: boolean;
  recurrence: Recurrence;
  recurrenceParentId: string | null;
  visibility: EventVisibility;
  participantIds: string[];
  participantNames: string[];
  isRecurringInstance: boolean;
  /** Present on linked leave records */
  leaveType?: string | null;
  leaveStatus?: string | null;
};

export type CalendarFilters = {
  manualEventTypes: ManualEventType[];
  linkedRecords: LinkedRecordSource[];
  projectId: string | null;
  assignedUserId: string | null;
  createdById: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  search: string;
};

export type EventFormValues = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  eventType: ManualEventType;
  location: string;
  notes: string;
  projectId: string | null;
  userId: string | null;
  visibility: EventVisibility;
  recurrence: Recurrence;
  recurrenceEndDate: string;
  reminderOffsets: number[];
  participantIds: string[];
};

export type ProfileOption = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type ProjectOption = {
  id: string;
  name: string;
};
