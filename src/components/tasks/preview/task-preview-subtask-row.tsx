import { format, isPast, isToday } from "date-fns";
import { Calendar, CheckCircle2, Pencil, User } from "lucide-react";
import { TaskStatusPicker } from "@/components/tasks/task-status-picker";
import {
  previewStatusPill,
  previewSubtaskMeta,
  previewSubtaskTitle,
} from "@/components/tasks/preview/task-preview-styles";
import type { TaskListItem } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewSubtaskRowProps = {
  task: TaskListItem;
  onToggleComplete: (task: TaskListItem) => void;
  onStatusChange: (task: TaskListItem, status: string) => void;
  onEdit: (task: TaskListItem) => void;
  onOpenTask?: (taskId: string) => void;
  showBorder?: boolean;
};

function dueLabel(dueDate: string) {
  const date = new Date(dueDate);
  if (isToday(date)) return "Today";
  if (isPast(date)) return format(date, "MMM d");
  return format(date, "MMM d");
}

export function TaskPreviewSubtaskRow({
  task,
  onToggleComplete,
  onStatusChange,
  onEdit,
  onOpenTask,
  showBorder = true,
}: TaskPreviewSubtaskRowProps) {
  const isDone = task.status === "done";

  return (
    <div
      className={cn(
        "group -mx-1 flex min-h-[36px] items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors hover:bg-surface/50",
        showBorder && "border-b border-border/30 last:border-b-0",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(task)}
        className="group/check grid size-5 shrink-0 place-items-center text-muted-foreground/60 transition-colors hover:text-brand"
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone ? (
          <CheckCircle2 className="size-4 text-brand transition-all duration-200 ease-out animate-in zoom-in-50" />
        ) : (
          <span className="size-4 rounded-full border-[1.5px] border-muted-foreground/45 transition-all duration-200 group-hover/check:border-brand group-hover/check:bg-brand/5" />
        )}
      </button>

      {onOpenTask ? (
        <button
          type="button"
          onClick={() => onOpenTask(task.id)}
          className={cn(
            "min-w-0 flex-1 truncate text-left transition-colors hover:text-brand",
            previewSubtaskTitle,
            isDone && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </button>
      ) : (
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            previewSubtaskTitle,
            isDone && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </span>
      )}

      <div className={cn("ml-1 hidden shrink-0 items-center text-xs sm:flex", previewSubtaskMeta)}>
        <TaskStatusPicker
          status={task.status}
          onChange={(status) => onStatusChange(task, status)}
          className={previewStatusPill}
        />

        <span className="inline-flex w-[5.5rem] items-center gap-1 truncate">
          {task.profiles ? (
            <>
              <User className="size-3 shrink-0 text-muted-foreground/60" strokeWidth={1.75} />
              <span className="truncate">{task.profiles.full_name}</span>
            </>
          ) : (
            <>
              <User className="size-3 shrink-0 text-muted-foreground/50" strokeWidth={1.75} />
              <span className="text-muted-foreground/70">Unassigned</span>
            </>
          )}
        </span>

        <span className="inline-flex w-[4.5rem] items-center gap-1 truncate">
          <Calendar className="size-3 shrink-0 text-muted-foreground/60" strokeWidth={1.75} />
          <span className={cn("truncate", !task.due_date && "text-muted-foreground/70")}>
            {task.due_date ? dueLabel(task.due_date) : "No date"}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={() => onEdit(task)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-surface hover:text-foreground group-hover:opacity-100"
        aria-label={`Edit ${task.title}`}
      >
        <Pencil className="size-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
