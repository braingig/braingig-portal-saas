export function countOpenTasks(tasks: { status: string }[]) {
  return tasks.filter((t) => t.status !== "done").length;
}

export function countDoneTasks(tasks: { status: string }[]) {
  return tasks.filter((t) => t.status === "done").length;
}
