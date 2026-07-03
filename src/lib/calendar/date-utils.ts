import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import type { CalendarView } from "./constants";

export const WEEK_STARTS_ON = 1 as const; // Monday

export function getViewRange(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  switch (view) {
    case "month": {
      const monthStart = startOfMonth(anchor);
      const monthEnd = endOfMonth(anchor);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON }),
        end: endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON }),
      };
    }
    case "week":
      return {
        start: startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON }),
        end: endOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON }),
      };
    case "day":
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case "agenda":
      return { start: startOfDay(anchor), end: endOfDay(addDays(anchor, 30)) };
  }
}

export function navigateDate(view: CalendarView, anchor: Date, direction: -1 | 1): Date {
  switch (view) {
    case "month":
      return direction === 1 ? addMonths(anchor, 1) : subMonths(anchor, 1);
    case "week":
      return direction === 1 ? addWeeks(anchor, 1) : subWeeks(anchor, 1);
    case "day":
    case "agenda":
      return direction === 1 ? addDays(anchor, 1) : subDays(anchor, 1);
  }
}

export function viewTitle(view: CalendarView, anchor: Date): string {
  switch (view) {
    case "month":
      return format(anchor, "MMMM yyyy");
    case "week": {
      const { start, end } = getViewRange("week", anchor);
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
      }
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    case "day":
      return format(anchor, "EEEE, MMMM d, yyyy");
    case "agenda":
      return `Agenda · ${format(anchor, "MMMM yyyy")}`;
  }
}

export function monthGridDays(anchor: Date): Date[] {
  const { start, end } = getViewRange("month", anchor);
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function formatEventTime(start: Date, end: Date, allDay: boolean): string {
  if (allDay) return "All day";
  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}
