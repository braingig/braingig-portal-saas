export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function parseTimeOnDate(dateKey: string, time: string): Date {
  const base = parseDateKey(dateKey);
  const [h, m, s = "0"] = time.split(":");
  base.setHours(Number(h), Number(m), Number(s), 0);
  return base;
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function eachDateInRange(startKey: string, endKey: string): string[] {
  const dates: string[] = [];
  const cur = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  while (cur <= end) {
    dates.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function isDateInLeave(
  dateKey: string,
  leaves: { start_date: string; end_date: string }[],
): boolean {
  return leaves.some((l) => dateKey >= l.start_date && dateKey <= l.end_date);
}

export function monthRange(anchor = new Date()): { start: string; end: string } {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}
