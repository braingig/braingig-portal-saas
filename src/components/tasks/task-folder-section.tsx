import { ChevronDown, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedCollapse, collapseChevronClass } from "@/components/ui/animated-collapse";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickTaskAddRow } from "@/components/tasks/quick-task-add-row";
import { TaskListItemGroup } from "@/components/tasks/task-list-item";
import { previewTitleField } from "@/components/tasks/preview/task-preview-styles";
import {
  tasksCollapseBtn,
  tasksDropdown,
  tasksFolderBadge,
  tasksFolderBody,
  tasksFolderHeader,
  tasksFolderIconBtn,
  tasksFolderTitle,
  tasksIconSm,
  tasksMenuItem,
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
  onDelete?: (task: TaskListItem) => void;
  onDeleteFolder?: (folder: ProjectFolderView, taskCount: number) => void;
  hasDeleteRole?: (...roles: import("@/lib/users/permissions").AppRole[]) => boolean;
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
  onDelete,
  onDeleteFolder,
  hasDeleteRole,
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
          className={cn("min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-left", tasksFolderTitle, previewTitleField)}
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

        {onDeleteFolder && hasDeleteRole?.("owner", "admin") && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={tasksFolderIconBtn}
                aria-label={`Folder options for ${folder.title}`}
              >
                <MoreHorizontal className={tasksIconSm} strokeWidth={dsIconStroke} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={tasksDropdown}>
              <DropdownMenuItem
                className={cn(tasksMenuItem, "text-danger focus:text-danger")}
                onClick={() => onDeleteFolder(folder, folderTasks.length)}
              >
                <Trash2 className="size-3.5" strokeWidth={dsIconStroke} />
                Delete folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
              onDelete={onDelete}
              userId={userId}
              hasDeleteRole={hasDeleteRole}
              onOpenTask={onOpenTask}
              quickAdd={{ orgId, userId, members, onCreated: onTaskCreated }}
            />
          ))
        )}
      </AnimatedCollapse>
    </div>
  );
}
