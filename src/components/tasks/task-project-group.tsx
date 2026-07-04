import { Link } from "@tanstack/react-router";
import { ChevronDown, FolderPlus, MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedCollapse, collapseChevronClass } from "@/components/ui/animated-collapse";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickTaskAddRow } from "@/components/tasks/quick-task-add-row";
import { TaskFolderSection } from "@/components/tasks/task-folder-section";
import { TaskListItemGroup } from "@/components/tasks/task-list-item";
import { previewInteractiveHover } from "@/components/tasks/preview/task-preview-styles";
import {
  tasksCollapseBtn,
  tasksDropdown,
  tasksIconBtn,
  tasksIconMd,
  tasksMenuItem,
  tasksFolderBody,
  tasksMeta,
  tasksProjectBody,
  tasksProjectHeader,
  tasksProjectSummary,
  tasksProjectTitle,
  tasksSectionShell,
} from "@/components/tasks/tasks-page-styles";
import { dsIconStroke } from "@/lib/design-system";
import { buildProjectFolders, tasksInFolder } from "@/lib/projects/folders";
import { groupHasSearchMatch, groupSearchMatchRank, taskOrSubtasksMatchSearch } from "@/lib/tasks/search";
import { countDoneTasks, countOpenTasks } from "@/lib/tasks/status";
import type { TaskListItem, TaskMilestone, TaskOrgMember, TaskProjectGroup as ProjectGroup } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskProjectGroupProps = {
  group: ProjectGroup;
  milestones: TaskMilestone[];
  subtasksByParent: Map<string, TaskListItem[]>;
  searchQuery?: string;
  orgId: string;
  userId: string;
  members: TaskOrgMember[];
  onTaskCreated: () => void;
  onCreateFolder: (projectId: string) => void;
  onToggleComplete: (task: TaskListItem) => void;
  onStatusChange: (task: TaskListItem, status: string) => void;
  onEdit: (task: TaskListItem) => void;
  onDelete?: (task: TaskListItem) => void;
  onDeleteFolder?: (folderId: string, folderTitle: string, taskCount: number) => void;
  hasDeleteRole?: (...roles: import("@/lib/users/permissions").AppRole[]) => boolean;
  onOpenTask?: (taskId: string) => void;
  defaultExpanded?: boolean;
};

export function TaskProjectGroup({
  group,
  milestones,
  subtasksByParent,
  searchQuery,
  orgId,
  userId,
  members,
  onTaskCreated,
  onCreateFolder,
  onToggleComplete,
  onStatusChange,
  onEdit,
  onDelete,
  onDeleteFolder,
  hasDeleteRole,
  onOpenTask,
  defaultExpanded = true,
}: TaskProjectGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const isSearching = Boolean(searchQuery?.trim());

  useEffect(() => {
    if (isSearching) setExpanded(true);
  }, [isSearching, searchQuery]);

  const openCount = countOpenTasks(group.tasks);
  const doneCount = countDoneTasks(group.tasks);
  const total = group.tasks.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const projectMilestones = milestones.filter((m) => m.project_id === group.id);
  const folderCount = projectMilestones.length;
  const milestoneFolders = group.isStandalone ? [] : buildProjectFolders(projectMilestones);

  const unfiledTasks = useMemo(() => {
    const unfiled = tasksInFolder(group.tasks, null);
    if (!isSearching) return unfiled;
    return unfiled.filter((t) => taskOrSubtasksMatchSearch(t, subtasksByParent.get(t.id), searchQuery!));
  }, [group.tasks, isSearching, searchQuery, subtasksByParent]);

  const visibleFolders = useMemo(() => {
    if (!isSearching) return milestoneFolders;
    return [...milestoneFolders]
      .filter((folder) => groupHasSearchMatch(tasksInFolder(group.tasks, folder.id), subtasksByParent, searchQuery!))
      .sort(
        (a, b) =>
          groupSearchMatchRank(tasksInFolder(group.tasks, a.id), subtasksByParent, searchQuery!) -
          groupSearchMatchRank(tasksInFolder(group.tasks, b.id), subtasksByParent, searchQuery!),
      );
  }, [milestoneFolders, group.tasks, isSearching, searchQuery, subtasksByParent]);

  const summaryParts = group.isStandalone
    ? [`${openCount} Open`, `${doneCount} Done`]
    : [`${openCount} Open`, `${doneCount} Done`, `${folderCount} ${folderCount === 1 ? "Folder" : "Folders"}`];

  return (
    <section className={tasksSectionShell}>
      <header className={tasksProjectHeader}>
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={tasksCollapseBtn}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse project" : "Expand project"}
          >
            <ChevronDown className={collapseChevronClass(expanded, tasksIconMd)} strokeWidth={dsIconStroke} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {group.isStandalone ? (
                <h2 className={cn("truncate", tasksProjectTitle)}>{group.name}</h2>
              ) : (
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: group.id }}
                  className={cn("truncate text-foreground transition-colors duration-150 hover:text-brand", tasksProjectTitle)}
                >
                  {group.name}
                </Link>
              )}
            </div>

            <p className={cn("mt-2 flex flex-wrap gap-x-2 gap-y-0", tasksProjectSummary)}>
              {summaryParts.map((part, index) => (
                <span key={part} className="whitespace-nowrap">
                  {index > 0 && <span className="mr-2 text-muted-foreground/30">•</span>}
                  {part}
                </span>
              ))}
              {total > 0 && (
                <>
                  <span className="mr-2 text-muted-foreground/30">•</span>
                  <span className="whitespace-nowrap">{progress}% done</span>
                </>
              )}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={tasksIconBtn} aria-label="Project actions">
                <MoreHorizontal className={tasksIconMd} strokeWidth={dsIconStroke} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={tasksDropdown}>
              {!group.isStandalone && (
                <DropdownMenuItem className={tasksMenuItem} onClick={() => onCreateFolder(group.id)}>
                  <FolderPlus className={tasksIconMd} strokeWidth={dsIconStroke} /> New folder
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className={tasksMenuItem}
                onClick={() => {
                  setExpanded(true);
                  setQuickAddOpen(true);
                }}
              >
                <Plus className={tasksIconMd} strokeWidth={dsIconStroke} /> Add task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AnimatedCollapse open={expanded} contentClassName={cn(tasksProjectBody, "divide-y divide-border/20")}>
        {group.isStandalone ? (
          <>
            {quickAddOpen && (
              <QuickTaskAddRow
                orgId={orgId}
                userId={userId}
                members={members}
                position={group.tasks.length}
                onSuccess={() => {
                  setQuickAddOpen(false);
                  onTaskCreated();
                }}
                onCancel={() => setQuickAddOpen(false)}
              />
            )}

            {group.tasks.length === 0 && !quickAddOpen ? (
              <EmptyProjectTasks onAdd={() => setQuickAddOpen(true)} standalone />
            ) : (
              group.tasks.map((task) => (
                <TaskListItemGroup
                  key={task.id}
                  task={task}
                  subtasks={subtasksByParent.get(task.id) ?? []}
                  searchQuery={searchQuery}
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
          </>
        ) : (
          <>
            {(quickAddOpen || unfiledTasks.length > 0) && (
              <div className={tasksFolderBody}>
                {quickAddOpen && (
                  <QuickTaskAddRow
                    orgId={orgId}
                    userId={userId}
                    members={members}
                    projectId={group.id}
                    position={group.tasks.length}
                    nestedInFolder
                    onSuccess={() => {
                      setQuickAddOpen(false);
                      onTaskCreated();
                    }}
                    onCancel={() => setQuickAddOpen(false)}
                  />
                )}
                {unfiledTasks.map((task) => (
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
                ))}
              </div>
            )}

            {visibleFolders.map((folder, index) => (
              <TaskFolderSection
                key={folder.id}
                folder={folder}
                tasks={group.tasks}
                subtasksByParent={subtasksByParent}
                searchQuery={searchQuery}
                projectId={group.id}
                orgId={orgId}
                userId={userId}
                members={members}
                onTaskCreated={onTaskCreated}
                onToggleComplete={onToggleComplete}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                userId={userId}
                hasDeleteRole={hasDeleteRole}
                onDeleteFolder={
                  onDeleteFolder
                    ? (folder, taskCount) => onDeleteFolder(folder.id, folder.title, taskCount)
                    : undefined
                }
                onOpenTask={onOpenTask}
                defaultExpanded={isSearching || index === 0}
              />
            ))}

            {group.tasks.length === 0 && visibleFolders.length === 0 && !quickAddOpen && (
              <EmptyProjectTasks onAdd={() => setQuickAddOpen(true)} />
            )}
          </>
        )}
      </AnimatedCollapse>
    </section>
  );
}

function EmptyProjectTasks({
  standalone,
  onAdd,
}: {
  standalone?: boolean;
  onAdd?: () => void;
}) {
  return (
    <div className="px-4 py-5 text-center">
      <p className={tasksMeta}>
        {standalone ? "No standalone tasks yet" : "No tasks in this project yet"}
      </p>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={cn(tasksMeta, "mt-1.5 transition-colors hover:text-brand")}
        >
          Add a task
        </button>
      )}
    </div>
  );
}
