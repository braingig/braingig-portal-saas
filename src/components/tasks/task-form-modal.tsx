import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckSquare, ChevronRight, ListTree, Loader2, Trash2, X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { TaskDeleteConfirmDialog } from "@/components/tasks/task-delete-confirm-dialog";
import { TaskForm } from "@/components/tasks/task-form";
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
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";
import { TASK_FORM_DEFAULTS, type TaskFormValues } from "@/lib/tasks/constants";
import { createTask, TASK_MIGRATION_HINT } from "@/lib/tasks/create-task";
import { canDeleteTask, deleteTaskRecord } from "@/lib/tasks/delete-task";
import { taskToFormValues } from "@/lib/tasks/mappers";
import { updateTask } from "@/lib/tasks/update-task";
import { countSubtasks } from "@/lib/tasks/subtasks";
import { fetchAssignableMembers, fetchMentionableMembers } from "@/lib/tasks/org-members";
import type { TaskDetailRecord, TaskOrgMember, TaskProjectOption } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TaskFormModalProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  userId: string;
  taskId?: string;
  defaultProjectId?: string;
  defaultMilestoneId?: string;
  parentTaskId?: string;
  subtaskPosition?: number;
  onSuccess: () => void;
};

export function TaskFormModal({
  mode,
  open,
  onOpenChange,
  orgId,
  userId,
  taskId,
  defaultProjectId,
  defaultMilestoneId,
  parentTaskId,
  subtaskPosition = 0,
  onSuccess,
}: TaskFormModalProps) {
  const { hasAny } = useRoles();
  const isSubtask = Boolean(parentTaskId);
  const [values, setValues] = useState<TaskFormValues>(TASK_FORM_DEFAULTS);
  const [files, setFiles] = useState<File[]>([]);
  const [projects, setProjects] = useState<TaskProjectOption[]>([]);
  const [members, setMembers] = useState<TaskOrgMember[]>([]);
  const [mentionMembers, setMentionMembers] = useState<TaskOrgMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTask, setLoadingTask] = useState(false);
  const [loadedTask, setLoadedTask] = useState<TaskDetailRecord | null>(null);
  const [previousAssigneeIds, setPreviousAssigneeIds] = useState<string[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [parentTitle, setParentTitle] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubtaskCount, setDeleteSubtaskCount] = useState(0);

  const isEdit = mode === "edit";
  const isSubtaskForm = isSubtask || Boolean(loadedTask?.parent_id);
  const formId = isEdit ? "edit-task-form" : "create-task-form";

  const activeProjectId = values.projectId || defaultProjectId || loadedTask?.project_id || "";
  const activeMilestoneId = values.milestoneId || defaultMilestoneId || loadedTask?.milestone_id || "";

  useEffect(() => {
    if (!open || !orgId) return;

    setFiles([]);

    supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", orgId)
      .order("name")
      .then(({ data }) => setProjects(data ?? []));

    fetchAssignableMembers(orgId).then(setMembers);
    fetchMentionableMembers(orgId).then(setMentionMembers);

    if (isEdit && taskId) {
      setLoadingTask(true);
      void (async () => {
        try {
          const [taskRes, assigneeRes] = await Promise.all([
            supabase.from("tasks").select("*").eq("id", taskId).single(),
            supabase.from("task_assignees").select("user_id").eq("task_id", taskId),
          ]);

          if (taskRes.error || !taskRes.data) {
            toast.error(taskRes.error?.message ?? "Task not found");
            return;
          }

          const taskData = taskRes.data as TaskDetailRecord;
          setLoadedTask(taskData);
          const assigneeIds = (assigneeRes.data ?? []).map((a) => a.user_id);
          setPreviousAssigneeIds(assigneeIds);
          setValues(taskToFormValues(taskData, assigneeIds));
        } finally {
          setLoadingTask(false);
        }
      })();
    } else {
      setLoadedTask(null);
      setPreviousAssigneeIds([]);
      setValues({
        ...TASK_FORM_DEFAULTS,
        projectId: defaultProjectId ?? "",
        milestoneId: defaultMilestoneId ?? "",
      });

      if (parentTaskId) {
        Promise.all([
          supabase.from("tasks").select("assignee_id, title").eq("id", parentTaskId).single(),
          supabase.from("task_assignees").select("user_id").eq("task_id", parentTaskId),
        ]).then(([taskRes, assigneeRes]) => {
          if (taskRes.data?.title) setParentTitle(taskRes.data.title);
          const assigneeIds = new Set<string>();
          for (const row of assigneeRes.data ?? []) assigneeIds.add(row.user_id);
          if (taskRes.data?.assignee_id) assigneeIds.add(taskRes.data.assignee_id);
          if (assigneeIds.size === 0) return;
          setValues((current) => ({
            ...current,
            assigneeIds: [...assigneeIds],
          }));
        });
      } else {
        setParentTitle(null);
      }
    }
  }, [open, orgId, isEdit, taskId, defaultProjectId, defaultMilestoneId, parentTaskId]);

  useEffect(() => {
    if (!open) return;

    if (activeProjectId) {
      const fromList = projects.find((p) => p.id === activeProjectId)?.name;
      if (fromList) {
        setProjectName(fromList);
      } else {
        supabase
          .from("projects")
          .select("name")
          .eq("id", activeProjectId)
          .maybeSingle()
          .then(({ data }) => setProjectName(data?.name ?? null));
      }
    } else {
      setProjectName(null);
    }

    if (activeMilestoneId) {
      supabase
        .from("milestones")
        .select("title")
        .eq("id", activeMilestoneId)
        .maybeSingle()
        .then(({ data }) => setFolderName(data?.title ?? null));
    } else {
      setFolderName(null);
    }
  }, [open, activeProjectId, activeMilestoneId, projects]);

  async function requestDelete() {
    if (!isEdit || !taskId || !loadedTask) return;
    if (!canDeleteTask(loadedTask, userId, hasAny)) {
      toast.error("You do not have permission to delete this task");
      return;
    }

    const subtaskCount = loadedTask.parent_id ? 0 : await countSubtasks(taskId);
    setDeleteSubtaskCount(subtaskCount);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!isEdit || !taskId || !loadedTask) return;

    setSubmitting(true);
    try {
      await deleteTaskRecord(orgId, taskId, userId);
      toast.success(loadedTask.parent_id ? "Subtask deleted" : "Task deleted");
      setDeleteDialogOpen(false);
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setSubmitting(false);
    }
  }

  const showDelete = isEdit && loadedTask;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setValues(TASK_FORM_DEFAULTS);
      setFiles([]);
      setProjectName(null);
      setFolderName(null);
      setParentTitle(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!values.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (isEdit && !taskId) return;

    setSubmitting(true);
    try {
      const authorName =
        mentionMembers.find((m) => m.id === userId)?.full_name
        ?? members.find((m) => m.id === userId)?.full_name
        ?? "Someone";

      if (isEdit) {
        const { attachmentUploaded, attachmentsFailed, needsMigration } = await updateTask({
          taskId: taskId!,
          orgId,
          userId,
          authorName,
          values,
          files,
          mentionMembers,
          previousDescription: loadedTask?.description,
          previousNote: loadedTask?.note,
          previousAssigneeIds,
          previousPriority: loadedTask?.priority ?? null,
          isSubtask: Boolean(loadedTask?.parent_id),
        });

        if (needsMigration) {
          toast.warning(`Task updated with basic fields only. ${TASK_MIGRATION_HINT}`);
        } else if (files.length > 0 && attachmentsFailed) {
          toast.warning("Task updated, but some files failed to upload.");
        } else if (attachmentUploaded) {
          toast.success("Task updated with new attachments");
        } else {
          toast.success("Task updated");
        }
      } else {
        const { attachmentUploaded, attachmentsFailed, needsMigration } = await createTask({
          orgId,
          userId,
          authorName,
          values,
          files,
          mentionMembers,
          parentId: parentTaskId ?? null,
          position: subtaskPosition,
        });

        if (needsMigration) {
          toast.warning(`Task created with basic fields only. ${TASK_MIGRATION_HINT}`);
        } else if (files.length > 0 && attachmentsFailed) {
          toast.warning(isSubtask ? "Subtask created, but some files failed to upload." : "Task created, but some files failed to upload.");
        } else if (attachmentUploaded) {
          toast.success(isSubtask ? "Subtask created with attachments" : "Task created with attachments");
        } else {
          toast.success(isSubtask ? "Subtask created" : "Task created");
        }
      }

      onSuccess();
      handleOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} task`;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const headerLabel = useMemo(() => {
    if (isEdit) return isSubtaskForm ? "Edit subtask" : "Edit task";
    return isSubtask ? "New subtask" : "New task";
  }, [isEdit, isSubtaskForm, isSubtask]);

  const submitLabel = isEdit
    ? "Save changes"
    : isSubtask
      ? "Create subtask"
      : "Create task";

  return (
    <>
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
            <nav className="flex min-w-0 flex-1 items-center gap-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{headerLabel}</span>
              {projectName ? (
                <>
                  <ChevronRight className="size-3 shrink-0 opacity-40" />
                  <span className="truncate">{projectName}</span>
                </>
              ) : (
                <>
                  <ChevronRight className="size-3 shrink-0 opacity-40" />
                  <span>Standalone</span>
                </>
              )}
              {folderName && (
                <>
                  <ChevronRight className="size-3 shrink-0 opacity-40" />
                  <span className="truncate">{folderName}</span>
                </>
              )}
              {parentTitle && (
                <>
                  <ChevronRight className="size-3 shrink-0 opacity-40" />
                  <span className="truncate">{parentTitle}</span>
                </>
              )}
            </nav>

            <DialogPrimitive.Close className={cn("grid size-8 place-items-center rounded-md text-muted-foreground", previewInteractiveHover)}>
              <X className="size-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {loadingTask ? (
              <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-muted-foreground">
                Loading task…
              </div>
            ) : (
              <form id={formId} onSubmit={handleSubmit} className="px-6 pb-6 pt-5">
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  {isSubtaskForm ? (
                    <ListTree className="size-3.5" />
                  ) : (
                    <CheckSquare className="size-3.5" />
                  )}
                  <span>{isSubtaskForm ? "Subtask" : "Task"}</span>
                </div>

                <TaskForm
                  values={values}
                  onChange={setValues}
                  files={files}
                  onFilesChange={setFiles}
                  orgId={orgId}
                  projects={projects}
                  members={members}
                  mentionMembers={mentionMembers}
                  isSubtask={isSubtaskForm}
                  idPrefix={isEdit ? "edit-task" : "task"}
                />
              </form>
            )}
          </div>

          <footer className={cn(previewFormFooter, "justify-between")}>
            <div>
              {showDelete && (
                <button
                  type="button"
                  onClick={() => void requestDelete()}
                  disabled={submitting || loadingTask}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
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
                disabled={submitting || loadingTask}
                className={previewFormSubmitBtn}
              >
                {submitting && <Loader2 className="size-3.5 animate-spin" />}
                {submitLabel}
              </button>
            </div>
          </footer>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>

    <TaskDeleteConfirmDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      isSubtask={isSubtaskForm}
      subtaskCount={deleteSubtaskCount}
      deleting={submitting}
      onConfirm={confirmDelete}
    />
    </>
  );
}
