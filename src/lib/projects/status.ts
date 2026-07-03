import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/projects/constants";

export function getProjectStatusMeta(status: string) {
  return PROJECT_STATUSES.find((s) => s.value === status) ?? {
    value: status as ProjectStatus,
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "bg-muted-foreground",
  };
}
