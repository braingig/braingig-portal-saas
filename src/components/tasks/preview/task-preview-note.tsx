import { TaskPreviewExpandableRichText } from "@/components/tasks/preview/task-preview-expandable-rich-text";
import type { TaskOrgMember } from "@/lib/tasks/types";

type TaskPreviewNoteProps = {
  note: string | null;
  members: TaskOrgMember[];
  compact?: boolean;
  onSave: (value: string, previous: string) => void | Promise<void>;
};

export function TaskPreviewNote({
  note,
  members,
  compact = false,
  onSave,
}: TaskPreviewNoteProps) {
  if (compact) {
    return (
      <TaskPreviewExpandableRichText
        label="Internal note"
        html={note}
        members={members}
        compact
        collapsedMaxHeight={56}
        placeholder="Internal notes…"
        emptyActionLabel="+ Add internal note"
        onSave={onSave}
      />
    );
  }

  return (
    <TaskPreviewExpandableRichText
      label="Internal note"
      html={note}
      members={members}
      collapsedMaxHeight={96}
      placeholder="Internal notes (optional)… Type @ to mention someone."
      emptyActionLabel="Add internal note"
      onSave={onSave}
    />
  );
}
