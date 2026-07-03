import { Link } from "@tanstack/react-router";
import { format, isPast, isToday } from "date-fns";
import { Calendar, CheckCircle2, ChevronDown, ListPlus, Pencil, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatedCollapse, collapseChevronClass } from "@/components/ui/animated-collapse";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { TaskStatusPicker } from "@/components/tasks/task-status-picker";
import {
  tasksIconSm,
  tasksListDivider,
  tasksListTitle,
  tasksMuted,
  tasksRowHover,
  tasksSecondary,
  tasksStatusPill,
  tasksSubListTitle,
  tasksTitleInteractive,
} from "@/components/tasks/tasks-page-styles";
import { dsIconStroke } from "@/lib/design-system";
import { filterSubtasksForSearch, taskTitleMatchesSearch } from "@/lib/tasks/search";
import type { TaskListItem as TaskItem } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

/** Metadata columns — flex with explicit gaps for aligned status / assignee / due date */
const META_ROW = "hidden w-[20rem] shrink-0 items-center gap-5 sm:flex";
const META_STATUS = "flex w-[5.75rem] shrink-0 items-center justify-center";
const META_ASSIGNEE = "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden";
const META_DUE = "flex w-[4.5rem] shrink-0 items-center justify-end gap-1";

type TaskListItemProps = {
  task: TaskItem;
  searchQuery?: string;
  isSubtask?: boolean;
  nestedInFolder?: boolean;
  showBorder?: boolean;
  onToggleComplete: (task: TaskItem) => void;
  onStatusChange: (task: TaskItem, status: string) => void;
  onEdit: (task: TaskItem) => void;
  onAddSubtask?: (task: TaskItem) => void;
  onOpenTask?: (taskId: string) => void;
  subtaskCount?: number;
  subtasksExpanded?: boolean;
  onToggleSubtasks?: () => void;
};

type TaskListItemGroupProps = TaskListItemProps & {
  subtasks?: TaskItem[];
};

function dueDateLabel(dueDate: string) {
  const date = new Date(dueDate);
  if (isToday(date)) return "Today";
  if (isPast(date)) return format(date, "MMM d");
  return format(date, "MMM d");
}

function HighlightedTitle({ title, query }: { title: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{title}</>;

  const lower = title.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return <>{title}</>;

  return (
    <>
      {title.slice(0, idx)}
      <mark className="rounded bg-brand/20 px-0.5 text-foreground">{title.slice(idx, idx + q.length)}</mark>
      {title.slice(idx + q.length)}
    </>
  );
}

export function TaskListItemRow({
  task,
  searchQuery = "",
  isSubtask = false,
  nestedInFolder = false,
  showBorder = true,
  onToggleComplete,
  onStatusChange,
  onEdit,
  onAddSubtask,
  onOpenTask,
  subtaskCount = 0,
  subtasksExpanded = false,
  onToggleSubtasks,
}: TaskListItemProps) {
  const isDone = task.status === "done";
  const overdue = task.due_date && !isDone && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
  const isSearchMatch = taskTitleMatchesSearch(task.title, searchQuery);
  const hasSubtasks = subtaskCount > 0;
  const subtaskToggleLabel = subtasksExpanded
    ? "Hide subtasks"
    : subtaskCount === 1
      ? "See subtask"
      : `See ${subtaskCount} subtasks`;

  const titleClass = isSubtask ? tasksSubListTitle : tasksListTitle;

  return (
    <div
      className={cn(
        "group grid min-h-[40px] grid-cols-[1rem_1fr] items-center gap-x-3 py-2 sm:grid-cols-[1rem_1fr_20rem]",
        showBorder && cn("border-b", tasksListDivider),
        isSubtask ? "pl-14 pr-5 sm:pl-16" : nestedInFolder ? "pr-5" : "px-5",
        tasksRowHover,
        isSearchMatch && "bg-surface/40",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(task)}
        className="group/check grid size-4 shrink-0 place-items-center text-muted-foreground/50 transition-colors duration-150 hover:text-brand"
        aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
      >
        {isDone ? (
          <CheckCircle2 className={cn(tasksIconSm, "text-brand")} strokeWidth={dsIconStroke} />
        ) : (
          <span className="size-3.5 rounded-full border border-muted-foreground/40 transition-all duration-150 group-hover/check:border-brand group-hover/check:bg-brand/5" />
        )}
      </button>

      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          {onOpenTask ? (
            <button
              type="button"
              onClick={() => onOpenTask(task.id)}
              className={cn(
                "block w-full min-w-0 truncate text-left",
                tasksTitleInteractive,
                titleClass,
                isDone && "text-muted-foreground/70 line-through",
              )}
            >
              <HighlightedTitle title={task.title} query={searchQuery} />
            </button>
          ) : (
            <Link
              to={`/tasks/${task.id}`}
              className={cn(
                "block w-full min-w-0 truncate text-left",
                tasksTitleInteractive,
                titleClass,
                isDone && "text-muted-foreground/70 line-through",
              )}
            >
              <HighlightedTitle title={task.title} query={searchQuery} />
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {onAddSubtask && (
            <button
              type="button"
              onClick={() => onAddSubtask(task)}
              className="grid size-6 cursor-pointer place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:bg-surface/80 hover:text-brand"
              aria-label={`Add subtask to ${task.title}`}
              title="Add subtask"
            >
              <ListPlus className={tasksIconSm} strokeWidth={dsIconStroke} />
            </button>
          )}

          {!isSubtask && hasSubtasks && onToggleSubtasks && (
            <button
              type="button"
              onClick={onToggleSubtasks}
              className="grid size-6 cursor-pointer place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:bg-surface/80 hover:text-brand"
              aria-expanded={subtasksExpanded}
              aria-label={subtaskToggleLabel}
              title={subtaskToggleLabel}
            >
              <ChevronDown className={collapseChevronClass(subtasksExpanded, tasksIconSm)} strokeWidth={dsIconStroke} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="grid size-6 cursor-pointer place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:bg-surface/80 hover:text-foreground"
            aria-label={`Edit ${task.title}`}
          >
            <Pencil className={tasksIconSm} strokeWidth={dsIconStroke} />
          </button>
        </div>
      </div>

      <div className={META_ROW}>
        <div className={META_STATUS}>
          <TaskStatusPicker
            status={task.status}
            onChange={(status) => onStatusChange(task, status)}
            className={tasksStatusPill}
          />
        </div>

        <div className={cn(META_ASSIGNEE, tasksSecondary)}>
          {task.profiles ? (
            <>
              <ProfileAvatar
                userId={task.assignee_id!}
                name={task.profiles.full_name}
                avatarUrl={task.profiles.avatar_url}
                email={task.profiles.email}
                size="xs"
              />
              <span className="min-w-0 truncate">{task.profiles.full_name}</span>
            </>
          ) : (
            <span className="inline-flex min-w-0 items-center gap-1">
              <User className={cn(tasksIconSm, "shrink-0 opacity-50")} strokeWidth={dsIconStroke} />
              —
            </span>
          )}
        </div>

        <div
          className={cn(
            META_DUE,
            "whitespace-nowrap",
            tasksMuted,
            overdue && "text-danger/75",
          )}
        >
          <Calendar className={cn(tasksIconSm, "shrink-0 opacity-50")} strokeWidth={dsIconStroke} />
          <span className="truncate">{task.due_date ? dueDateLabel(task.due_date) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

export function TaskListItemGroup({
  task,
  subtasks = [],
  searchQuery = "",
  nestedInFolder = false,
  onToggleComplete,
  onStatusChange,
  onEdit,
  onAddSubtask,
  onOpenTask,
}: TaskListItemGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const isSearching = Boolean(searchQuery.trim());
  const visibleSubtasks = isSearching ? filterSubtasksForSearch(subtasks, searchQuery) : subtasks;
  const hasSubtasks = isSearching ? visibleSubtasks.length > 0 : subtasks.length > 0;
  const subtaskCount = isSearching ? visibleSubtasks.length : subtasks.length;

  useEffect(() => {
    if (isSearching && visibleSubtasks.length > 0) setExpanded(true);
  }, [isSearching, visibleSubtasks.length, searchQuery]);

  return (
    <div>
      <TaskListItemRow
        task={task}
        searchQuery={searchQuery}
        nestedInFolder={nestedInFolder}
        showBorder={!hasSubtasks}
        onToggleComplete={onToggleComplete}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onAddSubtask={onAddSubtask}
        onOpenTask={onOpenTask}
        subtaskCount={subtaskCount}
        subtasksExpanded={expanded}
        onToggleSubtasks={hasSubtasks ? () => setExpanded((v) => !v) : undefined}
      />

      <AnimatedCollapse open={expanded && hasSubtasks} contentClassName="pb-1">
        {visibleSubtasks.map((sub, index) => (
          <TaskListItemRow
            key={sub.id}
            task={sub}
            isSubtask
            nestedInFolder={nestedInFolder}
            searchQuery={searchQuery}
            showBorder={index < visibleSubtasks.length - 1}
            onToggleComplete={onToggleComplete}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onOpenTask={onOpenTask}
          />
        ))}
      </AnimatedCollapse>
    </div>
  );
}
