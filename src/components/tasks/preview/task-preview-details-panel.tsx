import { TaskPreviewAttachments } from "@/components/tasks/preview/task-preview-attachments";
import { TaskPreviewDescription } from "@/components/tasks/preview/task-preview-description";
import { TaskPreviewMetaGrid } from "@/components/tasks/preview/task-preview-meta-grid";
import { TaskPreviewNote } from "@/components/tasks/preview/task-preview-note";
import { previewTitleField } from "@/components/tasks/preview/task-preview-styles";
import type { TaskDetailProfile, TaskDetailRecord, TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewDetailsPanelProps = {
  task: TaskDetailRecord;
  assignees: TaskDetailProfile[];
  members: TaskOrgMember[];
  orgId: string;
  userId: string;
  attachmentCount: number;
  attachmentInputRef: React.RefObject<HTMLInputElement | null>;
  editingTitle: boolean;
  onEditingTitleChange: (editing: boolean) => void;
  onTitleBlur: (title: string) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  onAssigneesChange: (ids: string[]) => void;
  trackedSeconds: number;
  isTracking: boolean;
  isAssignee: boolean;
  timerStartBlocked: boolean;
  onToggleTimer: () => void;
  onSaveDescription: (value: string, previous: string) => void | Promise<void>;
  onSaveNote: (value: string, previous: string) => void | Promise<void>;
  onAttachmentsUploaded: () => void;
};

export function TaskPreviewDetailsPanel({
  task,
  assignees,
  members,
  orgId,
  userId,
  attachmentCount,
  attachmentInputRef,
  editingTitle,
  onEditingTitleChange,
  onTitleBlur,
  onStatusChange,
  onPriorityChange,
  onStartDateChange,
  onEndDateChange,
  onAssigneesChange,
  trackedSeconds,
  isTracking,
  isAssignee,
  timerStartBlocked,
  onToggleTimer,
  onSaveDescription,
  onSaveNote,
  onAttachmentsUploaded,
}: TaskPreviewDetailsPanelProps) {
  return (
    <div className="space-y-4">
      {editingTitle ? (
        <input
          key={task.id}
          defaultValue={task.title}
          autoFocus
          className={cn("w-full border-0 bg-transparent text-lg font-semibold leading-tight outline-none")}
          onBlur={(e) => onTitleBlur(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") onEditingTitleChange(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => onEditingTitleChange(true)}
          className={cn("w-full text-left text-lg font-semibold leading-tight", previewTitleField)}
        >
          {task.title}
        </button>
      )}

      <TaskPreviewMetaGrid
        task={task}
        assignees={assignees}
        members={members}
        compact
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onAssigneesChange={onAssigneesChange}
        trackedSeconds={trackedSeconds}
        isTracking={isTracking}
        isAssignee={isAssignee}
        timerStartBlocked={timerStartBlocked}
        onToggleTimer={onToggleTimer}
      />

      <TaskPreviewDescription
        key={task.id}
        description={task.description}
        members={members}
        compact
        onSave={onSaveDescription}
      />

      <TaskPreviewNote
        key={`${task.id}-note`}
        note={task.note}
        members={members}
        compact
        onSave={onSaveNote}
      />

      <div className="border-t border-border/40 pt-4">
        <TaskPreviewAttachments
          orgId={orgId}
          userId={userId}
          taskId={task.id}
          refreshKey={attachmentCount}
          fileInputRef={attachmentInputRef}
          compact
          onUploaded={onAttachmentsUploaded}
        />
      </div>
    </div>
  );
}
