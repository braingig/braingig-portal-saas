import { supabase } from "@/integrations/supabase/client";

export const PROJECT_ATTACHMENTS_BUCKET = "project-attachments";

export type ProjectAttachment = {
  id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string | null;
  url: string;
  downloadUrl: string;
};

/** Inline view URL — opens in the browser when possible. */
export function getAttachmentPublicUrl(storagePath: string) {
  const { data } = supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).getPublicUrl(storagePath, {
    download: false,
  });
  return data.publicUrl;
}

export function getAttachmentDownloadPublicUrl(storagePath: string, filename: string) {
  const { data } = supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).getPublicUrl(storagePath, {
    download: filename,
  });
  return data.publicUrl;
}

export async function getAttachmentViewUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(PROJECT_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 3600, { download: false });

  if (!error && data?.signedUrl) return data.signedUrl;
  return getAttachmentPublicUrl(storagePath);
}

export async function getAttachmentDownloadUrl(storagePath: string, filename: string) {
  const { data, error } = await supabase.storage
    .from(PROJECT_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 3600, { download: filename });

  if (!error && data?.signedUrl) return data.signedUrl;
  return getAttachmentDownloadPublicUrl(storagePath, filename);
}

async function resolveAttachmentUrls(storagePath: string, name: string) {
  const [url, downloadUrl] = await Promise.all([
    getAttachmentViewUrl(storagePath),
    getAttachmentDownloadUrl(storagePath, name),
  ]);
  return { url, downloadUrl };
}

export function projectAttachmentPrefix(orgId: string, projectId: string) {
  return `${orgId}/${projectId}/`;
}

export function isImageAttachment(mime: string | null | undefined, name: string) {
  if (mime?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
}

export function isPdfAttachment(mime: string | null | undefined, name: string) {
  if (mime === "application/pdf") return true;
  return /\.pdf$/i.test(name);
}

export async function listProjectAttachments(orgId: string, projectId: string) {
  const prefix = projectAttachmentPrefix(orgId, projectId);

  const { data, error } = await supabase
    .from("file_assets")
    .select("id, name, storage_path, size_bytes, mime_type")
    .eq("organization_id", orgId)
    .like("storage_path", `${prefix}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const attachments = await Promise.all(
    rows.map(async (row) => {
      const { url, downloadUrl } = await resolveAttachmentUrls(row.storage_path, row.name);
      return { ...row, url, downloadUrl };
    }),
  );
  return attachments as ProjectAttachment[];
}

export async function uploadProjectFiles(
  orgId: string,
  userId: string,
  projectId: string,
  files: File[],
): Promise<ProjectAttachment[]> {
  const uploaded: ProjectAttachment[] = [];

  for (const file of files) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const path = `${projectAttachmentPrefix(orgId, projectId)}${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

    const { error } = await supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.warn("File upload failed:", error.message);
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
      console.warn("Failed to register file:", insertError?.message);
      continue;
    }

    const { url, downloadUrl } = await resolveAttachmentUrls(path, file.name);
    uploaded.push({ ...data, url, downloadUrl });
  }

  return uploaded;
}

export async function deleteProjectAttachment(attachment: Pick<ProjectAttachment, "id" | "storage_path">) {
  await supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).remove([attachment.storage_path]);
  const { error } = await supabase.from("file_assets").delete().eq("id", attachment.id);
  if (error) throw error;
}

export async function syncPrimaryAttachmentUrl(projectId: string, orgId: string) {
  const attachments = await listProjectAttachments(orgId, projectId);
  const primaryUrl = attachments[0]?.url ?? null;
  await supabase.from("projects").update({ attachment_url: primaryUrl }).eq("id", projectId);
}
