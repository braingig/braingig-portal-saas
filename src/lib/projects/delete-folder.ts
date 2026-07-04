import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";

export function folderDeleteConfirmMessage(taskCount: number): string {
  if (taskCount > 0) {
    return `Delete this folder? ${taskCount} task${taskCount === 1 ? "" : "s"} will become unfiled (not deleted). This cannot be undone.`;
  }
  return "Delete this folder? This cannot be undone.";
}

export async function deleteProjectFolder(folderId: string): Promise<void> {
  const { error } = await supabase.from("milestones").delete().eq("id", folderId);
  if (error) throw new Error(error.message);

  await logAudit("milestone.deleted", "milestone", folderId);
}
