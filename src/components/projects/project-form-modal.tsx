import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { isRichTextEmpty } from "@/components/ui/rich-text-editor";
import { ProjectForm } from "@/components/projects/project-form";
import { PROJECT_FORM_DEFAULTS, type ProjectFormValues } from "@/lib/projects/constants";
import { createProject, PROJECT_MIGRATION_HINT } from "@/lib/projects/create-project";
import { projectToFormValues } from "@/lib/projects/mappers";
import type { ProjectRecord } from "@/lib/projects/types";
import { updateProject } from "@/lib/projects/update-project";
import { toast } from "sonner";

type ProjectFormModalProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  userId: string;
  project?: ProjectRecord | null;
  onSuccess: () => void;
};

export function ProjectFormModal({
  mode,
  open,
  onOpenChange,
  orgId,
  userId,
  project,
  onSuccess,
}: ProjectFormModalProps) {
  const [values, setValues] = useState<ProjectFormValues>(PROJECT_FORM_DEFAULTS);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = mode === "edit";
  const formId = isEdit ? "edit-project-form" : "create-project-form";

  useEffect(() => {
    if (!open) return;
    if (isEdit && project) {
      setValues(projectToFormValues(project));
    } else {
      setValues(PROJECT_FORM_DEFAULTS);
    }
    setNewFiles([]);
  }, [open, isEdit, project]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setValues(PROJECT_FORM_DEFAULTS);
      setNewFiles([]);
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!values.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (isRichTextEmpty(values.description)) {
      toast.error("Description is required");
      return;
    }
    if (isEdit && !project) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        const { attachmentUploaded, attachmentsFailed, needsMigration } = await updateProject({
          projectId: project!.id,
          orgId,
          userId,
          values,
          files: newFiles,
        });

        if (needsMigration) {
          toast.warning(`Project updated with basic fields only. ${PROJECT_MIGRATION_HINT}`);
        } else if (newFiles.length > 0 && attachmentsFailed) {
          toast.warning("Project updated, but some files failed to upload.");
        } else if (attachmentUploaded) {
          toast.success("Project updated with new attachments");
        } else {
          toast.success("Project updated");
        }
      } else {
        const { attachmentUploaded, attachmentsFailed, needsMigration } = await createProject({
          orgId,
          userId,
          values,
          files: newFiles,
        });

        if (needsMigration) {
          toast.warning(`Project created with basic fields only. ${PROJECT_MIGRATION_HINT}`);
        } else if (newFiles.length > 0 && attachmentsFailed) {
          toast.warning("Project created, but some files failed to upload.");
        } else if (attachmentUploaded) {
          toast.success("Project created with attachments");
        } else {
          toast.success("Project created");
        }
      }

      onSuccess();
      handleOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} project`;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? "Edit project" : "New project"}
      description={
        isEdit
          ? "Update project details, description, and attachments."
          : "Add a new project with details, description, and attachments."
      }
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="border-border bg-background hover:bg-surface"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={submitting}
            className="bg-brand text-brand-foreground hover:brightness-110"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <ProjectForm
          values={values}
          onChange={setValues}
          newFiles={newFiles}
          onNewFilesChange={setNewFiles}
          orgId={orgId}
          projectId={isEdit ? project?.id : undefined}
          idPrefix={isEdit ? "edit-project" : "project"}
        />
      </form>
    </AppModal>
  );
}
