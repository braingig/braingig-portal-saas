export const PROJECT_STATUSES = [
  { value: "planning", label: "Planning", color: "bg-muted-foreground" },
  { value: "active", label: "Active", color: "bg-brand" },
  { value: "on_hold", label: "On Hold", color: "bg-warning" },
  { value: "completed", label: "Completed", color: "bg-success" },
  { value: "cancelled", label: "Cancelled", color: "bg-danger" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];

export const PROJECT_KANBAN_COLUMNS = PROJECT_STATUSES.map(({ value, label, color }) => ({
  key: value,
  label,
  color,
}));

export const PROJECT_FORM_DEFAULTS = {
  name: "",
  budget: "",
  hourlyRate: "",
  status: "planning" as ProjectStatus,
  client: "",
  startDate: "",
  endDate: "",
  description: "",
  note: "",
};

export type ProjectFormValues = typeof PROJECT_FORM_DEFAULTS;
