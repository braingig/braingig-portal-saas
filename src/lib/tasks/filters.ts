import { addDays, isPast, isToday, startOfDay } from "date-fns";
import type { TaskListItem } from "@/lib/tasks/types";

export const TASKS_FILTER_ALL = "all";
export const TASKS_FILTER_UNASSIGNED = "unassigned";
export const TASKS_FILTER_STANDALONE = "standalone";

export type TasksSortOption = "newest" | "oldest" | "due_date" | "title" | "priority";
export type TasksDueDateFilter = "all" | "overdue" | "today" | "week" | "none";

export type TasksAdvancedFilters = {
  priorityFilter: string;
  dueDateFilter: TasksDueDateFilter;
  createdByFilter: string;
  sortBy: TasksSortOption;
};

export type TasksListFilters = {
  assigneeFilter: string;
  statusFilter: string;
  hideCompleted: boolean;
  myTasksOnly: boolean;
  advanced: TasksAdvancedFilters;
};

export const DEFAULT_TASKS_ADVANCED_FILTERS: TasksAdvancedFilters = {
  priorityFilter: TASKS_FILTER_ALL,
  dueDateFilter: "all",
  createdByFilter: TASKS_FILTER_ALL,
  sortBy: "newest",
};

export const DEFAULT_TASKS_LIST_FILTERS: TasksListFilters = {
  assigneeFilter: TASKS_FILTER_ALL,
  statusFilter: TASKS_FILTER_ALL,
  hideCompleted: false,
  myTasksOnly: false,
  advanced: DEFAULT_TASKS_ADVANCED_FILTERS,
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function matchesDueDateFilter(task: TaskListItem, filter: TasksDueDateFilter) {
  if (filter === "all") return true;
  if (filter === "none") return !task.due_date;
  if (!task.due_date) return false;

  const date = new Date(task.due_date);
  if (filter === "today") return isToday(date);
  if (filter === "overdue") {
    return task.status !== "done" && isPast(startOfDay(date)) && !isToday(date);
  }
  if (filter === "week") {
    const end = addDays(startOfDay(new Date()), 7);
    return date >= startOfDay(new Date()) && date <= end;
  }
  return true;
}

function sortTasks(tasks: TaskListItem[], sortBy: TasksSortOption) {
  const sorted = [...tasks];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return (a.created_at ?? "").localeCompare(b.created_at ?? "");
      case "due_date": {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      case "title":
        return a.title.localeCompare(b.title);
      case "priority":
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      case "newest":
      default:
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    }
  });
  return sorted;
}

export function applyTasksListFilters(
  tasks: TaskListItem[],
  filters: TasksListFilters,
  userId?: string,
) {
  let result = tasks;

  if (filters.myTasksOnly && userId) {
    result = result.filter((t) => t.assignee_id === userId);
  }

  if (filters.hideCompleted) {
    result = result.filter((t) => t.status !== "done");
  }

  if (filters.assigneeFilter !== TASKS_FILTER_ALL) {
    result = result.filter((t) =>
      filters.assigneeFilter === TASKS_FILTER_UNASSIGNED
        ? !t.assignee_id
        : t.assignee_id === filters.assigneeFilter,
    );
  }

  if (filters.statusFilter !== TASKS_FILTER_ALL) {
    result = result.filter((t) => t.status === filters.statusFilter);
  }

  if (filters.advanced.priorityFilter !== TASKS_FILTER_ALL) {
    result = result.filter((t) => t.priority === filters.advanced.priorityFilter);
  }

  if (filters.advanced.createdByFilter !== TASKS_FILTER_ALL) {
    result = result.filter((t) => t.created_by === filters.advanced.createdByFilter);
  }

  result = result.filter((t) => matchesDueDateFilter(t, filters.advanced.dueDateFilter));

  return sortTasks(result, filters.advanced.sortBy);
}

export function countActiveAdvancedFilters(advanced: TasksAdvancedFilters) {
  let count = 0;
  if (advanced.priorityFilter !== TASKS_FILTER_ALL) count += 1;
  if (advanced.dueDateFilter !== "all") count += 1;
  if (advanced.createdByFilter !== TASKS_FILTER_ALL) count += 1;
  if (advanced.sortBy !== "newest") count += 1;
  return count;
}
