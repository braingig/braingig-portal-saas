import { format, isPast, isToday } from "date-fns";
import { Calendar, CheckCircle2, ChevronDown, ListPlus, Pencil, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatedCollapse, collapseChevronClass } from "@/components/ui/animated-collapse";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { QuickTaskAddRow } from "@/components/tasks/quick-task-add-row";
import { previewInteractiveHover } from "@/components/tasks/preview/task-preview-styles";
import { TaskStatusPicker } from "@/components/tasks/task-status-picker";
import {
  tasksIconSm,
  tasksListDivider,
  tasksListMetaField,
  tasksListTitle,
  tasksListTitleField,
  tasksMuted,
  tasksSecondary,
  tasksStatusPill,
  tasksSubListTitle,
  tasksTitleInteractive,
} from "@/components/tasks/tasks-page-styles";
import { dsIconStroke } from "@/lib/design-system";
import { filterSubtasksForSearch, taskTitleMatchesSearch } from "@/lib/tasks/search";
import type { TaskOrgMember } from "@/lib/tasks/types";
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
  onDelete?: (task: TaskItem) => void;
  onAddSubtask?: (task: TaskItem) => void;
  onOpenTask?: (taskId: string) => void;
  subtaskCount?: number;
  subtasksExpanded?: boolean;
  onToggleSubtasks?: () => void;
};

type TaskListItemGroupProps = TaskListItemProps & {
  subtasks?: TaskItem[];
  quickAdd?: {
    orgId: string;
    userId: string;
    members: TaskOrgMember[];
    onCreated: () => void;
  };
};

function dueDateLabel(dueDate: string) {
  const date = new Date(dueDate);
  if (isToday(date)) return "Today";
  if (isPast(date)) return format(date, "MMM d");
  return format(date, "MMM d");
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
  onDelete,
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
        "group grid min-h-[40px] grid-cols-[1rem_1fr] items-center gap-x-3 py-1 sm:grid-cols-[1rem_1fr_20rem]",
        showBorder && cn("border-b", tasksListDivider),
        isSubtask ? "pl-14 pr-5 sm:pl-16" : nestedInFolder ? "pr-5" : "px-5",
        isSearchMatch && "rounded-lg bg-surface/40",
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
        <div className={tasksListTitleField}>
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
              <HighlightedText text={task.title} query={searchQuery} />
            </button>
          ) : (
            <span
              className={cn(
                "block w-full min-w-0 truncate text-left",
                titleClass,
                isDone && "text-muted-foreground/70 line-through",
              )}
            >
              <HighlightedText text={task.title} query={searchQuery} />
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {onAddSubtask && (
            <button
              type="button"
              onClick={() => onAddSubtask(task)}
              className={cn(
                "grid size-6 cursor-pointer place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:text-brand",
                previewInteractiveHover,
              )}
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
              className={cn(
                "grid size-6 cursor-pointer place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:text-brand",
                previewInteractiveHover,
              )}
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
            className={cn(
              "grid size-6 cursor-pointer place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:text-foreground",
              previewInteractiveHover,
            )}
            aria-label={`Edit ${task.title}`}
          >
            <Pencil className={tasksIconSm} strokeWidth={dsIconStroke} />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className={cn(
                "grid size-6 cursor-pointer place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:text-danger",
                previewInteractiveHover,
              )}
              aria-label={`Delete ${task.title}`}
              title="Delete"
            >
              <Trash2 className={tasksIconSm} strokeWidth={dsIconStroke} />
            </button>
          )}
        </div>
      </div>

      <div className={META_ROW}>
        <div className={cn(META_STATUS, tasksListMetaField, "justify-center")}>
          <TaskStatusPicker
            status={task.status}
            onChange={(status) => onStatusChange(task, status)}
            className={tasksStatusPill}
          />
        </div>

        <div className={cn(META_ASSIGNEE, tasksSecondary, tasksListMetaField)}>
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
            tasksListMetaField,
            "justify-end",
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
  onDelete,
  onAddSubtask,
  onOpenTask,
  quickAdd,
}: TaskListItemGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const isSearching = Boolean(searchQuery.trim());
  const visibleSubtasks = isSearching ? filterSubtasksForSearch(subtasks, searchQuery) : subtasks;
  const hasSubtasks = isSearching ? visibleSubtasks.length > 0 : subtasks.length > 0;
  const subtaskCount = isSearching ? visibleSubtasks.length : subtasks.length;
  const useInlineQuickAdd = Boolean(quickAdd);

  useEffect(() => {
    if (isSearching && visibleSubtasks.length > 0) setExpanded(true);
  }, [isSearching, visibleSubtasks.length, searchQuery]);

  function handleAddSubtask() {
    if (useInlineQuickAdd) {
      setQuickAddOpen(true);
      setExpanded(true);
      return;
    }
    onAddSubtask?.(task);
  }

  return (
    <div>
      <TaskListItemRow
        task={task}
        searchQuery={searchQuery}
        nestedInFolder={nestedInFolder}
        showBorder={!hasSubtasks && !quickAddOpen}
        onToggleComplete={onToggleComplete}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddSubtask={onAddSubtask || useInlineQuickAdd ? handleAddSubtask : undefined}
        onOpenTask={onOpenTask}
        subtaskCount={subtaskCount}
        subtasksExpanded={expanded}
        onToggleSubtasks={hasSubtasks ? () => setExpanded((v) => !v) : undefined}
      />

      {quickAddOpen && quickAdd && (
        <QuickTaskAddRow
          orgId={quickAdd.orgId}
          userId={quickAdd.userId}
          members={quickAdd.members}
          projectId={task.project_id ?? undefined}
          milestoneId={task.milestone_id ?? undefined}
          parentTaskId={task.id}
          position={subtasks.length}
          isSubtask
          nestedInFolder={nestedInFolder}
          onSuccess={() => {
            setQuickAddOpen(false);
            quickAdd.onCreated();
          }}
          onCancel={() => setQuickAddOpen(false)}
        />
      )}

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
            onDelete={onDelete}
            onOpenTask={onOpenTask}
          />
        ))}
      </AnimatedCollapse>
    </div>
  );
}
