import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CheckSquare,
  ChevronRight,
  ExternalLink,
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
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskPreviewActivityPanel } from "@/components/tasks/preview/task-preview-activity-panel";
import { TaskPreviewDescription } from "@/components/tasks/preview/task-preview-description";
import { TaskPreviewExpandables } from "@/components/tasks/preview/task-preview-expandables";
import { TaskPreviewMetaGrid } from "@/components/tasks/preview/task-preview-meta-grid";
import { useTaskPreviewData } from "@/components/tasks/preview/use-task-preview-data";
import { hasOpenNestedOverlay, isPortaledOverlayTarget } from "@/components/tasks/preview/task-preview-dialog-guards";
import { previewModalTitle } from "@/components/tasks/preview/task-preview-styles";
import { useRoles } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { hasAny } = useRoles();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const data = useTaskPreviewData(taskId, open, onUpdated);

  useEffect(() => {
    if (open) setEditingTitle(false);
  }, [open, taskId]);

  function openFullPage() {
    if (!taskId) return;
    onOpenChange(false);
    navigate({ to: "/tasks/$taskId", params: { taskId } });
  }

  async function handleTitleBlur(title: string) {
    if (!data.task) return;
    const trimmed = title.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === data.task.title) return;
    await data.patchTask({ title: trimmed });
  }

  async function handleDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    const ok = await data.deleteTask();
    if (ok) onOpenChange(false);
  }

  const createdLabel = data.task?.created_at
    ? `Created ${format(new Date(data.task.created_at), "MMM d")}`
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/45 backdrop-blur-[3px]" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 flex h-[min(92vh,820px)] w-[min(96vw,1180px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden",
              "rounded-2xl border border-border/50 bg-card shadow-2xl",
              "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
            )}
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
                  </nav>

                  <div className="flex shrink-0 items-center gap-1">
                    {createdLabel && (
                      <span className="mr-2 hidden text-xs text-muted-foreground sm:inline">
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
                        <DropdownMenuItem onClick={openFullPage}>
                          <ExternalLink className="size-4" /> Open full page
                        </DropdownMenuItem>
                        {data.user?.id === data.task.created_by && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => void handleDelete()} className="text-danger">
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
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
                          className={cn("mb-5 w-full text-left hover:text-brand/90", previewModalTitle)}
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
                        canStartTimer={data.isAssignee}
                        onStatusChange={(s) => void data.patchTask({ status: s })}
                        onPriorityChange={(p) => void data.patchTask({ priority: p })}
                        onDueDateChange={(d) => void data.patchTask({ due_date: d })}
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

                      {data.user && data.orgId && (
                        <TaskPreviewExpandables
                          key={`${data.task.id}-${open}`}
                          task={data.task}
                          orgId={data.orgId}
                          userId={data.user.id}
                          subtasks={data.subtasks}
                          comments={data.comments}
                          mentionMembers={data.mentionMembers}
                          currentUserId={data.user.id}
                          canModerate={hasAny("owner", "admin")}
                          attachmentCount={data.attachmentCount}
                          commentCount={data.commentCount}
                          trackedTotal={data.trackedTotal}
                          isTracking={data.isTracking}
                          sessionTime={data.sessionTime}
                          isAssignee={data.isAssignee}
                          onOpenTask={(id) => onTaskChange?.(id)}
                          onReload={data.loadData}
                          onCommentSubmit={data.postComment}
                          onCommentUpdate={data.updateComment}
                          onCommentDelete={data.removeComment}
                          onToggleTimer={data.toggleTimer}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right — activity sidebar */}
                  <TaskPreviewActivityPanel
                    timeEntries={data.timeEntries}
                    comments={data.flatComments}
                    audits={data.audits}
                    nameOf={data.nameOf}
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
    </>
  );
}
