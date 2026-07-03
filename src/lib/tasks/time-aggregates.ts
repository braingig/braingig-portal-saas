import {
  endOfMonth,
  endOfWeek,
  format,
  isToday,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { TaskDailyTotal, TaskDetailProfile, TaskTimeEntry } from "@/lib/tasks/types";

export function buildWorkerRows(
  entries: TaskTimeEntry[],
  profiles: Map<string, TaskDetailProfile>,
  assigneeIds: string[],
  liveEntry?: { userId: string; seconds: number },
) {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    const seconds = entry.duration_seconds ?? 0;
    totals.set(entry.user_id, (totals.get(entry.user_id) ?? 0) + seconds);
  }

  if (liveEntry) {
    totals.set(liveEntry.userId, (totals.get(liveEntry.userId) ?? 0) + liveEntry.seconds);
  }

  const userIds = new Set<string>([...assigneeIds, ...totals.keys()]);

  return [...userIds]
    .map((userId) => {
      const profile = profiles.get(userId) ?? {
        id: userId,
        full_name: "Unknown",
        avatar_url: null,
      };
      return {
        profile,
        totalSeconds: totals.get(userId) ?? 0,
        isAssignee: assigneeIds.includes(userId),
      };
    })
    .filter((row) => row.isAssignee || row.totalSeconds > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}

export function getTodayEntries(
  entries: TaskTimeEntry[],
  profiles: Map<string, TaskDetailProfile>,
  activeTimer?: { userId: string; startedAt: string; liveSeconds: number },
) {
  const todayEntries = entries
    .filter((e) => isToday(parseISO(e.started_at)))
    .map((e) => ({
      ...e,
      profile: profiles.get(e.user_id) ?? {
        id: e.user_id,
        full_name: "Unknown",
        avatar_url: null,
      },
      isActive: false,
    }));

  if (activeTimer && isToday(parseISO(activeTimer.startedAt))) {
    const hasLive = todayEntries.some(
      (e) => e.user_id === activeTimer.userId && !e.ended_at,
    );
    if (!hasLive) {
      todayEntries.unshift({
        id: "active-timer",
        user_id: activeTimer.userId,
        started_at: activeTimer.startedAt,
        ended_at: null,
        duration_seconds: activeTimer.liveSeconds,
        profile: profiles.get(activeTimer.userId) ?? {
          id: activeTimer.userId,
          full_name: "Unknown",
          avatar_url: null,
        },
        isActive: true,
      });
    }
  }

  return todayEntries.sort(
    (a, b) => parseISO(b.started_at).getTime() - parseISO(a.started_at).getTime(),
  );
}

export function buildDailyTotals(
  entries: TaskTimeEntry[],
  profiles: Map<string, TaskDetailProfile>,
  period: "week" | "month",
): TaskDailyTotal[] {
  const now = new Date();
  const start = period === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
  const end = period === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

  const inRange = entries.filter((e) =>
    isWithinInterval(parseISO(e.started_at), { start, end }),
  );

  const byDate = new Map<string, TaskTimeEntry[]>();
  for (const entry of inRange) {
    const key = format(parseISO(entry.started_at), "yyyy-MM-dd");
    const list = byDate.get(key) ?? [];
    list.push(entry);
    byDate.set(key, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, dayEntries]) => {
      const date = parseISO(dateKey);
      const byPerson = new Map<string, number>();
      for (const entry of dayEntries) {
        const seconds = entry.duration_seconds ?? 0;
        byPerson.set(entry.user_id, (byPerson.get(entry.user_id) ?? 0) + seconds);
      }

      return {
        date: dateKey,
        dayLabel: format(date, "EEE"),
        totalSeconds: dayEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0),
        entryCount: dayEntries.length,
        byPerson: [...byPerson.entries()]
          .map(([userId, seconds]) => ({
            profile: profiles.get(userId) ?? {
              id: userId,
              full_name: "Unknown",
              avatar_url: null,
            },
            seconds,
          }))
          .sort((a, b) => b.seconds - a.seconds),
      };
    });
}

export function sumTodaySeconds(entries: TaskTimeEntry[], liveSeconds = 0) {
  const todayTotal = entries
    .filter((e) => isToday(parseISO(e.started_at)))
    .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
  return todayTotal + liveSeconds;
}
