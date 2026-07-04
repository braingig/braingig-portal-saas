import { supabase } from "@/integrations/supabase/client";
import type { TaskAuditRow } from "@/lib/tasks/task-audit";

export async function fetchTaskAudits(taskId: string, limit = 50): Promise<TaskAuditRow[]> {
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, actor_id, created_at, metadata")
    .eq("entity_id", taskId)
    .eq("entity_type", "task")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as TaskAuditRow[];
}
