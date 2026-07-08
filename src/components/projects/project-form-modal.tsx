import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FolderKanban, Loader2, X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import {
  hasOpenNestedOverlay,
  isPortaledOverlayTarget,
} from "@/components/tasks/preview/task-preview-dialog-guards";
import {
  previewFormCancelBtn,
  previewFormFooter,
  previewFormSubmitBtn,
  previewInteractiveHover,
  previewModalShell,
} from "@/components/tasks/preview/task-preview-styles";
import { ProjectForm } from "@/components/projects/project-form";
import { isRichTextEmpty } from "@/components/ui/rich-text-editor";
import { PROJECT_FORM_DEFAULTS, type ProjectFormValues } from "@/lib/projects/constants";
import { createProject, PROJECT_MIGRATION_HINT } from "@/lib/projects/create-project";
import { projectToFormValues } from "@/lib/projects/mappers";
import type { ProjectRecord } from "@/lib/projects/types";
import { updateProject } from "@/lib/projects/update-project";
import {
  notifyProjectMentions,
  notifyProjectStatusChanged,
} from "@/lib/notifications/project-notifications";
import { fetchMentionableMembers } from "@/lib/tasks/org-members";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
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
  const [mentionMembers, setMentionMembers] = useState<TaskOrgMember[]>([]);

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

  useEffect(() => {
    if (!open || !orgId) return;
    void fetchMentionableMembers(orgId).then(setMentionMembers);
  }, [open, orgId]);

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
        const previousStatus = project?.status;
        const previousDescription = project?.description ?? "";
        const previousNote = project?.note ?? "";

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

        if (project) {
          if (previousStatus && values.status !== previousStatus) {
            void notifyProjectStatusChanged({
              orgId,
              projectId: project.id,
              projectName: values.name.trim(),
              actorId: userId,
              previousStatus,
              nextStatus: values.status,
            }).catch((err) => console.warn("Project status notification failed:", err));
          }

          void notifyProjectMentions({
            orgId,
            projectId: project.id,
            projectName: values.name.trim(),
            actorId: userId,
            description: values.description,
            note: values.note,
            previousDescription,
            previousNote,
            mentionMembers,
          }).catch((err) => console.warn("Project mention notification failed:", err));
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

  const headerLabel = useMemo(
    () => (isEdit ? "Edit project" : "New project"),
    [isEdit],
  );

  const submitLabel = isEdit ? "Save changes" : "Create project";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/45 backdrop-blur-[3px]" />
        <DialogPrimitive.Content
          className={previewModalShell}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (isPortaledOverlayTarget(e.target)) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (isPortaledOverlayTarget(e.target)) e.preventDefault();
          }}
          onFocusOutside={(e) => {
            if (isPortaledOverlayTarget(e.target)) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (hasOpenNestedOverlay()) e.preventDefault();
          }}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border/40 px-5 py-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <FolderKanban className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="font-medium text-foreground">{headerLabel}</span>
              {isEdit && project?.name && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="truncate">{project.name}</span>
                </>
              )}
            </div>

            <DialogPrimitive.Close
              className={cn(
                "grid size-8 place-items-center rounded-md text-muted-foreground",
                previewInteractiveHover,
              )}
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            <form id={formId} onSubmit={handleSubmit} className="px-6 pb-6 pt-5">
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
          </div>

          <footer className={previewFormFooter}>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              className={previewFormCancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              disabled={submitting}
              className={previewFormSubmitBtn}
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              {submitLabel}
            </button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
