import { TaskPreviewExpandableRichText } from "@/components/tasks/preview/task-preview-expandable-rich-text";
import type { TaskOrgMember } from "@/lib/tasks/types";

type TaskPreviewDescriptionProps = {
  description: string | null;
  members: TaskOrgMember[];
  compact?: boolean;
  plain?: boolean;
  collapsedLines?: 2 | 3;
  onSave: (value: string, previous: string) => void | Promise<void>;
};

export function TaskPreviewDescription({
  description,
  members,
  compact = false,
  plain = false,
  collapsedLines,
  onSave,
}: TaskPreviewDescriptionProps) {
  return (
    <TaskPreviewExpandableRichText
      label="Description"
      html={description}
      members={members}
      compact={compact}
      plain={plain}
      collapsedLines={collapsedLines ?? (compact ? 3 : undefined)}
      collapsedMaxHeight={compact ? 52 : 96}
      placeholder="What needs to be done?"
      emptyActionLabel="Add description…"
      onSave={onSave}
    />
  );
}
