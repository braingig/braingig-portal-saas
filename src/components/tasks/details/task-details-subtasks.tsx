import { Layers, Plus } from "lucide-react";
import { useState } from "react";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { TaskListItemRow } from "@/components/tasks/task-list-item";
import type { TaskDetailRecord, TaskListItem } from "@/lib/tasks/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TaskDetailsSubtasksProps = {
  parentTask: TaskDetailRecord;
  subtasks: TaskListItem[];
  orgId: string;
  userId: string;
  onChange: () => void;
  bare?: boolean;
  onOpenTask?: (taskId: string) => void;
};

export function TaskDetailsSubtasks({
  parentTask,
  subtasks,
  orgId,
  userId,
  onChange,
  bare = false,
  onOpenTask,
}: TaskDetailsSubtasksProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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

  const listContent = subtasks.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No subtasks yet. Break this task into smaller steps with assignees, due dates, and more.
    </p>
  ) : (
    <div className={cn(!bare && "-mx-5 -mb-5 overflow-hidden rounded-b-xl border-t border-border")}>
      {subtasks.map((sub) => (
        <TaskListItemRow
          key={sub.id}
          task={sub}
          onToggleComplete={toggleComplete}
          onStatusChange={changeStatus}
          onEdit={(task) => setEditingTaskId(task.id)}
          onOpenTask={onOpenTask}
        />
      ))}
    </div>
  );

  const addButton = (
    <button
      type="button"
      onClick={() => setShowCreateModal(true)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-all hover:brightness-110"
    >
      <Plus className="size-3.5" />
      Add subtask
    </button>
  );

  return (
    <>
      {bare ? (
        <div className="space-y-3">
          <div className="flex justify-end">{addButton}</div>
          {listContent}
        </div>
      ) : (
        <TaskDetailsSection
          title="Subtasks"
          icon={Layers}
          count={subtasks.length}
          actions={addButton}
        >
          {listContent}
        </TaskDetailsSection>
      )}

      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
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
