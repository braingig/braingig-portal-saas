import { useState } from "react";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { QuickTaskAddRow } from "@/components/tasks/quick-task-add-row";
import { TaskPreviewSubtaskRow } from "@/components/tasks/preview/task-preview-subtask-row";
import { previewMeta } from "@/components/tasks/preview/task-preview-styles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { canDeleteTask, deleteTaskRecord, taskDeleteConfirmMessage } from "@/lib/tasks/delete-task";
import type { TaskDetailRecord, TaskListItem, TaskOrgMember } from "@/lib/tasks/types";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TaskPreviewSubtasksProps = {
  parentTask: TaskDetailRecord;
  subtasks: TaskListItem[];
  orgId: string;
  userId: string;
  members: TaskOrgMember[];
  onChange: () => void;
  onOpenTask?: (taskId: string) => void;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
};

export function TaskPreviewSubtasks({
  parentTask,
  subtasks,
  orgId,
  userId,
  members,
  onChange,
  onOpenTask,
  createOpen: createOpenProp,
  onCreateOpenChange,
}: TaskPreviewSubtasksProps) {
  const { hasAny } = useRoles();
  const [createOpenInternal, setCreateOpenInternal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const createOpen = createOpenProp ?? createOpenInternal;
  const setCreateOpen = onCreateOpenChange ?? setCreateOpenInternal;

  async function toggleComplete(task: TaskListItem) {
    const nextStatus = task.status === "done" ? "todo" : "done";
    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", task.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  async function changeStatus(task: TaskListItem, status: string) {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", task.id);
    if (error) toast.error(error.message);
    else onChange();
  }

  function requestDeleteSubtask(task: TaskListItem) {
    if (!canDeleteTask(task, userId, hasAny)) {
      toast.error("You do not have permission to delete this subtask");
      return;
    }
    setPendingDelete(task);
  }

  async function confirmDeleteSubtask() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTaskRecord(orgId, pendingDelete.id, userId);
      toast.success("Subtask deleted");
      setPendingDelete(null);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete subtask");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {createOpen && (
        <QuickTaskAddRow
          orgId={orgId}
          userId={userId}
          members={members}
          projectId={parentTask.project_id ?? undefined}
          milestoneId={parentTask.milestone_id ?? undefined}
          parentTaskId={parentTask.id}
          position={subtasks.length}
          isSubtask
          variant="preview"
          onSuccess={() => {
            setCreateOpen(false);
            onChange();
          }}
          onCancel={() => setCreateOpen(false)}
        />
      )}

      {subtasks.length === 0 && !createOpen ? (
        <p className={cn("py-2", previewMeta)}>No subtasks yet.</p>
      ) : (
        <div>
          {subtasks.map((sub, index) => (
            <TaskPreviewSubtaskRow
              key={sub.id}
              task={sub}
              showBorder={index < subtasks.length - 1}
              onToggleComplete={toggleComplete}
              onStatusChange={changeStatus}
              onEdit={(task) => setEditingTaskId(task.id)}
              onDelete={requestDeleteSubtask}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      )}

      {editingTaskId && (
        <EditTaskModal
          open={Boolean(editingTaskId)}
          onOpenChange={(open) => {
            if (!open) setEditingTaskId(null);
          }}
          orgId={orgId}
          userId={userId}
          taskId={editingTaskId}
          onSuccess={() => {
            setEditingTaskId(null);
            onChange();
          }}
        />
      )}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subtask?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `Delete "${pendingDelete.title}"? This cannot be undone.`
                : taskDeleteConfirmMessage({ isSubtask: true })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmDeleteSubtask(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
