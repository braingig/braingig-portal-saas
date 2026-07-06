import { TaskPreviewExpandableRichText } from "@/components/tasks/preview/task-preview-expandable-rich-text";
import type { TaskOrgMember } from "@/lib/tasks/types";

type TaskPreviewNoteProps = {
  note: string | null;
  members: TaskOrgMember[];
  compact?: boolean;
  plain?: boolean;
  collapsedLines?: 2 | 3;
  onSave: (value: string, previous: string) => void | Promise<void>;
};

export function TaskPreviewNote({
  note,
  members,
  compact = false,
  plain = false,
  collapsedLines,
  onSave,
}: TaskPreviewNoteProps) {
  if (compact) {
    return (
      <TaskPreviewExpandableRichText
        label="Internal note"
        html={note}
        members={members}
        compact
        plain={plain}
        collapsedLines={collapsedLines ?? 3}
        collapsedMaxHeight={plain ? 52 : 52}
        placeholder="Internal notes…"
        emptyActionLabel={plain ? "Add note…" : "+ Add internal note"}
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
