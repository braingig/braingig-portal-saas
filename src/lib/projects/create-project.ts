import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { syncPrimaryAttachmentUrl, uploadProjectFiles } from "./attachments";
import type { ProjectFormValues } from "./constants";
import { buildBasePayload, buildExtendedPayload } from "./payload";
import { isMissingColumnError } from "./upload-attachment";
import {
  notifyProjectCreated,
  notifyProjectMentions,
} from "@/lib/notifications/project-notifications";

type CreateProjectInput = {
  orgId: string;
  userId: string;
  values: ProjectFormValues;
  files: File[];
};

export async function createProject({ orgId, userId, values, files }: CreateProjectInput) {
  let payload = { ...buildExtendedPayload(values), organization_id: orgId, owner_id: userId };
  let usedFallback = false;

  let { data, error } = await supabase.from("projects").insert(payload).select().single();

  if (error && isMissingColumnError(error)) {
    payload = { ...buildBasePayload(values), organization_id: orgId, owner_id: userId };
    ({ data, error } = await supabase.from("projects").insert(payload).select().single());
    usedFallback = true;
  }

  if (error) throw error;

  let uploadedCount = 0;
  if (files.length > 0) {
    const uploaded = await uploadProjectFiles(orgId, userId, data.id, files);
    uploadedCount = uploaded.length;
    if (uploadedCount > 0) {
      await syncPrimaryAttachmentUrl(data.id, orgId);
    }
  }

  await logAudit("project.created", "project", data.id, {
    name: values.name,
    status: values.status,
    attachmentCount: uploadedCount,
    partialSave: usedFallback,
  });

  void notifyProjectCreated({
    orgId,
    projectId: data.id,
    projectName: values.name.trim(),
    actorId: userId,
  }).catch((err) => console.warn("Project created notification failed:", err));

  void notifyProjectMentions({
    orgId,
    projectId: data.id,
    projectName: values.name.trim(),
    actorId: userId,
    description: values.description,
    note: values.note,
  }).catch((err) => console.warn("Project mention notification failed:", err));

  return {
    project: data,
    attachmentUploaded: uploadedCount > 0,
    attachmentsFailed: files.length > uploadedCount,
    needsMigration: usedFallback,
  };
}

export const PROJECT_MIGRATION_HINT =
  "Run supabase/migrations/20260619_project_fields.sql in your Supabase SQL Editor to save description, notes, rates, and file attachments.";
