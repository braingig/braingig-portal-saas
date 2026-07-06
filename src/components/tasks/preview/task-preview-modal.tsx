import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDetailsActivePanel } from "@/components/tasks/details/task-details-active-panel";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskPreviewDetailsPanel } from "@/components/tasks/preview/task-preview-details-panel";
import { TaskPreviewTabsPanel } from "@/components/tasks/preview/task-preview-tabs-panel";
import { useTaskPreviewData } from "@/components/tasks/preview/use-task-preview-data";
import { hasOpenNestedOverlay, isPortaledOverlayTarget } from "@/components/tasks/preview/task-preview-dialog-guards";
import { TaskPreviewIconButton } from "@/components/tasks/preview/task-preview-icon-button";
import {
  previewBreadcrumb,
  previewSidebarScroll,
  previewSidebarShell,
  previewWorkspacePanel,
} from "@/components/tasks/preview/task-preview-styles";
import { useDeviceActivity } from "@/hooks/use-device-activity";
import { useRoles } from "@/hooks/use-role";
import { canDeleteTask, taskDeleteConfirmMessage } from "@/lib/tasks/delete-task";
import { fetchParentTaskSummary } from "@/lib/tasks/subtasks";
import type { TaskDetailRecord } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TaskPreviewModalProps = {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskChange?: (taskId: string) => void;
  onUpdated?: () => void;
};

export function TaskPreviewModal({
  taskId,
  open,
  onOpenChange,
  onTaskChange,
  onUpdated,
}: TaskPreviewModalProps) {
  const { hasAny } = useRoles();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [subtaskCreateTrigger, setSubtaskCreateTrigger] = useState(0);
  const [parentTask, setParentTask] = useState<Pick<TaskDetailRecord, "id" | "title"> | null>(null);

  const data = useTaskPreviewData(taskId, open, onUpdated);

  useDeviceActivity(data.task?.project_id || null, data.task?.id || null);

  useEffect(() => {
    if (!data.task?.parent_id) {
      setParentTask(null);
      return;
    }
    void fetchParentTaskSummary(data.task.parent_id).then((summary) => {
      setParentTask(summary ? { id: summary.id, title: summary.title } : null);
    });
  }, [data.task?.parent_id]);

  useEffect(() => {
    if (open) {
      setEditingTitle(false);
      setActiveTab("details");
    }
  }, [open, taskId]);

  async function handleTitleBlur(title: string) {
    if (!data.task) return;
    const trimmed = title.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === data.task.title) return;
    await data.patchTask({ title: trimmed });
  }

  async function handleDelete() {
    if (!data.task || !data.user) return;
    if (!canDeleteTask(data.task, data.user.id, hasAny)) {
      toast.error("You do not have permission to delete this task");
      return;
    }
    const message = taskDeleteConfirmMessage({
      isSubtask: Boolean(data.task.parent_id),
      subtaskCount: data.subtasks.length,
    });
    if (!confirm(message)) return;
    const ok = await data.deleteTask();
    if (ok) onOpenChange(false);
  }

  const assigneeIds = useMemo(() => data.assignees.map((a) => a.id), [data.assignees]);

  const activeNowUsers = data.isTracking && data.user
    ? (() => {
      const profile = data.profiles.find((p) => p.id === data.user?.id);
      return profile
        ? [profile]
        : [{
          id: data.user.id,
          full_name: "You",
          avatar_url: null,
          email: data.user.email ?? null,
          job_title: null,
        }];
    })()
    : [];

  function handleAddSubtask() {
    setActiveTab("subtasks");
    setSubtaskCreateTrigger((n) => n + 1);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-[2px]" />
          <DialogPrimitive.Content
            className={previewSidebarShell}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (isPortaledOverlayTarget(e.target)) e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (isPortaledOverlayTarget(e.target)) e.preventDefault();
            }}
            onFocusOutside={(e) => {
              if (isPortaledOverlayTarget(e.target)) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (hasOpenNestedOverlay()) e.preventDefault();
            }}
          >
            {data.loading || !data.task ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              <>
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-5 py-3">
                  <nav className={cn(previewBreadcrumb, "flex min-w-0 flex-1 items-center gap-1")}>
                    {data.task.project_id && data.projectName ? (
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: data.task.project_id }}
                        onClick={() => onOpenChange(false)}
                        className="truncate hover:text-brand"
                      >
                        {data.projectName}
                      </Link>
                    ) : (
                      <span>Standalone</span>
                    )}
                    {data.folderName && (
                      <>
                        <ChevronRight className="size-3 shrink-0 opacity-40" />
                        <span className="truncate">{data.folderName}</span>
                      </>
                    )}
                    {parentTask && (
                      <>
                        <ChevronRight className="size-3 shrink-0 opacity-40" />
                        <button
                          type="button"
                          onClick={() => onTaskChange?.(parentTask.id)}
                          className="truncate hover:text-brand"
                        >
                          {parentTask.title}
                        </button>
                      </>
                    )}
                  </nav>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <TaskPreviewIconButton
                      icon={Pencil}
                      label="Edit task"
                      onClick={() => setShowEditModal(true)}
                    />
                    {!data.task.parent_id && (
                      <TaskPreviewIconButton
                        icon={Plus}
                        label="Add subtask"
                        onClick={handleAddSubtask}
                      />
                    )}
                    {data.task.project_id && (
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: data.task.project_id }}
                        onClick={() => onOpenChange(false)}
                        className="hidden sm:contents"
                      >
                        <TaskPreviewIconButton
                          icon={ExternalLink}
                          label="Open project"
                          onClick={() => {}}
                        />
                      </Link>
                    )}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                          aria-label="More options"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                          <Pencil className="size-4" /> Edit task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void handleDelete()} className="text-danger">
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogPrimitive.Close className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">
                      <X className="size-4" />
                    </DialogPrimitive.Close>
                  </div>
                </header>

                {data.user && data.orgId ? (
                <div className={previewSidebarScroll}>
                  <div className="px-5 py-5">
                    <TaskPreviewDetailsPanel
                      task={data.task}
                      assignees={data.assignees}
                      members={data.mentionMembers}
                      editingTitle={editingTitle}
                      onEditingTitleChange={setEditingTitle}
                      onTitleBlur={(title) => void handleTitleBlur(title)}
                      onStatusChange={(s) => void data.patchTask({ status: s })}
                      onPriorityChange={(p) => void data.patchTask({ priority: p })}
                      onStartDateChange={(d) => void data.patchTask({ start_date: d })}
                      onEndDateChange={(d) => void data.patchTask({ due_date: d })}
                      onEstimatedHoursChange={(h) => void data.patchTask({ estimated_hours: h })}
                      onAssigneesChange={(ids) => void data.syncAssignees(ids)}
                      trackedSeconds={data.trackedTotal}
                      isTracking={data.isTracking}
                      isAssignee={data.isAssignee}
                      timerStartBlocked={data.timerStartBlocked}
                      onToggleTimer={data.toggleTimer}
                    />
                  </div>

                  <div className={cn(previewWorkspacePanel, "border-t border-border/40")}>
                    <TaskPreviewTabsPanel
                        task={data.task}
                        orgId={data.orgId}
                        userId={data.user.id}
                        members={data.mentionMembers}
                        subtasks={data.subtasks}
                        checklistItems={data.checklistItems}
                        comments={data.comments}
                        audits={data.audits}
                        timeEntries={data.timeEntries}
                        profiles={data.profiles}
                        assigneeIds={assigneeIds}
                        trackedTotal={data.trackedTotal}
                        isTracking={data.isTracking}
                        sessionTime={data.sessionTime}
                        isAssignee={data.isAssignee}
                        timerStartBlocked={data.timerStartBlocked}
                        currentUserId={data.user.id}
                        canModerate={hasAny("owner", "admin")}
                        nameOf={data.nameOf}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        subtaskCreateTrigger={subtaskCreateTrigger}
                        onOpenTask={(id) => onTaskChange?.(id)}
                        onReload={data.loadData}
                        onToggleTimer={data.toggleTimer}
                        onAddChecklistItem={data.addChecklistItem}
                        onToggleChecklistItem={data.toggleChecklistItem}
                        onRemoveChecklistItem={data.removeChecklistItem}
                        onAssignChecklistItem={data.assignChecklistItem}
                        onCommentSubmit={data.postComment}
                        onCommentUpdate={data.updateComment}
                        onCommentDelete={data.removeComment}
                        onUploadCommentAttachments={data.uploadTaskAttachments}
                        attachmentCount={data.attachmentCount}
                        onSaveDescription={data.saveDescription}
                        onSaveNote={data.saveNote}
                      />
                  </div>
                </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Loading workspace…
                  </div>
                )}
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {data.user && data.orgId && data.task && (
        <EditTaskModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          orgId={data.orgId}
          userId={data.user.id}
          taskId={data.task.id}
          onSuccess={data.loadData}
        />
      )}

      <TaskDetailsActivePanel
        isTracking={data.isTracking}
        activeUsers={activeNowUsers}
        currentUserId={data.user?.id}
      />
    </>
  );
}
