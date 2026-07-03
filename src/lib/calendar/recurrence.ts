import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
} from "date-fns";
import type { Recurrence } from "./constants";
import type { CalendarEventRecord, CalendarItem } from "./types";
import { eventToCalendarItem } from "./mappers";

export function expandRecurringEvent(
  event: CalendarEventRecord,
  rangeStart: Date,
  rangeEnd: Date,
  meta: {
    projectName?: string | null;
    userName?: string | null;
    createdByName?: string | null;
    participantIds?: string[];
    participantNames?: string[];
  } = {},
): CalendarItem[] {
  if (event.recurrence === "never" || event.recurrence_parent_id || !event.recurrence) {
    return [eventToCalendarItem(event, meta)];
  }

  const items: CalendarItem[] = [];
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const durationMs = end.getTime() - start.getTime();
  const recurrenceEnd = event.recurrence_end_at ? new Date(event.recurrence_end_at) : rangeEnd;

  let cursor = start;
  let instance = 0;
  const maxInstances = 500;

  while (
    !isAfter(cursor, rangeEnd) &&
    !isAfter(cursor, recurrenceEnd) &&
    instance < maxInstances
  ) {
    if (!isBefore(cursor, rangeStart) || instance === 0) {
      const instanceEnd = new Date(cursor.getTime() + durationMs);
      if (!isBefore(instanceEnd, rangeStart)) {
        const instanceEvent: CalendarEventRecord = {
          ...event,
          start_at: cursor.toISOString(),
          end_at: instanceEnd.toISOString(),
        };
        const item = eventToCalendarItem(instanceEvent, meta);
        item.id = `${event.id}::${instance}`;
        item.isRecurringInstance = instance > 0;
        items.push(item);
      }
    }

    cursor = nextOccurrence(cursor, event.recurrence);
    instance += 1;

    if (isAfter(cursor, recurrenceEnd)) break;
  }

  return items;
}

function nextOccurrence(date: Date, recurrence: Recurrence): Date {
  switch (recurrence) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addWeeks(date, 1);
    case "monthly":
      return addMonths(date, 1);
    case "yearly":
      return addYears(date, 1);
    default:
      return addDays(date, 1);
  }
}

export function datesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  const aS = startOfDay(aStart);
  const aE = startOfDay(aEnd);
  const bS = startOfDay(bStart);
  const bE = startOfDay(bEnd);
  return !(isAfter(aS, bE) || isBefore(aE, bS) || (isEqual(aS, bE) && isEqual(aE, bS)));
}
