import { Link } from "@tanstack/react-router";
import { CheckSquare, FolderKanban, Pencil, Trash2 } from "lucide-react";
import { TaskStatusPicker } from "@/components/tasks/task-status-picker";
import { TASK_PRIORITY_STYLES } from "@/lib/tasks/status";
import type { TaskDetailRecord } from "@/lib/tasks/types";
import { dsCaption, dsTaskTitle } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type TaskDetailsHeaderProps = {
  task: TaskDetailRecord;
  projectName: string | null;
  parentTask?: Pick<TaskDetailRecord, "id" | "title"> | null;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  canDelete?: boolean;
};

export function TaskDetailsHeader({
  task,
  projectName,
  parentTask,
  onEdit,
  onDelete,
  onStatusChange,
  canDelete = true,
}: TaskDetailsHeaderProps) {
  const priorityClass = TASK_PRIORITY_STYLES[task.priority] ?? TASK_PRIORITY_STYLES.medium;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-surface/40 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                <CheckSquare className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={cn("break-words", dsTaskTitle)}>
                  {task.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {parentTask && (
                    <Link
                      to="/tasks/$taskId"
                      params={{ taskId: parentTask.id }}
                      className={cn("inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5", dsCaption, "transition-colors hover:text-brand")}
                    >
                      Subtask of {parentTask.title}
                    </Link>
                  )}
                  <span className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    priorityClass,
                  )}>
                    {task.priority}
                  </span>
                  {task.project_id && projectName && (
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: task.project_id }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-brand"
                    >
                      <FolderKanban className="size-3.5" />
                      {projectName}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <div className="flex items-center gap-2">
              <TaskStatusPicker status={task.status} onChange={onStatusChange} />
              <button
                type="button"
                onClick={onEdit}
                className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                aria-label="Edit task"
              >
                <Pencil className="size-4" />
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Delete task"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <p className="max-w-xs text-right text-[11px] leading-relaxed text-muted-foreground">
              Move to Review when ready. Mark Done when work is complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
