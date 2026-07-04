import { useRef, useState } from "react";
import { CheckSquare, Layers, ListPlus, Paperclip, Plus } from "lucide-react";
import { TaskPreviewAttachments } from "@/components/tasks/preview/task-preview-attachments";
import { TaskPreviewChecklist } from "@/components/tasks/preview/task-preview-checklist";
import { TaskPreviewSection } from "@/components/tasks/preview/task-preview-section";
import { TaskPreviewSubtasks } from "@/components/tasks/preview/task-preview-subtasks";
import { TaskPreviewTimeCard } from "@/components/tasks/preview/task-preview-time-card";
import { TaskPreviewTimeDetails } from "@/components/tasks/preview/task-preview-time-details";
import type {
  TaskDetailProfile,
  TaskDetailRecord,
  TaskListItem,
  TaskOrgMember,
  TaskTimeEntry,
} from "@/lib/tasks/types";
import type { TaskChecklistItem } from "@/lib/tasks/checklist";

type TaskPreviewExpandablesProps = {
  task: TaskDetailRecord;
  orgId: string;
  userId: string;
  members: TaskOrgMember[];
  subtasks: TaskListItem[];
  checklistItems: TaskChecklistItem[];
  attachmentCount: number;
  trackedTotal: number;
  isTracking: boolean;
  sessionTime: number;
  isAssignee: boolean;
  timerStartBlocked: boolean;
  timeEntries: TaskTimeEntry[];
  profiles: TaskDetailProfile[];
  assigneeIds: string[];
  onOpenTask: (id: string) => void;
  onReload: () => void;
  onToggleTimer: () => void;
  onAddChecklistItem: (title: string, assigneeId: string | null) => Promise<void>;
  onToggleChecklistItem: (item: TaskChecklistItem) => void;
  onRemoveChecklistItem: (item: TaskChecklistItem) => void;
  onAssignChecklistItem: (item: TaskChecklistItem, assigneeId: string | null) => void;
};

export function TaskPreviewExpandables({
  task,
  orgId,
  userId,
  members,
  subtasks,
  checklistItems,
  attachmentCount,
  trackedTotal,
  isTracking,
  sessionTime,
  isAssignee,
  timerStartBlocked,
  timeEntries,
  profiles,
  assigneeIds,
  onOpenTask,
  onReload,
  onToggleTimer,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
  onAssignChecklistItem,
}: TaskPreviewExpandablesProps) {
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [createChecklistOpen, setCreateChecklistOpen] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-5 space-y-0.5 border-t border-border/40 pt-4">
      {!task.parent_id && (
        <TaskPreviewSection
          icon={ListPlus}
          label={subtasks.length > 0 ? `Subtasks (${subtasks.length})` : "Add subtask"}
          action={{
            icon: Plus,
            label: "Add subtask",
            onClick: () => setCreateSubtaskOpen(true),
          }}
        >
          <TaskPreviewSubtasks
            parentTask={task}
            subtasks={subtasks}
            orgId={orgId}
            userId={userId}
            members={members}
            onChange={onReload}
            onOpenTask={onOpenTask}
            createOpen={createSubtaskOpen}
            onCreateOpenChange={setCreateSubtaskOpen}
          />
        </TaskPreviewSection>
      )}

      {!task.parent_id && (
        <TaskPreviewSection
          icon={CheckSquare}
          label={
            checklistItems.length > 0
              ? `Checklist (${checklistItems.filter((i) => i.is_completed).length}/${checklistItems.length})`
              : "Add checklist"
          }
          action={{
            icon: Plus,
            label: "Add checklist item",
            onClick: () => setCreateChecklistOpen(true),
          }}
        >
          <TaskPreviewChecklist
            items={checklistItems}
            members={members}
            createOpen={createChecklistOpen}
            onCreateOpenChange={setCreateChecklistOpen}
            onToggle={onToggleChecklistItem}
            onDelete={onRemoveChecklistItem}
            onAdd={onAddChecklistItem}
            onAssigneeChange={onAssignChecklistItem}
          />
        </TaskPreviewSection>
      )}

      <TaskPreviewSection
        icon={Paperclip}
        label={attachmentCount > 0 ? `Attachments (${attachmentCount})` : "Add attachment"}
        action={{
          icon: Paperclip,
          label: "Add attachment",
          onClick: () => attachmentInputRef.current?.click(),
        }}
      >
        <TaskPreviewAttachments
          orgId={orgId}
          userId={userId}
          taskId={task.id}
          refreshKey={attachmentCount}
          fileInputRef={attachmentInputRef}
          onUploaded={onReload}
        />
      </TaskPreviewSection>

      <TaskPreviewSection icon={Layers} label="Time tracking">
        <TaskPreviewTimeCard
          totalSeconds={trackedTotal}
          isTracking={isTracking}
          sessionSeconds={sessionTime}
          isAssignee={isAssignee}
          timerStartBlocked={timerStartBlocked}
          onToggleTimer={onToggleTimer}
        />
        <TaskPreviewTimeDetails
          taskId={task.id}
          timeEntries={timeEntries}
          profiles={profiles}
          assigneeIds={assigneeIds}
          isTracking={isTracking}
          sessionTime={sessionTime}
          currentUserId={userId}
        />
      </TaskPreviewSection>
    </div>
  );
}
