import type { TaskStatus } from "@/lib/tasks/status";

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];

export const TASK_FORM_DEFAULTS = {
  title: "",
  description: "",
  note: "",
  status: "todo" as TaskStatus,
  priority: "medium" as TaskPriority,
  projectId: "",
  milestoneId: "",
  assigneeIds: [] as string[],
  startDate: "",
  dueDate: "",
  estimatedHours: "",
};

export type TaskFormValues = typeof TASK_FORM_DEFAULTS;
