import { TaskPreviewMetaGrid } from "@/components/tasks/preview/task-preview-meta-grid";
import {
  previewModalHeading,
  previewTitleField,
} from "@/components/tasks/preview/task-preview-styles";
import type { TaskDetailProfile, TaskDetailRecord, TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewDetailsPanelProps = {
  task: TaskDetailRecord;
  assignees: TaskDetailProfile[];
  members: TaskOrgMember[];
  editingTitle: boolean;
  onEditingTitleChange: (editing: boolean) => void;
  onTitleBlur: (title: string) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  onEstimatedHoursChange: (hours: number | null) => void;
  onAssigneesChange: (ids: string[]) => void;
  trackedSeconds: number;
  isTracking: boolean;
  isAssignee: boolean;
  timerStartBlocked: boolean;
  onToggleTimer: () => void;
};

export function TaskPreviewDetailsPanel({
  task,
  assignees,
  members,
  editingTitle,
  onEditingTitleChange,
  onTitleBlur,
  onStatusChange,
  onPriorityChange,
  onStartDateChange,
  onEndDateChange,
  onEstimatedHoursChange,
  onAssigneesChange,
  trackedSeconds,
  isTracking,
  isAssignee,
  timerStartBlocked,
  onToggleTimer,
}: TaskPreviewDetailsPanelProps) {
  return (
    <div className="space-y-4">
      {editingTitle ? (
        <input
          key={task.id}
          defaultValue={task.title}
          autoFocus
          className={cn(
            "w-full border-0 bg-transparent outline-none",
            previewModalHeading,
          )}
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
          className={cn("w-full text-left", previewModalHeading, previewTitleField)}
        >
          {task.title}
        </button>
      )}

      <TaskPreviewMetaGrid
        task={task}
        assignees={assignees}
        members={members}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onEstimatedHoursChange={onEstimatedHoursChange}
        onAssigneesChange={onAssigneesChange}
        trackedSeconds={trackedSeconds}
        isTracking={isTracking}
        isAssignee={isAssignee}
        timerStartBlocked={timerStartBlocked}
        onToggleTimer={onToggleTimer}
      />
    </div>
  );
}
