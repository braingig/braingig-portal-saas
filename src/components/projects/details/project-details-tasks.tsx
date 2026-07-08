import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, FolderKanban, FolderPlus, Layers, Plus } from "lucide-react";
import { CreateProjectFolderModal } from "@/components/projects/create-project-folder-modal";
import type { ProjectSubtask } from "@/lib/projects/types";
import { CollapsibleDetailCard } from "@/components/projects/details/collapsible-detail-card";
import { DetailCard } from "@/components/projects/details/detail-card";
import { TaskStatusBadge } from "@/components/projects/details/task-status-badge";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { TaskPreviewModal } from "@/components/tasks/preview/task-preview-modal";
import { AnimatedCollapse } from "@/components/ui/animated-collapse";
import { buildProjectFolders, tasksInFolder } from "@/lib/projects/folders";
import { countDoneTasks, countOpenTasks } from "@/lib/projects/task-status";
import type { ProjectMilestone, ProjectTask } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import {
  projectCountBadge,
  projectMeta,
  projectMuted,
  projectSectionTitle,
  projectSubtaskTitle,
  projectTaskTitle,
} from "@/components/projects/details/project-details-styles";

const FOLDER_PREVIEW_LIMIT = 4;
const FOLDER_SCROLL_AFTER = 6;

type ProjectDetailsTasksProps = {
  projectId: string;
  orgId: string;
  userId: string;
  tasks: ProjectTask[];
  subtasksByParent: Map<string, ProjectSubtask[]>;
  milestones: ProjectMilestone[];
  onChange: () => void;
};

function TaskProgress({ tasks }: { tasks: ProjectTask[] }) {
  const doneCount = countDoneTasks(tasks);
  const total = tasks.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="mb-5 flex items-center gap-4">
      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={cn("shrink-0 tabular-nums", projectMeta)}>
        {doneCount}/{total} done · {countOpenTasks(tasks)} open
      </span>
    </div>
  );
}

function TaskRow({
  task,
  subtasks,
  onOpenTask,
}: {
  task: ProjectTask;
  subtasks: ProjectSubtask[];
  onOpenTask: (taskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = subtasks.length > 0;

  return (
    <li>
      <div className="flex items-center gap-1">
        {hasSubtasks ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide subtasks" : `Show ${subtasks.length} subtasks`}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-300 ease-in-out",
                expanded && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          onClick={() => onOpenTask(task.id)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
        >
          <span className={cn("min-w-0 flex-1 truncate", projectTaskTitle)}>
            {task.title}
          </span>
          <TaskStatusBadge status={task.status} />
        </button>
      </div>

      {hasSubtasks && (
        <AnimatedCollapse open={expanded} contentClassName="min-h-0">
          <ul className="ml-7 space-y-0.5 border-l border-border/40 pl-2">
            {subtasks.map((subtask) => (
              <li key={subtask.id}>
                <button
                  type="button"
                  onClick={() => onOpenTask(subtask.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span className={cn("min-w-0 flex-1 truncate", projectSubtaskTitle)}>
                    {subtask.title}
                  </span>
                  <TaskStatusBadge status={subtask.status} />
                </button>
              </li>
            ))}
          </ul>
        </AnimatedCollapse>
      )}
    </li>
  );
}

function FolderTaskList({
  folderTasks,
  subtasksByParent,
  onAddTask,
  onOpenTask,
}: {
  folderTasks: ProjectTask[];
  subtasksByParent: Map<string, ProjectSubtask[]>;
  onAddTask: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const canExpand = folderTasks.length > FOLDER_PREVIEW_LIMIT;
  const visibleTasks = showAll || !canExpand
    ? folderTasks
    : folderTasks.slice(0, FOLDER_PREVIEW_LIMIT);
  const hiddenCount = folderTasks.length - FOLDER_PREVIEW_LIMIT;
  const useScroll = showAll && folderTasks.length > FOLDER_SCROLL_AFTER;

  if (folderTasks.length === 0) {
    return (
      <div className="px-1 py-5 text-center">
        <p className={projectMuted}>No tasks yet.</p>
        <button
          type="button"
          onClick={onAddTask}
          className="mt-2 text-[11px] font-medium text-brand hover:text-brand/80"
        >
          Add a task
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "relative",
          useScroll && "max-h-[min(40vh,320px)] overflow-y-auto overscroll-contain",
        )}
      >
        <ul className="space-y-0.5">
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              subtasks={subtasksByParent.get(task.id) ?? []}
              onOpenTask={onOpenTask}
            />
          ))}
        </ul>
        {useScroll && (
          <div
            aria-hidden
            className="pointer-events-none sticky bottom-0 h-6 bg-gradient-to-t from-card to-transparent"
          />
        )}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <ChevronDown className={cn("size-3.5 transition-transform", showAll && "rotate-180")} />
          {showAll
            ? "Show fewer"
            : `Show ${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}

function FolderGroup({
  title,
  icon: Icon,
  count,
  onAddTask,
  children,
  defaultOpen = false,
}: {
  title?: string;
  icon?: typeof FolderKanban;
  count: number;
  onAddTask: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border/40">
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-expanded={open}
        >
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-300 ease-in-out",
              open && "rotate-90",
            )}
          />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          {title ? (
            <h3 className={cn("truncate", projectSectionTitle)}>{title}</h3>
          ) : (
            <h3 className={projectSectionTitle}>Unfiled</h3>
          )}
          <span className={projectCountBadge}>{count}</span>
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>

      <AnimatedCollapse open={open} contentClassName="min-h-0">
        <div className="border-t border-border/30 px-2 pb-2 pt-1">{children}</div>
      </AnimatedCollapse>
    </div>
  );
}

export function ProjectDetailsTasks({
  projectId,
  orgId,
  userId,
  tasks,
  subtasksByParent,
  milestones,
  onChange,
}: ProjectDetailsTasksProps) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const milestoneFolders = useMemo(() => buildProjectFolders(milestones), [milestones]);
  const unfiledTasks = useMemo(() => tasksInFolder(tasks, null), [tasks]);
  const hasRealFolders = milestones.length > 0;

  function openAddTask(folderId: string | null) {
    setActiveFolderId(folderId);
    setShowTaskModal(true);
  }

  const newFolderButton = (
    <button
      type="button"
      onClick={() => setShowFolderModal(true)}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      <FolderPlus className="size-3.5" />
      New folder
    </button>
  );

  const body = (
    <>
      {tasks.length > 0 && <TaskProgress tasks={tasks} />}

      <div className="space-y-3">
        {unfiledTasks.length > 0 && (
          <FolderGroup
            count={unfiledTasks.length}
            onAddTask={() => openAddTask(null)}
          >
            <FolderTaskList
              folderTasks={unfiledTasks}
              subtasksByParent={subtasksByParent}
              onAddTask={() => openAddTask(null)}
              onOpenTask={setPreviewTaskId}
            />
          </FolderGroup>
        )}

        {milestoneFolders.map((folder) => {
          const folderTasks = tasksInFolder(tasks, folder.id);

          return (
            <FolderGroup
              key={folder.id}
              title={folder.title}
              icon={FolderKanban}
              count={folderTasks.length}
              onAddTask={() => openAddTask(folder.id)}
            >
              <FolderTaskList
                folderTasks={folderTasks}
                subtasksByParent={subtasksByParent}
                onAddTask={() => openAddTask(folder.id)}
                onOpenTask={setPreviewTaskId}
              />
            </FolderGroup>
          );
        })}
      </div>

      {!hasRealFolders && tasks.length === 0 && (
        <p className={projectMuted}>
          Create folders to organize tasks, or add tasks directly to this project.
        </p>
      )}
    </>
  );

  return (
    <>
      {tasks.length === 0 ? (
        <DetailCard title="Tasks" action={newFolderButton}>
          <p className={cn("mb-4", projectMuted)}>No tasks yet.</p>
          <button
            type="button"
            onClick={() => openAddTask(null)}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:brightness-110"
          >
            <Plus className="size-3.5" />
            Add first task
          </button>
        </DetailCard>
      ) : (
        <CollapsibleDetailCard
          title="Tasks"
          icon={Layers}
          count={tasks.length}
          hint={
            milestoneFolders.length > 0
              ? `${tasks.length} tasks across ${milestoneFolders.length} folders`
              : `${tasks.length} tasks in this project`
          }
          action={newFolderButton}
          defaultOpen
        >
          {body}
        </CollapsibleDetailCard>
      )}

      <CreateProjectFolderModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        projectId={projectId}
        orgId={orgId}
        userId={userId}
        folderCount={milestones.length}
        onSuccess={onChange}
      />

      <CreateTaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        orgId={orgId}
        userId={userId}
        defaultProjectId={projectId}
        defaultMilestoneId={activeFolderId ?? undefined}
        onSuccess={onChange}
      />

      <TaskPreviewModal
        taskId={previewTaskId}
        open={Boolean(previewTaskId)}
        onOpenChange={(open) => { if (!open) setPreviewTaskId(null); }}
        onTaskChange={setPreviewTaskId}
        onUpdated={onChange}
      />
    </>
  );
}
