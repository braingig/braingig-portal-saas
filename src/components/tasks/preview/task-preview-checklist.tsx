import { Check, Trash2 } from "lucide-react";
import { QuickChecklistAddRow, SingleAssigneeControl } from "@/components/tasks/preview/quick-checklist-add-row";
import { previewMeta, previewSubtaskTitle } from "@/components/tasks/preview/task-preview-styles";
import type { TaskChecklistItem } from "@/lib/tasks/checklist";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewChecklistProps = {
  items: TaskChecklistItem[];
  members: TaskOrgMember[];
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
  onToggle: (item: TaskChecklistItem) => void;
  onDelete: (item: TaskChecklistItem) => void;
  onAdd: (title: string, assigneeId: string | null) => Promise<void>;
  onAssigneeChange: (item: TaskChecklistItem, assigneeId: string | null) => void;
};

export function TaskPreviewChecklist({
  items,
  members,
  createOpen: createOpenProp,
  onCreateOpenChange,
  onToggle,
  onDelete,
  onAdd,
  onAssigneeChange,
}: TaskPreviewChecklistProps) {
  const createOpen = createOpenProp ?? false;
  const setCreateOpen = onCreateOpenChange ?? (() => {});

  const doneCount = items.filter((item) => item.is_completed).length;

  return (
    <div className="space-y-1">
      {createOpen && (
        <QuickChecklistAddRow
          members={members}
          onAdd={onAdd}
          onCancel={() => setCreateOpen(false)}
        />
      )}

      {items.length > 0 && (
        <p className={cn("mb-2", previewMeta)}>
          {doneCount}/{items.length} completed
        </p>
      )}

      {items.length === 0 && !createOpen ? (
        <p className={cn("py-2", previewMeta)}>No checklist items yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="group -mx-1 flex min-h-[32px] items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors hover:bg-surface/50"
            >
              <button
                type="button"
                onClick={() => onToggle(item)}
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                  item.is_completed
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-muted-foreground/40 text-transparent hover:border-brand",
                )}
                aria-label={item.is_completed ? "Mark incomplete" : "Mark complete"}
              >
                <Check className="size-2.5" strokeWidth={3} />
              </button>

              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  previewSubtaskTitle,
                  item.is_completed && "text-muted-foreground line-through",
                )}
              >
                {item.title}
              </span>

              <SingleAssigneeControl
                members={members}
                assigneeId={item.assignee_id}
                onChange={(id) => onAssigneeChange(item, id)}
              />

              <button
                type="button"
                onClick={() => onDelete(item)}
                className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-surface hover:text-danger group-hover:opacity-100"
                aria-label={`Delete ${item.title}`}
              >
                <Trash2 className="size-3" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
