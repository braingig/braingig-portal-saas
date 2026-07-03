import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/tasks/task-form";
import { supabase } from "@/integrations/supabase/client";
import { TASK_FORM_DEFAULTS, type TaskFormValues } from "@/lib/tasks/constants";
import { createTask, TASK_MIGRATION_HINT } from "@/lib/tasks/create-task";
import { taskToFormValues } from "@/lib/tasks/mappers";
import { updateTask } from "@/lib/tasks/update-task";
import { fetchAssignableMembers, fetchMentionableMembers } from "@/lib/tasks/org-members";
import type { TaskDetailRecord, TaskOrgMember, TaskProjectOption } from "@/lib/tasks/types";
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

  const isEdit = mode === "edit";
  const isSubtaskForm = isSubtask || Boolean(loadedTask?.parent_id);
  const formId = isEdit ? "edit-task-form" : "create-task-form";

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
      Promise.all([
        supabase.from("tasks").select("*").eq("id", taskId).single(),
        supabase.from("task_assignees").select("user_id").eq("task_id", taskId),
      ])
        .then(([taskRes, assigneeRes]) => {
          if (taskRes.error || !taskRes.data) {
            toast.error(taskRes.error?.message ?? "Task not found");
            return;
          }
          const taskData = taskRes.data as TaskDetailRecord;
          setLoadedTask(taskData);
          const assigneeIds = (assigneeRes.data ?? []).map((a) => a.user_id);
          setPreviousAssigneeIds(assigneeIds);
          setValues(taskToFormValues(taskData, assigneeIds));
        })
        .finally(() => setLoadingTask(false));
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
          supabase.from("tasks").select("assignee_id").eq("id", parentTaskId).single(),
          supabase.from("task_assignees").select("user_id").eq("task_id", parentTaskId),
        ]).then(([taskRes, assigneeRes]) => {
          const assigneeIds = new Set<string>();
          for (const row of assigneeRes.data ?? []) assigneeIds.add(row.user_id);
          if (taskRes.data?.assignee_id) assigneeIds.add(taskRes.data.assignee_id);
          if (assigneeIds.size === 0) return;
          setValues((current) => ({
            ...current,
            assigneeIds: [...assigneeIds],
          }));
        });
      }
    }
  }, [open, orgId, isEdit, taskId, defaultProjectId, defaultMilestoneId, parentTaskId]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setValues(TASK_FORM_DEFAULTS);
      setFiles([]);
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

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title={
        isEdit
          ? isSubtaskForm
            ? "Edit subtask"
            : "Edit task"
          : isSubtask
            ? "New subtask"
            : "New task"
      }
      titleBadge={
        isSubtaskForm ? (
          <Badge
            variant="secondary"
            className="border-border/60 bg-surface px-2 py-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Subtask
          </Badge>
        ) : undefined
      }
      description={
        isEdit
          ? isSubtaskForm
            ? "Update subtask details, assignees, and attachments."
            : "Update task details, assignees, and attachments."
          : isSubtask
            ? "Add a subtask with assignees, due date, description, and more."
            : "Add a task with details, assignees, and attachments."
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
            disabled={submitting || loadingTask}
            className="bg-brand text-brand-foreground hover:brightness-110"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : isSubtask ? "Create subtask" : "Create task"}
          </Button>
        </>
      }
    >
      {loadingTask ? (
        <p className="text-sm text-muted-foreground">Loading task…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit}>
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
    </AppModal>
  );
}
