import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, FolderKanban, FolderPlus, Layers, Plus } from "lucide-react";
import { CreateProjectFolderModal } from "@/components/projects/create-project-folder-modal";
import { CollapsibleDetailCard } from "@/components/projects/details/collapsible-detail-card";
import { DetailCard } from "@/components/projects/details/detail-card";
import { TaskStatusBadge } from "@/components/projects/details/task-status-badge";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { buildProjectFolders, tasksInFolder } from "@/lib/projects/folders";
import { countDoneTasks, countOpenTasks } from "@/lib/projects/task-status";
import type { ProjectMilestone, ProjectTask } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

const FOLDER_PREVIEW_LIMIT = 4;
const FOLDER_SCROLL_AFTER = 6;

type ProjectDetailsTasksProps = {
  projectId: string;
  orgId: string;
  userId: string;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  onChange: () => void;
};

function TaskProgress({ tasks }: { tasks: ProjectTask[] }) {
  const doneCount = countDoneTasks(tasks);
  const total = tasks.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{doneCount}</span>
          {" "}of{" "}
          <span className="font-medium text-foreground">{total}</span>
          {" "}tasks complete ·{" "}
          <span className="font-medium text-foreground">{countOpenTasks(tasks)}</span>
          {" "}open
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

function FolderTaskList({
  folderTasks,
  onAddTask,
}: {
  folderTasks: ProjectTask[];
  onAddTask: () => void;
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
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">No tasks in this folder yet.</p>
        <button
          type="button"
          onClick={onAddTask}
          className="mt-2 text-xs font-medium text-brand hover:text-brand/80"
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
        <div className="divide-y divide-border/30">
          {visibleTasks.map((task) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface/50"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {task.title}
              </span>
              <TaskStatusBadge status={task.status} />
            </Link>
          ))}
        </div>
        {useScroll && (
          <div
            aria-hidden
            className="pointer-events-none sticky bottom-0 h-6 bg-gradient-to-t from-background to-transparent"
          />
        )}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="flex w-full items-center justify-center gap-1 border-t border-border/30 py-2 text-xs font-medium text-brand transition-colors hover:text-brand/80"
        >
          <ChevronDown className={cn("size-3.5 transition-transform", showAll && "rotate-180")} />
          {showAll
            ? "Show fewer tasks"
            : `Show all ${folderTasks.length} tasks (${hiddenCount} more)`}
        </button>
      )}
    </div>
  );
}

export function ProjectDetailsTasks({
  projectId,
  orgId,
  userId,
  tasks,
  milestones,
  onChange,
}: ProjectDetailsTasksProps) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const folders = useMemo(() => buildProjectFolders(milestones, tasks), [milestones, tasks]);
  const hasRealFolders = milestones.length > 0;

  function openAddTask(folderId: string | null) {
    setActiveFolderId(folderId);
    setShowTaskModal(true);
  }

  const newFolderButton = (
    <button
      type="button"
      onClick={() => setShowFolderModal(true)}
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-surface"
    >
      <FolderPlus className="size-3.5" />
      New folder
    </button>
  );

  const body = (
    <>
      {tasks.length > 0 && <TaskProgress tasks={tasks} />}

      <div className="space-y-3">
        {folders.map((folder) => {
          const folderTasks = tasksInFolder(tasks, folder.id);

          return (
            <div key={folder.id ?? "default"} className="overflow-hidden rounded-lg border border-border bg-surface/20">
              <div className="flex items-center justify-between gap-2 border-b border-border/40 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FolderKanban className="size-4 shrink-0 text-brand" />
                  <h3 className="truncate text-sm font-medium text-foreground">{folder.title}</h3>
                  <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {folderTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openAddTask(folder.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand px-2 py-1 text-[10px] font-semibold text-brand-foreground hover:brightness-110"
                >
                  <Plus className="size-3" />
                  Add task
                </button>
              </div>

              <FolderTaskList folderTasks={folderTasks} onAddTask={() => openAddTask(folder.id)} />
            </div>
          );
        })}
      </div>

      {!hasRealFolders && tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Create folders to organize tasks, or add tasks directly to this project.
        </p>
      )}
    </>
  );

  return (
    <>
      {tasks.length === 0 ? (
        <DetailCard
          title="Folders & Tasks"
          action={newFolderButton}
        >
          <p className="mb-4 text-sm text-muted-foreground">No tasks yet.</p>
          <button
            type="button"
            onClick={() => openAddTask(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:brightness-110"
          >
            <Plus className="size-3.5" />
            Add first task
          </button>
        </DetailCard>
      ) : (
        <CollapsibleDetailCard
          title="Folders & Tasks"
          icon={Layers}
          count={tasks.length}
          hint={`View ${tasks.length} task${tasks.length === 1 ? "" : "s"} across ${folders.length} folder${folders.length === 1 ? "" : "s"}`}
          action={newFolderButton}
          defaultOpen={tasks.length <= 3}
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
    </>
  );
}
