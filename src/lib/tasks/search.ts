import type { TaskListItem } from "@/lib/tasks/types";

export function normalizeTaskSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function taskTitleMatchesSearch(title: string, query: string): boolean {
  const q = normalizeTaskSearchQuery(query);
  if (!q) return false;
  return title.toLowerCase().includes(q);
}

export function taskOrSubtasksMatchSearch(
  task: TaskListItem,
  subtasks: TaskListItem[] | undefined,
  query: string,
): boolean {
  const q = normalizeTaskSearchQuery(query);
  if (!q) return true;
  if (taskTitleMatchesSearch(task.title, query)) return true;
  return (subtasks ?? []).some((s) => taskTitleMatchesSearch(s.title, query));
}

/** 0 = direct title match, 1 = subtask match only, 2 = no match */
export function taskSearchMatchRank(
  task: TaskListItem,
  subtasks: TaskListItem[] | undefined,
  query: string,
): number {
  const q = normalizeTaskSearchQuery(query);
  if (!q) return 0;
  if (taskTitleMatchesSearch(task.title, query)) return 0;
  if ((subtasks ?? []).some((s) => taskTitleMatchesSearch(s.title, query))) return 1;
  return 2;
}

export function sortTasksForSearch(
  tasks: TaskListItem[],
  subtasksByParent: Map<string, TaskListItem[]>,
  query: string,
): TaskListItem[] {
  const q = normalizeTaskSearchQuery(query);
  if (!q) return tasks;
  return [...tasks].sort(
    (a, b) =>
      taskSearchMatchRank(a, subtasksByParent.get(a.id), query) -
      taskSearchMatchRank(b, subtasksByParent.get(b.id), query),
  );
}

export function filterTasksForSearch(
  tasks: TaskListItem[],
  subtasksByParent: Map<string, TaskListItem[]>,
  query: string,
): TaskListItem[] {
  const q = normalizeTaskSearchQuery(query);
  if (!q) return tasks;
  const matched = tasks.filter((t) => taskOrSubtasksMatchSearch(t, subtasksByParent.get(t.id), query));
  return sortTasksForSearch(matched, subtasksByParent, query);
}

export function filterSubtasksForSearch(subtasks: TaskListItem[], query: string): TaskListItem[] {
  const q = normalizeTaskSearchQuery(query);
  if (!q) return subtasks;
  return subtasks.filter((s) => taskTitleMatchesSearch(s.title, query));
}

export function groupHasSearchMatch(
  tasks: TaskListItem[],
  subtasksByParent: Map<string, TaskListItem[]>,
  query: string,
): boolean {
  const q = normalizeTaskSearchQuery(query);
  if (!q) return true;
  return tasks.some((t) => taskOrSubtasksMatchSearch(t, subtasksByParent.get(t.id), query));
}

export function groupSearchMatchRank(
  tasks: TaskListItem[],
  subtasksByParent: Map<string, TaskListItem[]>,
  query: string,
): number {
  const q = normalizeTaskSearchQuery(query);
  if (!q) return 0;
  let best = 2;
  for (const task of tasks) {
    best = Math.min(best, taskSearchMatchRank(task, subtasksByParent.get(task.id), query));
  }
  return best;
}
