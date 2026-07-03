import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { FolderKanban, FolderPlus, Plus } from "lucide-react";
import { CreateProjectFolderModal } from "@/components/projects/create-project-folder-modal";
import { DetailCard } from "@/components/projects/details/detail-card";
import { TaskStatusBadge } from "@/components/projects/details/task-status-badge";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { buildProjectFolders, tasksInFolder } from "@/lib/projects/folders";
import { countOpenTasks } from "@/lib/projects/task-status";
import type { ProjectMilestone, ProjectTask } from "@/lib/projects/types";

type ProjectDetailsTasksProps = {
  projectId: string;
  orgId: string;
  userId: string;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  onChange: () => void;
};

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

  const openCount = countOpenTasks(tasks);
  const folders = buildProjectFolders(milestones, tasks);
  const hasRealFolders = milestones.length > 0;

  function openAddTask(folderId: string | null) {
    setActiveFolderId(folderId);
    setShowTaskModal(true);
  }

  return (
    <>
      <DetailCard
        title="Folders & Tasks"
        action={
          <button
            type="button"
            onClick={() => setShowFolderModal(true)}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-brand-foreground transition-all hover:brightness-110"
          >
            <FolderPlus className="size-3" /> New folder
          </button>
        }
      >
        <p className="mb-4 text-xs text-muted-foreground">
          {tasks.length} total · {openCount} open
          {!hasRealFolders && " · create folders to organize tasks"}
        </p>

        <div className="space-y-4">
          {folders.map((folder) => {
            const folderTasks = tasksInFolder(tasks, folder.id);

            return (
              <div key={folder.id ?? "default"} className="overflow-hidden rounded-lg border border-border">
                <div className="flex items-center justify-between gap-2 border-b border-border bg-surface/50 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FolderKanban className="size-4 shrink-0 text-brand" />
                    <h3 className="truncate text-sm font-semibold text-foreground">{folder.title}</h3>
                    <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {folderTasks.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddTask(folder.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground hover:brightness-110"
                  >
                    <Plus className="size-3" /> Add task
                  </button>
                </div>

                <div className="divide-y divide-border bg-background">
                  {folderTasks.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground">No tasks in this folder yet.</p>
                      <button
                        type="button"
                        onClick={() => openAddTask(folder.id)}
                        className="mt-2 text-xs font-medium text-brand hover:text-brand/80"
                      >
                        Add a task
                      </button>
                    </div>
                  ) : (
                    folderTasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/tasks/${task.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface/50"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {task.title}
                        </span>
                        <TaskStatusBadge status={task.status} />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DetailCard>

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
