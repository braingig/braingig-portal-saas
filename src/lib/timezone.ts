const FALLBACK_TIMEZONE = "UTC";

export function isValidTimezone(timezone: string): boolean {
  const trimmed = timezone.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimezone(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || !isValidTimezone(trimmed)) return FALLBACK_TIMEZONE;
  return trimmed;
}

export function listTimezones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return [FALLBACK_TIMEZONE, "Asia/Dhaka", "America/New_York", "Europe/London"];
}

export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getLocalHourInTimezone(date: Date, timezone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: normalizeTimezone(timezone),
      hour: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    return Number.isNaN(hour) ? null : hour % 24;
  } catch {
    return null;
  }
}

/** True during the first hour after midnight in the org timezone (cron runs at minute 1). */
export function isOrgReminderHour(date: Date, timezone: string): boolean {
  return getLocalHourInTimezone(date, timezone) === 0;
}

export function formatTimezoneLabel(timezone: string): string {
  try {
    const offset = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    return offset ? `${timezone} (${offset})` : timezone;
  } catch {
    return timezone;
  }
}
