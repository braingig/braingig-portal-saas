import type { LucideIcon } from "lucide-react";
import { TaskPreviewHint } from "@/components/tasks/preview/task-preview-hint";
import { cn } from "@/lib/utils";

type TaskPreviewIconButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
};

export function TaskPreviewIconButton({
  icon: Icon,
  label,
  onClick,
  className,
}: TaskPreviewIconButtonProps) {
  return (
    <TaskPreviewHint label={label} side="top">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface/80 hover:text-foreground",
          className,
        )}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </button>
    </TaskPreviewHint>
  );
}
