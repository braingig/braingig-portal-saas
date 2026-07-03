import { useState } from "react";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskPreviewSubtaskRow } from "@/components/tasks/preview/task-preview-subtask-row";
import { previewMeta } from "@/components/tasks/preview/task-preview-styles";
import type { TaskDetailRecord, TaskListItem } from "@/lib/tasks/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TaskPreviewSubtasksProps = {
  parentTask: TaskDetailRecord;
  subtasks: TaskListItem[];
  orgId: string;
  userId: string;
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
  onChange,
  onOpenTask,
  createOpen: createOpenProp,
  onCreateOpenChange,
}: TaskPreviewSubtasksProps) {
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

  return (
    <>
      {subtasks.length === 0 ? (
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
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      )}

      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgId}
        userId={userId}
        parentTaskId={parentTask.id}
        defaultProjectId={parentTask.project_id ?? undefined}
        defaultMilestoneId={parentTask.milestone_id ?? undefined}
        subtaskPosition={subtasks.length}
        onSuccess={onChange}
      />

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
