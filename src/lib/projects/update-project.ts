import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { syncPrimaryAttachmentUrl, uploadProjectFiles } from "./attachments";
import type { ProjectFormValues } from "./constants";
import { buildBasePayload, buildExtendedPayload } from "./payload";
import { isMissingColumnError } from "./upload-attachment";
import { PROJECT_MIGRATION_HINT } from "./create-project";

type UpdateProjectInput = {
  projectId: string;
  orgId: string;
  userId: string;
  values: ProjectFormValues;
  files: File[];
};

export async function updateProject({ projectId, orgId, userId, values, files }: UpdateProjectInput) {
  let payload = buildExtendedPayload(values);
  let usedFallback = false;

  let { error } = await supabase.from("projects").update(payload).eq("id", projectId);

  if (error && isMissingColumnError(error)) {
    payload = buildBasePayload(values);
    ({ error } = await supabase.from("projects").update(payload).eq("id", projectId));
    usedFallback = true;
  }

  if (error) throw error;

  let uploadedCount = 0;
  if (files.length > 0) {
    const uploaded = await uploadProjectFiles(orgId, userId, projectId, files);
    uploadedCount = uploaded.length;
    if (uploadedCount > 0) {
      await syncPrimaryAttachmentUrl(projectId, orgId);
    }
  }

  await logAudit("project.updated", "project", projectId, {
    name: values.name,
    status: values.status,
    attachmentCount: uploadedCount,
    partialSave: usedFallback,
  });

  return {
    attachmentUploaded: uploadedCount > 0,
    attachmentsFailed: files.length > uploadedCount,
    needsMigration: usedFallback,
  };
}

export { PROJECT_MIGRATION_HINT };
