import { supabase } from "@/integrations/supabase/client";
import { PROJECT_ATTACHMENTS_BUCKET, getAttachmentPublicUrl } from "@/lib/projects/attachments";

export type TaskAttachment = {
  id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string | null;
  url: string;
};

export function taskAttachmentPrefix(orgId: string, taskId: string) {
  return `${orgId}/tasks/${taskId}/`;
}

export async function listTaskAttachments(orgId: string, taskId: string): Promise<TaskAttachment[]> {
  const prefix = taskAttachmentPrefix(orgId, taskId);

  const { data, error } = await supabase
    .from("file_assets")
    .select("id, name, storage_path, size_bytes, mime_type")
    .eq("organization_id", orgId)
    .like("storage_path", `${prefix}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    url: getAttachmentPublicUrl(row.storage_path),
  })) as TaskAttachment[];
}

export async function uploadTaskFiles(
  orgId: string,
  userId: string,
  taskId: string,
  files: File[],
): Promise<TaskAttachment[]> {
  const uploaded: TaskAttachment[] = [];

  for (const file of files) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const path = `${taskAttachmentPrefix(orgId, taskId)}${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

    const { error } = await supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.warn("Task file upload failed:", error.message);
      continue;
    }

    const { data, error: insertError } = await supabase
      .from("file_assets")
      .insert({
        organization_id: orgId,
        name: file.name,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type || null,
        uploaded_by: userId,
      })
      .select("id, name, storage_path, size_bytes, mime_type")
      .single();

    if (insertError || !data) {
      console.warn("Failed to register task file:", insertError?.message);
      continue;
    }

    uploaded.push({ ...data, url: getAttachmentPublicUrl(path) });
  }

  return uploaded;
}
