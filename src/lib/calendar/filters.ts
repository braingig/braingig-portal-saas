import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { MANUAL_EVENT_TYPES, type LinkedRecordSource, type ManualEventType } from "./constants";
import type { CalendarFilters, CalendarItem } from "./types";

export function defaultFilters(): CalendarFilters {
  return {
    manualEventTypes: [],
    linkedRecords: [],
    projectId: null,
    assignedUserId: null,
    createdById: null,
    dateFrom: null,
    dateTo: null,
    search: "",
  };
}

function passesManualFilter(item: CalendarItem, types: ManualEventType[]): boolean {
  if (item.source !== "event") return true;
  if (types.length === 0) return true;
  return types.includes(item.eventType as ManualEventType);
}

function passesLinkedFilter(item: CalendarItem, sources: LinkedRecordSource[]): boolean {
  if (item.source === "event") return true;
  if (sources.length === 0) return true;
  return sources.includes(item.source as LinkedRecordSource);
}

export function applyCalendarFilters(
  items: CalendarItem[],
  filters: CalendarFilters,
): CalendarItem[] {
  let result = items;

  result = result.filter(
    (item) =>
      passesManualFilter(item, filters.manualEventTypes) &&
      passesLinkedFilter(item, filters.linkedRecords),
  );

  if (filters.projectId) {
    result = result.filter((item) => item.projectId === filters.projectId);
  }

  if (filters.assignedUserId) {
    result = result.filter(
      (item) =>
        item.userId === filters.assignedUserId ||
        item.participantIds.includes(filters.assignedUserId!),
    );
  }

  if (filters.createdById) {
    result = result.filter((item) => item.createdBy === filters.createdById);
  }

  if (filters.dateFrom) {
    const from = startOfDay(filters.dateFrom);
    result = result.filter((item) => item.end >= from);
  }

  if (filters.dateTo) {
    const to = endOfDay(filters.dateTo);
    result = result.filter((item) => item.start <= to);
  }

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.projectName?.toLowerCase().includes(q) ?? false) ||
        (item.notes?.toLowerCase().includes(q) ?? false) ||
        (item.location?.toLowerCase().includes(q) ?? false) ||
        (item.description?.toLowerCase().includes(q) ?? false),
    );
  }

  return result;
}

export function itemsForDay(items: CalendarItem[], day: Date): CalendarItem[] {
  const start = startOfDay(day);
  const end = endOfDay(day);
  return items.filter((item) =>
    isWithinInterval(item.start, { start, end }) ||
    isWithinInterval(item.end, { start, end }) ||
    (item.start <= start && item.end >= end),
  );
}

export function sortByStart(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
}
