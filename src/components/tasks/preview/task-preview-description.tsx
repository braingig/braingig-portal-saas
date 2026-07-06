import { TaskPreviewExpandableRichText } from "@/components/tasks/preview/task-preview-expandable-rich-text";
import type { TaskOrgMember } from "@/lib/tasks/types";

type TaskPreviewDescriptionProps = {
  description: string | null;
  members: TaskOrgMember[];
  compact?: boolean;
  onSave: (value: string, previous: string) => void | Promise<void>;
};

export function TaskPreviewDescription({
  description,
  members,
  compact = false,
  onSave,
}: TaskPreviewDescriptionProps) {
  return (
    <TaskPreviewExpandableRichText
      label="Description"
      html={description}
      members={members}
      compact={compact}
      collapsedMaxHeight={compact ? 64 : 96}
      placeholder="What needs to be done?"
      emptyActionLabel="Add description…"
      onSave={onSave}
    />
  );
}
