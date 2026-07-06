import { useRef } from "react";
import { TaskPreviewAttachments } from "@/components/tasks/preview/task-preview-attachments";
import { TaskPreviewDescription } from "@/components/tasks/preview/task-preview-description";
import { TaskPreviewNote } from "@/components/tasks/preview/task-preview-note";
import type { TaskDetailRecord, TaskOrgMember } from "@/lib/tasks/types";

type TaskPreviewDetailsTabProps = {
  task: TaskDetailRecord;
  members: TaskOrgMember[];
  orgId: string;
  userId: string;
  attachmentCount: number;
  onSaveDescription: (value: string, previous: string) => void | Promise<void>;
  onSaveNote: (value: string, previous: string) => void | Promise<void>;
  onAttachmentsUploaded: () => void;
};

export function TaskPreviewDetailsTab({
  task,
  members,
  orgId,
  userId,
  attachmentCount,
  onSaveDescription,
  onSaveNote,
  onAttachmentsUploaded,
}: TaskPreviewDetailsTabProps) {
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="divide-y divide-border/40">
      <section className="pb-5">
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Description
        </h3>
        <TaskPreviewDescription
          key={task.id}
          description={task.description}
          members={members}
          compact
          plain
          collapsedLines={3}
          onSave={onSaveDescription}
        />
      </section>

      <section className="py-5">
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Internal note
        </h3>
        <TaskPreviewNote
          key={`${task.id}-note`}
          note={task.note}
          members={members}
          compact
          plain
          collapsedLines={3}
          onSave={onSaveNote}
        />
      </section>

      <section className="pt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Attachments
            {attachmentCount > 0 && (
              <span className="ml-1.5 font-normal normal-case text-muted-foreground/70">
                ({attachmentCount})
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            className="text-[12px] font-medium text-brand hover:underline"
          >
            Add file
          </button>
        </div>
        <TaskPreviewAttachments
          orgId={orgId}
          userId={userId}
          taskId={task.id}
          refreshKey={attachmentCount}
          fileInputRef={attachmentInputRef}
          compact
          onUploaded={onAttachmentsUploaded}
        />
      </section>
    </div>
  );
}
