export const TASK_STATUSES = [
  { key: "todo", label: "To Do", color: "bg-muted-foreground" },
  { key: "in_progress", label: "In Progress", color: "bg-brand" },
  { key: "review", label: "Review", color: "bg-warning" },
  { key: "done", label: "Done", color: "bg-success" },
  { key: "blocked", label: "Blocked", color: "bg-danger" },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["key"];

export function getTaskStatusMeta(status: string) {
  const found = TASK_STATUSES.find((s) => s.key === status);
  if (found) return found;
  return { key: status, label: status.replace(/_/g, " "), color: "bg-muted-foreground" };
}

export const TASK_STATUS_PILL: Record<string, string> = {
  todo: "border-border bg-surface-2 text-muted-foreground",
  in_progress: "border-brand/30 bg-brand/10 text-brand",
  review: "border-warning/30 bg-warning/10 text-warning",
  done: "border-success/30 bg-success/10 text-success",
  blocked: "border-danger/30 bg-danger/10 text-danger",
};

export const TASK_PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-danger/10 text-danger border-danger/20",
  high: "bg-warning/10 text-warning border-warning/20",
  medium: "border-brand/30 bg-brand/10 text-brand",
  low: "bg-surface-2 text-muted-foreground border-border",
};

export function countOpenTasks(tasks: { status: string }[]) {
  return tasks.filter((t) => t.status !== "done").length;
}

export function countDoneTasks(tasks: { status: string }[]) {
  return tasks.filter((t) => t.status === "done").length;
}
