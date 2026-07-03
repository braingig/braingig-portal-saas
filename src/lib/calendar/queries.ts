import { supabase } from "@/integrations/supabase/client";
import { endOfDay, format, startOfDay } from "date-fns";
import { expandRecurringEvent } from "./recurrence";
import {
  eventToCalendarItem,
  leaveToCalendarItem,
  milestoneToCalendarItem,
  taskToCalendarItem,
} from "./mappers";
import type {
  CalendarEventRecord,
  CalendarItem,
  CalendarParticipant,
  EventFormValues,
  ProfileOption,
  ProjectOption,
} from "./types";
import type { EventType, ManualEventType } from "./constants";
import { defaultColorForType } from "./constants";

async function fetchOrgMemberProfiles(orgId: string): Promise<ProfileOption[]> {
  const { data: memberRows, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("status", "active");

  if (membersError || !memberRows?.length) return [];

  const ids = memberRows.map((m) => m.user_id);
  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);

  if (profilesError) return [];

  return (profileRows ?? [])
    .map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
    }))
    .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
}

export async function fetchCalendarData(
  orgId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<{
  items: CalendarItem[];
  profiles: ProfileOption[];
  projects: ProjectOption[];
}> {
  const startIso = rangeStart.toISOString();
  const endIso = rangeEnd.toISOString();
  const startDate = format(rangeStart, "yyyy-MM-dd");
  const endDate = format(rangeEnd, "yyyy-MM-dd");

  const [eventsRes, tasksRes, milestonesRes, leaveRes, profiles, projectsRes] =
    await Promise.all([
      supabase
        .from("calendar_events")
        .select("*")
        .eq("organization_id", orgId)
        .or(`and(start_at.lte.${endIso},end_at.gte.${startIso}),and(recurrence.neq.never,start_at.lte.${endIso})`)
        .order("start_at"),
      supabase
        .from("tasks")
        .select("id, title, due_date, project_id, assignee_id, note")
        .eq("organization_id", orgId)
        .not("due_date", "is", null)
        .gte("due_date", startDate)
        .lte("due_date", endDate),
      supabase
        .from("milestones")
        .select("id, title, due_date, project_id")
        .eq("organization_id", orgId)
        .not("due_date", "is", null)
        .gte("due_date", startDate)
        .lte("due_date", endDate),
      supabase
        .from("leave_requests")
        .select("id, user_id, leave_type, start_date, end_date, reason, status")
        .eq("organization_id", orgId)
        .eq("status", "approved")
        .lte("start_date", endDate)
        .gte("end_date", startDate),
      fetchOrgMemberProfiles(orgId),
      supabase.from("projects").select("id, name").eq("organization_id", orgId).order("name"),
    ]);

  if (eventsRes.error) console.warn("Calendar events:", eventsRes.error.message);
  if (milestonesRes.error) console.warn("Milestones:", milestonesRes.error.message);

  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name ?? "Member"]));
  const projects: ProjectOption[] = (projectsRes.data ?? []) as ProjectOption[];
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const eventIds = (eventsRes.data ?? []).map((e) => e.id);
  const participants = eventIds.length
    ? await fetchParticipants(eventIds)
    : [];
  const participantsByEvent = new Map<string, CalendarParticipant[]>();
  for (const p of participants) {
    const list = participantsByEvent.get(p.event_id) ?? [];
    list.push(p);
    participantsByEvent.set(p.event_id, list);
  }

  const items: CalendarItem[] = [];

  for (const raw of (eventsRes.data ?? []) as CalendarEventRecord[]) {
    const parts = participantsByEvent.get(raw.id) ?? [];
    const meta = {
      projectName: raw.project_id ? projectMap.get(raw.project_id) : null,
      userName: raw.user_id ? profileMap.get(raw.user_id) : null,
      createdByName: profileMap.get(raw.created_by),
      participantIds: parts.map((p) => p.user_id),
      participantNames: parts.map((p) => p.full_name ?? "Member"),
    };
    items.push(...expandRecurringEvent(raw, rangeStart, rangeEnd, meta));
  }

  for (const task of tasksRes.data ?? []) {
    items.push(
      taskToCalendarItem({
        ...task,
        projectName: task.project_id ? projectMap.get(task.project_id) : null,
        assigneeName: task.assignee_id ? profileMap.get(task.assignee_id) : null,
      }),
    );
  }

  for (const ms of milestonesRes.data ?? []) {
    const item = milestoneToCalendarItem({
      ...ms,
      projectName: projectMap.get(ms.project_id),
    });
    if (item) items.push(item);
  }

  for (const leave of leaveRes.data ?? []) {
    items.push(
      leaveToCalendarItem({
        ...leave,
        userName: profileMap.get(leave.user_id),
      }),
    );
  }

  return { items, profiles, projects };
}

export async function fetchParticipants(eventIds: string[]): Promise<CalendarParticipant[]> {
  const { data, error } = await supabase
    .from("calendar_event_participants")
    .select("id, event_id, user_id")
    .in("event_id", eventIds);

  if (error || !data?.length) return [];

  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    (profileRows ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
  );

  return data.map((row) => {
    const p = profileMap.get(row.user_id);
    return {
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      full_name: p?.full_name ?? undefined,
      avatar_url: p?.avatar_url,
    };
  });
}

export async function fetchEventById(eventId: string): Promise<CalendarEventRecord | null> {
  const { data } = await supabase.from("calendar_events").select("*").eq("id", eventId).maybeSingle();
  return (data as CalendarEventRecord | null) ?? null;
}

export async function fetchEventReminders(eventId: string, userId: string): Promise<number[]> {
  const { data } = await supabase
    .from("calendar_event_reminders")
    .select("offset_minutes")
    .eq("event_id", eventId)
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.offset_minutes);
}

function toIsoDateTime(date: string, time: string, allDay: boolean, end = false): string {
  if (allDay) {
    return end ? `${date}T23:59:59` : `${date}T00:00:00`;
  }
  return new Date(`${date}T${time}`).toISOString();
}

export async function createCalendarEvent(
  orgId: string,
  userId: string,
  values: EventFormValues,
): Promise<{ id: string | null; error: string | null }> {
  const payload = {
    organization_id: orgId,
    title: values.title.trim(),
    description: values.description.trim() || null,
    start_at: toIsoDateTime(values.startDate, values.startTime, values.allDay),
    end_at: toIsoDateTime(values.endDate, values.endTime, values.allDay, true),
    all_day: values.allDay,
    event_type: values.eventType as EventType,
    color: values.color,
    location: values.location.trim() || null,
    notes: values.notes.trim() || null,
    project_id: values.projectId,
    user_id: values.userId,
    visibility: values.visibility,
    recurrence: values.recurrence,
    recurrence_end_at: values.recurrence !== "never" && values.recurrenceEndDate
      ? endOfDay(new Date(values.recurrenceEndDate)).toISOString()
      : null,
    created_by: userId,
  };

  const { data, error } = await supabase.from("calendar_events").insert(payload).select("id").single();
  if (error) return { id: null, error: error.message };

  await syncParticipants(data.id, values.participantIds);
  await syncReminders(data.id, userId, values.reminderOffsets);

  return { id: data.id, error: null };
}

export async function updateCalendarEvent(
  eventId: string,
  userId: string,
  values: EventFormValues,
): Promise<{ error: string | null }> {
  const payload = {
    title: values.title.trim(),
    description: values.description.trim() || null,
    start_at: toIsoDateTime(values.startDate, values.startTime, values.allDay),
    end_at: toIsoDateTime(values.endDate, values.endTime, values.allDay, true),
    all_day: values.allDay,
    event_type: values.eventType as EventType,
    color: values.color,
    location: values.location.trim() || null,
    notes: values.notes.trim() || null,
    project_id: values.projectId,
    user_id: values.userId,
    visibility: values.visibility,
    recurrence: values.recurrence,
    recurrence_end_at: values.recurrence !== "never" && values.recurrenceEndDate
      ? endOfDay(new Date(values.recurrenceEndDate)).toISOString()
      : null,
  };

  const { error } = await supabase.from("calendar_events").update(payload).eq("id", eventId);
  if (error) return { error: error.message };

  await syncParticipants(eventId, values.participantIds);
  await syncReminders(eventId, userId, values.reminderOffsets);

  return { error: null };
}

export async function deleteCalendarEvent(eventId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);
  return { error: error?.message ?? null };
}

export async function moveCalendarEvent(
  eventId: string,
  start: Date,
  end: Date,
  allDay: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("calendar_events")
    .update({
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      all_day: allDay,
    })
    .eq("id", eventId);
  return { error: error?.message ?? null };
}

async function syncParticipants(eventId: string, participantIds: string[]) {
  await supabase.from("calendar_event_participants").delete().eq("event_id", eventId);
  if (participantIds.length === 0) return;
  await supabase.from("calendar_event_participants").insert(
    participantIds.map((user_id) => ({ event_id: eventId, user_id })),
  );
}

async function syncReminders(eventId: string, userId: string, offsets: number[]) {
  await supabase.from("calendar_event_reminders").delete().eq("event_id", eventId).eq("user_id", userId);
  if (offsets.length === 0) return;
  await supabase.from("calendar_event_reminders").insert(
    offsets.map((offset_minutes) => ({ event_id: eventId, user_id: userId, offset_minutes })),
  );
}

export function formValuesFromEvent(
  event: CalendarEventRecord,
  reminderOffsets: number[] = [],
  participantIds: string[] = [],
): EventFormValues {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  return {
    title: event.title,
    description: event.description ?? "",
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
    allDay: event.all_day,
    color: event.color ?? "",
    eventType: event.event_type as ManualEventType,
    location: event.location ?? "",
    notes: event.notes ?? "",
    projectId: event.project_id,
    userId: event.user_id,
    visibility: event.visibility,
    recurrence: event.recurrence,
    recurrenceEndDate: event.recurrence_end_at ? format(new Date(event.recurrence_end_at), "yyyy-MM-dd") : "",
    reminderOffsets,
    participantIds,
  };
}

export function defaultFormValues(
  date = new Date(),
  eventType: ManualEventType = "meeting",
): EventFormValues {
  const d = format(date, "yyyy-MM-dd");
  return {
    title: "",
    description: "",
    startDate: d,
    endDate: d,
    startTime: "09:00",
    endTime: "10:00",
    allDay: false,
    color: defaultColorForType(eventType),
    eventType,
    location: "",
    notes: "",
    projectId: null,
    userId: null,
    visibility: "organization",
    recurrence: "never",
    recurrenceEndDate: "",
    reminderOffsets: [],
    participantIds: [],
  };
}

export async function duplicateCalendarEvent(
  eventId: string,
  userId: string,
): Promise<{ id: string | null; error: string | null }> {
  const event = await fetchEventById(eventId);
  if (!event) return { id: null, error: "Event not found" };

  const reminders = await fetchEventReminders(eventId, userId);
  const participants = await fetchParticipants([eventId]);
  const values = formValuesFromEvent(
    event,
    reminders,
    participants.map((p) => p.user_id),
  );
  values.title = `${values.title} (copy)`;
  values.recurrence = "never";
  values.recurrenceEndDate = "";

  return createCalendarEvent(event.organization_id, userId, values);
}

export async function loadEventDetail(eventId: string, userId: string) {
  const event = await fetchEventById(eventId);
  if (!event) return null;

  const [participants, reminders, projectRes, profileIds] = await Promise.all([
    fetchParticipants([eventId]),
    fetchEventReminders(eventId, userId),
    event.project_id
      ? supabase.from("projects").select("name").eq("id", event.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    (() => {
      const ids = [event.created_by, event.user_id].filter(Boolean) as string[];
      return ids.length
        ? supabase.from("profiles").select("id, full_name").in("id", ids)
        : Promise.resolve({ data: [] });
    })(),
  ]);

  const names = new Map((profileIds.data ?? []).map((p) => [p.id, p.full_name ?? "Member"]));

  return {
    event,
    item: eventToCalendarItem(event, {
      projectName: projectRes.data?.name ?? null,
      userName: event.user_id ? names.get(event.user_id) : null,
      createdByName: names.get(event.created_by),
      participantIds: participants.map((p) => p.user_id),
      participantNames: participants.map((p) => p.full_name ?? "Member"),
    }),
    participants,
    reminders,
    formValues: formValuesFromEvent(
      event,
      reminders,
      participants.map((p) => p.user_id),
    ),
  };
}
