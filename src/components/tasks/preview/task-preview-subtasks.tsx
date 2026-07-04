import { useState } from "react";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { QuickTaskAddRow } from "@/components/tasks/quick-task-add-row";
import { TaskPreviewSubtaskRow } from "@/components/tasks/preview/task-preview-subtask-row";
import { previewMeta } from "@/components/tasks/preview/task-preview-styles";
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

  async function handleDeleteSubtask(task: TaskListItem) {
    if (!canDeleteTask(task, userId, hasAny)) {
      toast.error("You do not have permission to delete this subtask");
      return;
    }
    if (!confirm(taskDeleteConfirmMessage({ isSubtask: true }))) return;

    try {
      await deleteTaskRecord(orgId, task.id);
      toast.success("Subtask deleted");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete subtask");
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
              onDelete={handleDeleteSubtask}
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
    </>
  );
}
