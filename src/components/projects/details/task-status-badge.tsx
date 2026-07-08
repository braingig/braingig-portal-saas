import { cn } from "@/lib/utils";
import { projectStatusPill } from "@/components/projects/details/project-details-styles";

const TASK_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  todo: { label: "To do", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", className: "bg-brand/10 text-brand" },
  review: { label: "Review", className: "bg-warning/10 text-warning" },
  done: { label: "Done", className: "bg-success/10 text-success" },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const meta = TASK_STATUS_STYLES[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        projectStatusPill,
        "inline-flex shrink-0 items-center capitalize",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
