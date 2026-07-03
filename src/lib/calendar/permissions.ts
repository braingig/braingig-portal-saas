import type { AppRole } from "@/lib/users/permissions";
import type { ManualEventType } from "./constants";
import { isManualCalendarEvent, isLinkedRecord } from "./constants";
import type { CalendarItem } from "./types";

export function canCreateHoliday(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function canCreateManualEventType(eventType: ManualEventType, role: AppRole): boolean {
  if (eventType === "holiday") return canCreateHoliday(role);
  return true;
}

export function canEditItem(item: CalendarItem, userId: string, role: AppRole): boolean {
  if (isLinkedRecord(item)) return false;
  if (!isManualCalendarEvent(item)) return false;
  if (role === "owner" || role === "admin") return true;
  if (item.eventType === "holiday") return canCreateHoliday(role);
  return item.createdBy === userId || item.userId === userId;
}

export function canDeleteItem(item: CalendarItem, userId: string, role: AppRole): boolean {
  return canEditItem(item, userId, role);
}

export function canDuplicateItem(item: CalendarItem): boolean {
  return isManualCalendarEvent(item);
}

export function canViewAllEvents(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "hr";
}

export function canViewTeamEvents(role: AppRole): boolean {
  return role === "team_lead";
}

export function isClientRole(role: AppRole): boolean {
  return role === "client";
}
