import { ChevronDown, Layers, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { TaskPreviewSubtaskRow } from "@/components/tasks/preview/task-preview-subtask-row";
import type { TaskDetailRecord, TaskListItem } from "@/lib/tasks/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PREVIEW_LIMIT = 4;
const SCROLL_AFTER = 6;

type TaskDetailsSubtasksProps = {
  parentTask: TaskDetailRecord;
  subtasks: TaskListItem[];
  orgId: string;
  userId: string;
  onChange: () => void;
  bare?: boolean;
  onOpenTask?: (taskId: string) => void;
};

function SubtaskProgress({ subtasks }: { subtasks: TaskListItem[] }) {
  const doneCount = subtasks.filter((s) => s.status === "done").length;
  const total = subtasks.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{doneCount}</span>
          {" "}of{" "}
          <span className="font-medium text-foreground">{total}</span>
          {" "}complete
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

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
  const [showAll, setShowAll] = useState(false);

  const canExpand = subtasks.length > PREVIEW_LIMIT;
  const visibleSubtasks = useMemo(
    () => (showAll || !canExpand ? subtasks : subtasks.slice(0, PREVIEW_LIMIT)),
    [subtasks, showAll, canExpand],
  );
  const hiddenCount = subtasks.length - PREVIEW_LIMIT;
  const useScroll = showAll && subtasks.length > SCROLL_AFTER;

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

  const listContent = subtasks.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No subtasks yet. Break this task into smaller steps with assignees, due dates, and more.
    </p>
  ) : (
    <div>
      <SubtaskProgress subtasks={subtasks} />

      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-border bg-surface/20",
          useScroll && "max-h-[min(45vh,380px)]",
        )}
      >
        <div
          className={cn(
            "px-1 py-1",
            useScroll && "overflow-y-auto overscroll-contain",
          )}
        >
          {visibleSubtasks.map((sub, index) => (
            <TaskPreviewSubtaskRow
              key={sub.id}
              task={sub}
              onToggleComplete={toggleComplete}
              onStatusChange={changeStatus}
              onEdit={(task) => setEditingTaskId(task.id)}
              onOpenTask={onOpenTask}
              showBorder={index < visibleSubtasks.length - 1}
            />
          ))}
        </div>

        {useScroll && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card via-card/80 to-transparent"
          />
        )}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              showAll && "rotate-180",
            )}
          />
          {showAll
            ? "Show fewer subtasks"
            : `Show all ${subtasks.length} subtasks (${hiddenCount} more)`}
        </button>
      )}
    </div>
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
          description="Track progress without scrolling through the whole page."
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
