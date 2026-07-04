import type { TaskFormValues, TaskPriority } from "@/lib/tasks/constants";
import type { TaskStatus } from "@/lib/tasks/status";
import type { TaskDetailRecord } from "@/lib/tasks/types";

export function taskToFormValues(task: TaskDetailRecord, assigneeIds: string[]): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    note: task.note ?? "",
    status: (task.status as TaskStatus) || "todo",
    priority: (task.priority as TaskPriority) || "medium",
    projectId: task.project_id ?? "",
    milestoneId: task.milestone_id ?? "",
    assigneeIds,
    startDate: task.start_date ?? "",
    dueDate: task.due_date ?? "",
    estimatedHours: task.estimated_hours != null ? String(task.estimated_hours) : "",
  };
}
