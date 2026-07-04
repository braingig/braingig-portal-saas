import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedCollapse, collapseChevronClass } from "@/components/ui/animated-collapse";
import { QuickTaskAddRow } from "@/components/tasks/quick-task-add-row";
import { TaskListItemGroup } from "@/components/tasks/task-list-item";
import {
  tasksCollapseBtn,
  tasksDropdown,
  tasksFolderBadge,
  tasksFolderBody,
  tasksFolderHeader,
  tasksFolderIconBtn,
  tasksFolderTitle,
  tasksIconSm,
  tasksMeta,
  tasksRowHover,
} from "@/components/tasks/tasks-page-styles";
import { dsIconStroke } from "@/lib/design-system";
import { tasksInFolder } from "@/lib/projects/folders";
import { groupHasSearchMatch } from "@/lib/tasks/search";
import type { ProjectFolderView } from "@/lib/projects/folders";
import type { TaskListItem, TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskFolderSectionProps = {
  folder: ProjectFolderView;
  tasks: TaskListItem[];
  subtasksByParent: Map<string, TaskListItem[]>;
  searchQuery?: string;
  projectId: string;
  orgId: string;
  userId: string;
  members: TaskOrgMember[];
  onTaskCreated: () => void;
  onToggleComplete: (task: TaskListItem) => void;
  onStatusChange: (task: TaskListItem, status: string) => void;
  onEdit: (task: TaskListItem) => void;
  onOpenTask?: (taskId: string) => void;
  defaultExpanded?: boolean;
};

export function TaskFolderSection({
  folder,
  tasks,
  subtasksByParent,
  searchQuery,
  projectId,
  orgId,
  userId,
  members,
  onTaskCreated,
  onToggleComplete,
  onStatusChange,
  onEdit,
  onOpenTask,
  defaultExpanded = false,
}: TaskFolderSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const folderTasks = useMemo(() => tasksInFolder(tasks, folder.id), [tasks, folder.id]);
  const isSearching = Boolean(searchQuery?.trim());
  const folderHasMatch = useMemo(
    () => groupHasSearchMatch(folderTasks, subtasksByParent, searchQuery ?? ""),
    [folderTasks, subtasksByParent, searchQuery],
  );

  useEffect(() => {
    if (isSearching && folderHasMatch) setExpanded(true);
  }, [isSearching, folderHasMatch, searchQuery]);

  return (
    <div>
      <div className={cn(tasksFolderHeader, tasksRowHover)}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={tasksCollapseBtn}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse folder" : "Expand folder"}
        >
          <ChevronDown className={collapseChevronClass(expanded, tasksIconSm)} strokeWidth={dsIconStroke} />
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn("min-w-0 flex-1 truncate text-left", tasksFolderTitle, "transition-colors duration-150 hover:text-muted-foreground")}
        >
          {folder.title}
        </button>

        <span className={tasksFolderBadge}>({folderTasks.length})</span>

        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            setQuickAddOpen(true);
          }}
          className={tasksFolderIconBtn}
          aria-label="Add task"
          title="Add task"
        >
          <Plus className={tasksIconSm} strokeWidth={dsIconStroke} />
        </button>
      </div>

      <AnimatedCollapse open={expanded} contentClassName={tasksFolderBody}>
        {quickAddOpen && (
          <QuickTaskAddRow
            orgId={orgId}
            userId={userId}
            members={members}
            projectId={projectId}
            milestoneId={folder.id}
            position={folderTasks.length}
            nestedInFolder
            onSuccess={() => {
              setQuickAddOpen(false);
              onTaskCreated();
            }}
            onCancel={() => setQuickAddOpen(false)}
          />
        )}

        {folderTasks.length === 0 && !quickAddOpen ? (
          <div className="flex items-center gap-2 px-4 py-3">
            <p className={tasksMeta}>No tasks yet</p>
            <span className={tasksMeta}>·</span>
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className={cn(tasksMeta, "transition-colors duration-150 hover:text-foreground")}
            >
              Add task
            </button>
          </div>
        ) : (
          folderTasks.map((task) => (
            <TaskListItemGroup
              key={task.id}
              task={task}
              subtasks={subtasksByParent.get(task.id) ?? []}
              searchQuery={searchQuery}
              nestedInFolder
              onToggleComplete={onToggleComplete}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onOpenTask={onOpenTask}
              quickAdd={{ orgId, userId, members, onCreated: onTaskCreated }}
            />
          ))
        )}
      </AnimatedCollapse>
    </div>
  );
}
