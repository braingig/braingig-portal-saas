import { Link } from "@tanstack/react-router";
import { CheckSquare, FolderKanban, Pencil, Trash2 } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { TaskStatusPicker } from "@/components/tasks/task-status-picker";
import { TASK_PRIORITY_STYLES } from "@/lib/tasks/status";
import type { TaskDetailRecord } from "@/lib/tasks/types";
import { dsProjectTitle } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type TaskDetailsHeaderProps = {
  task: TaskDetailRecord;
  projectName: string | null;
  folderName: string | null;
  parentTask?: Pick<TaskDetailRecord, "id" | "title"> | null;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  canDelete?: boolean;
};

export function TaskDetailsHeader({
  task,
  projectName,
  folderName,
  parentTask,
  onEdit,
  onDelete,
  onStatusChange,
  canDelete = true,
}: TaskDetailsHeaderProps) {
  const priorityClass = TASK_PRIORITY_STYLES[task.priority] ?? TASK_PRIORITY_STYLES.medium;

  return (
    <div className="space-y-5">
      <BackLink to={parentTask ? `/tasks/${parentTask.id}` : "/tasks"}>
        {parentTask ? `Back to ${parentTask.title}` : "Back to tasks"}
      </BackLink>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <CheckSquare className="size-5" />
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className={cn("break-words", dsProjectTitle)}>
                {task.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusPicker
                  status={task.status}
                  onChange={onStatusChange}
                  size="md"
                />
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    priorityClass,
                  )}
                >
                  {task.priority}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[52px] text-xs text-muted-foreground">
            {task.project_id && projectName && (
              <Link
                to="/projects/$projectId"
                params={{ projectId: task.project_id }}
                className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-brand"
              >
                <FolderKanban className="size-3.5" />
                {projectName}
              </Link>
            )}
            {folderName && <span>{folderName}</span>}
            {parentTask && (
              <Link
                to="/tasks/$taskId"
                params={{ taskId: parentTask.id }}
                className="font-medium transition-colors hover:text-brand"
              >
                Subtask of {parentTask.title}
              </Link>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
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
      </div>
    </div>
  );
}
