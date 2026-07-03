import { parseISO } from "date-fns";
import { defaultColorForType, type EventType } from "./constants";
import type { CalendarEventRecord, CalendarItem } from "./types";

export function eventToCalendarItem(
  event: CalendarEventRecord,
  meta: {
    projectName?: string | null;
    userName?: string | null;
    createdByName?: string | null;
    participantIds?: string[];
    participantNames?: string[];
  } = {},
): CalendarItem {
  return {
    id: event.id,
    source: "event",
    sourceId: event.id,
    title: event.title,
    description: event.description,
    start: parseISO(event.start_at),
    end: parseISO(event.end_at),
    allDay: event.all_day,
    eventType: event.event_type as EventType,
    color: event.color ?? defaultColorForType(event.event_type as EventType),
    location: event.location,
    notes: event.notes,
    projectId: event.project_id,
    projectName: meta.projectName ?? null,
    taskId: event.task_id,
    userId: event.user_id,
    userName: meta.userName ?? null,
    createdBy: event.created_by,
    createdByName: meta.createdByName ?? null,
    updatedAt: event.updated_at,
    readonly: false,
    recurrence: event.recurrence,
    recurrenceParentId: event.recurrence_parent_id,
    visibility: event.visibility,
    participantIds: meta.participantIds ?? [],
    participantNames: meta.participantNames ?? [],
    isRecurringInstance: false,
  };
}

export function taskToCalendarItem(task: {
  id: string;
  title: string;
  due_date: string;
  project_id: string | null;
  assignee_id: string | null;
  note: string | null;
  projectName?: string | null;
  assigneeName?: string | null;
}): CalendarItem {
  const due = parseISO(task.due_date.includes("T") ? task.due_date : `${task.due_date}T09:00:00`);
  const end = new Date(due);
  end.setHours(end.getHours() + 1);

  return {
    id: `task-${task.id}`,
    source: "task",
    sourceId: task.id,
    title: task.title,
    description: task.note,
    start: due,
    end,
    allDay: !task.due_date.includes("T"),
    eventType: "task",
    color: defaultColorForType("task"),
    location: null,
    notes: task.note,
    projectId: task.project_id,
    projectName: task.projectName ?? null,
    taskId: task.id,
    userId: task.assignee_id,
    userName: task.assigneeName ?? null,
    createdBy: null,
    createdByName: null,
    updatedAt: null,
    readonly: true,
    recurrence: "never",
    recurrenceParentId: null,
    visibility: "organization",
    participantIds: [],
    participantNames: [],
    isRecurringInstance: false,
  };
}

export function milestoneToCalendarItem(milestone: {
  id: string;
  title: string;
  due_date: string | null;
  project_id: string;
  projectName?: string | null;
}): CalendarItem | null {
  if (!milestone.due_date) return null;
  const start = parseISO(
    milestone.due_date.includes("T") ? milestone.due_date : `${milestone.due_date}T09:00:00`,
  );
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    id: `milestone-${milestone.id}`,
    source: "milestone",
    sourceId: milestone.id,
    title: milestone.title,
    description: null,
    start,
    end,
    allDay: true,
    eventType: "milestone",
    color: defaultColorForType("milestone"),
    location: null,
    notes: null,
    projectId: milestone.project_id,
    projectName: milestone.projectName ?? null,
    taskId: null,
    userId: null,
    userName: null,
    createdBy: null,
    createdByName: null,
    updatedAt: null,
    readonly: true,
    recurrence: "never",
    recurrenceParentId: null,
    visibility: "organization",
    participantIds: [],
    participantNames: [],
    isRecurringInstance: false,
  };
}

export function leaveToCalendarItem(leave: {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status?: string;
  userName?: string | null;
}): CalendarItem {
  const start = parseISO(`${leave.start_date}T00:00:00`);
  const end = parseISO(`${leave.end_date}T23:59:59`);

  return {
    id: `leave-${leave.id}`,
    source: "leave",
    sourceId: leave.id,
    title: `${leave.userName ?? "Member"} — ${leave.leave_type} leave`,
    description: leave.reason,
    start,
    end,
    allDay: true,
    eventType: "leave",
    color: defaultColorForType("leave"),
    location: null,
    notes: leave.reason,
    projectId: null,
    projectName: null,
    taskId: null,
    userId: leave.user_id,
    userName: leave.userName ?? null,
    createdBy: null,
    createdByName: null,
    updatedAt: null,
    readonly: true,
    recurrence: "never",
    recurrenceParentId: null,
    visibility: "organization",
    participantIds: [],
    participantNames: [],
    isRecurringInstance: false,
    leaveType: leave.leave_type,
    leaveStatus: leave.status ?? "approved",
  };
}
