import { supabase } from "@/integrations/supabase/client";

export type MemberSession = {
  id: string;
  taskTitle: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
};

export type MemberTaskActivity = {
  taskId: string;
  taskTitle: string;
  totalSeconds: number;
  sessionCount: number;
  lastWorkedAt: string;
};

export type MemberAuditEvent = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
};

export type MemberDetail = {
  sessions: MemberSession[];
  taskActivity: MemberTaskActivity[];
  auditEvents: MemberAuditEvent[];
  assignedTaskCount: number;
  totalTrackedSeconds: number;
};

type TimeEntryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  task_id: string | null;
};

export async function loadMemberDetail(orgId: string, userId: string): Promise<MemberDetail> {
  const [entriesRes, auditRes, taskCountRes] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, started_at, ended_at, duration_seconds, task_id")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(100),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .eq("organization_id", orgId)
      .or(`actor_id.eq.${userId},and(entity_type.eq.user,entity_id.eq.${userId})`)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("assignee_id", userId),
  ]);

  const entries = (entriesRes.data ?? []) as TimeEntryRow[];
  const taskIds = [...new Set(entries.map((e) => e.task_id).filter(Boolean))] as string[];

  let taskMap = new Map<string, string>();
  if (taskIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title")
      .in("id", taskIds);
    taskMap = new Map((tasks ?? []).map((t) => [t.id, t.title]));
  }

  const sessions: MemberSession[] = entries.slice(0, 12).map((entry) => ({
    id: entry.id,
    taskTitle: entry.task_id ? (taskMap.get(entry.task_id) ?? "Untitled task") : null,
    startedAt: entry.started_at,
    endedAt: entry.ended_at,
    durationSeconds: entry.duration_seconds ?? 0,
  }));

  const activityMap = new Map<string, MemberTaskActivity>();
  let totalTrackedSeconds = 0;

  for (const entry of entries) {
    const seconds = entry.duration_seconds ?? 0;
    totalTrackedSeconds += seconds;
    if (!entry.task_id) continue;

    const existing = activityMap.get(entry.task_id);
    if (existing) {
      existing.totalSeconds += seconds;
      existing.sessionCount += 1;
      if (entry.started_at > existing.lastWorkedAt) {
        existing.lastWorkedAt = entry.started_at;
      }
    } else {
      activityMap.set(entry.task_id, {
        taskId: entry.task_id,
        taskTitle: taskMap.get(entry.task_id) ?? "Untitled task",
        totalSeconds: seconds,
        sessionCount: 1,
        lastWorkedAt: entry.started_at,
      });
    }
  }

  const taskActivity = [...activityMap.values()].sort(
    (a, b) => b.totalSeconds - a.totalSeconds,
  );

  return {
    sessions,
    taskActivity,
    auditEvents: (auditRes.data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      createdAt: row.created_at,
    })),
    assignedTaskCount: taskCountRes.count ?? 0,
    totalTrackedSeconds,
  };
}
