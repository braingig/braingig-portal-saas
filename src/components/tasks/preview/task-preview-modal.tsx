import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CheckSquare,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDetailsActivePanel } from "@/components/tasks/details/task-details-active-panel";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskPreviewActivityPanel } from "@/components/tasks/preview/task-preview-activity-panel";
import { TaskPreviewDescription } from "@/components/tasks/preview/task-preview-description";
import { TaskPreviewExpandables } from "@/components/tasks/preview/task-preview-expandables";
import { TaskPreviewMetaGrid } from "@/components/tasks/preview/task-preview-meta-grid";
import { TaskPreviewNote } from "@/components/tasks/preview/task-preview-note";
import { useTaskPreviewData } from "@/components/tasks/preview/use-task-preview-data";
import { hasOpenNestedOverlay, isPortaledOverlayTarget } from "@/components/tasks/preview/task-preview-dialog-guards";
import { previewModalShell, previewModalTitle, previewTitleField } from "@/components/tasks/preview/task-preview-styles";
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
    if (open) setEditingTitle(false);
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

  const createdLabel = data.task?.created_at
    ? `Created ${format(new Date(data.task.created_at), "MMM d")}`
    : null;

  const createdBy = useMemo(
    () => data.profiles.find((p) => p.id === data.task?.created_by) ?? null,
    [data.profiles, data.task?.created_by],
  );

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/45 backdrop-blur-[3px]" />
          <DialogPrimitive.Content
            className={previewModalShell}
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
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border/40 px-5 py-3">
                  <nav className="flex min-w-0 flex-1 items-center gap-1 text-xs text-muted-foreground">
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

                  <div className="flex shrink-0 items-center gap-1">
                    {(createdLabel || createdBy) && (
                      <span className="mr-2 hidden max-w-[220px] truncate text-xs text-muted-foreground sm:inline">
                        {createdBy && <>By {createdBy.full_name}</>}
                        {createdBy && createdLabel && " · "}
                        {createdLabel}
                      </span>
                    )}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                          <Pencil className="size-4" /> Edit task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void handleDelete()} className="text-danger">
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogPrimitive.Close className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-surface">
                      <X className="size-4" />
                    </DialogPrimitive.Close>
                  </div>
                </header>

                {/* Body: main + activity */}
                <div className="flex min-h-0 flex-1">
                  {/* Left — task workspace */}
                  <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                    <div className="px-6 pb-6 pt-5">
                      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckSquare className="size-3.5" />
                        <span>Task</span>
                      </div>

                      {editingTitle ? (
                        <input
                          key={data.task.id}
                          defaultValue={data.task.title}
                          autoFocus
                          className={cn("mb-5 w-full border-0 bg-transparent outline-none", previewModalTitle)}
                          onBlur={(e) => void handleTitleBlur(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") setEditingTitle(false);
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingTitle(true)}
                          className={cn("mb-5 w-full text-left", previewTitleField, previewModalTitle)}
                        >
                          {data.task.title}
                        </button>
                      )}

                      <TaskPreviewMetaGrid
                        task={data.task}
                        assignees={data.assignees}
                        members={data.mentionMembers}
                        trackedSeconds={data.trackedTotal}
                        isTracking={data.isTracking}
                        isAssignee={data.isAssignee}
                        timerStartBlocked={data.timerStartBlocked}
                        onStatusChange={(s) => void data.patchTask({ status: s })}
                        onPriorityChange={(p) => void data.patchTask({ priority: p })}
                        onStartDateChange={(d) => void data.patchTask({ start_date: d })}
                        onEndDateChange={(d) => void data.patchTask({ due_date: d })}
                        onEstimatedHoursChange={(h) => void data.patchTask({ estimated_hours: h })}
                        onAssigneesChange={(ids) => void data.syncAssignees(ids)}
                        onToggleTimer={data.toggleTimer}
                      />

                      <div className="mt-6">
                        <TaskPreviewDescription
                          key={data.task.id}
                          description={data.task.description}
                          members={data.mentionMembers}
                          onSave={data.saveDescription}
                        />
                      </div>

                      <div className="mt-6">
                        <TaskPreviewNote
                          key={`${data.task.id}-note`}
                          note={data.task.note}
                          members={data.mentionMembers}
                          onSave={data.saveNote}
                        />
                      </div>

                      {data.user && data.orgId && (
                        <TaskPreviewExpandables
                          key={`${data.task.id}-${open}`}
                          task={data.task}
                          orgId={data.orgId}
                          userId={data.user.id}
                          members={data.mentionMembers}
                          subtasks={data.subtasks}
                          checklistItems={data.checklistItems}
                          attachmentCount={data.attachmentCount}
                          trackedTotal={data.trackedTotal}
                          isTracking={data.isTracking}
                          sessionTime={data.sessionTime}
                          isAssignee={data.isAssignee}
                          timerStartBlocked={data.timerStartBlocked}
                          timeEntries={data.timeEntries}
                          profiles={data.profiles}
                          assigneeIds={assigneeIds}
                          onOpenTask={(id) => onTaskChange?.(id)}
                          onReload={data.loadData}
                          onToggleTimer={data.toggleTimer}
                          onAddChecklistItem={data.addChecklistItem}
                          onToggleChecklistItem={data.toggleChecklistItem}
                          onRemoveChecklistItem={data.removeChecklistItem}
                          onAssignChecklistItem={data.assignChecklistItem}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right — activity sidebar */}
                  <TaskPreviewActivityPanel
                    timeEntries={data.timeEntries}
                    comments={data.comments}
                    audits={data.audits}
                    nameOf={data.nameOf}
                    mentionMembers={data.mentionMembers}
                    currentUserId={data.user?.id}
                    canModerate={hasAny("owner", "admin")}
                    onCommentSubmit={data.user ? data.postComment : undefined}
                    onCommentUpdate={data.user ? data.updateComment : undefined}
                    onCommentDelete={data.user ? data.removeComment : undefined}
                  />
                </div>
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
