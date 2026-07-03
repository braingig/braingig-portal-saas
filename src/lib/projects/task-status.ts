export function countOpenTasks(tasks: { status: string }[]) {
  return tasks.filter((t) => t.status !== "done").length;
}
