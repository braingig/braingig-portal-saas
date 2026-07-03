import { useRef, useState } from "react";
import { Layers, ListPlus, Paperclip, Plus } from "lucide-react";
import { TaskPreviewAttachments } from "@/components/tasks/preview/task-preview-attachments";
import { TaskPreviewComments } from "@/components/tasks/preview/task-preview-comments";
import { TaskPreviewSection } from "@/components/tasks/preview/task-preview-section";
import { TaskPreviewSubtasks } from "@/components/tasks/preview/task-preview-subtasks";
import { TaskPreviewTimeCard } from "@/components/tasks/preview/task-preview-time-card";
import type { TaskCommentNode } from "@/lib/tasks/comments";
import type {
  TaskDetailRecord,
  TaskListItem,
  TaskOrgMember,
} from "@/lib/tasks/types";

type TaskPreviewExpandablesProps = {
  task: TaskDetailRecord;
  orgId: string;
  userId: string;
  subtasks: TaskListItem[];
  comments: TaskCommentNode[];
  mentionMembers: TaskOrgMember[];
  currentUserId?: string;
  canModerate: boolean;
  attachmentCount: number;
  commentCount: number;
  trackedTotal: number;
  isTracking: boolean;
  sessionTime: number;
  isAssignee: boolean;
  onOpenTask: (id: string) => void;
  onReload: () => void;
  onCommentSubmit: (body: string, parentId?: string | null) => Promise<void>;
  onCommentUpdate: (id: string, body: string) => Promise<void>;
  onCommentDelete: (id: string) => Promise<void>;
  onToggleTimer: () => void;
};

export function TaskPreviewExpandables({
  task,
  orgId,
  userId,
  subtasks,
  comments,
  mentionMembers,
  currentUserId,
  canModerate,
  attachmentCount,
  commentCount,
  trackedTotal,
  isTracking,
  sessionTime,
  isAssignee,
  onOpenTask,
  onReload,
  onCommentSubmit,
  onCommentUpdate,
  onCommentDelete,
  onToggleTimer,
}: TaskPreviewExpandablesProps) {
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
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
            onChange={onReload}
            onOpenTask={onOpenTask}
            createOpen={createSubtaskOpen}
            onCreateOpenChange={setCreateSubtaskOpen}
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
          canStartTimer={isAssignee}
          onToggleTimer={onToggleTimer}
        />
      </TaskPreviewSection>

      <TaskPreviewSection
        icon={Plus}
        label={commentCount > 0 ? `Comments (${commentCount})` : "Comments"}
      >
        <TaskPreviewComments
          comments={comments}
          members={mentionMembers}
          currentUserId={currentUserId}
          canModerate={canModerate}
          onSubmit={onCommentSubmit}
          onUpdate={onCommentUpdate}
          onDelete={onCommentDelete}
        />
      </TaskPreviewSection>
    </div>
  );
}
