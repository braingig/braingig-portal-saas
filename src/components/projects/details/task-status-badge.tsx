import { cn } from "@/lib/utils";

const TASK_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-surface-2 text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-brand/15 text-brand" },
  review: { label: "Review", className: "bg-warning/15 text-warning" },
  done: { label: "Completed", className: "bg-success/15 text-success" },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const meta = TASK_STATUS_STYLES[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-surface-2 text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
