import { CheckCircle2, CircleDashed, FolderKanban, ListTodo } from "lucide-react";
import { tasksCardLabel, tasksMeta, tasksRowHover } from "@/components/tasks/tasks-page-styles";
import { countOpenTasks } from "@/lib/tasks/status";
import type { TaskListItem } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TasksOverviewStatsProps = {
  tasks: TaskListItem[];
  projectCount: number;
};

export function TasksOverviewStats({ tasks, projectCount }: TasksOverviewStatsProps) {
  const open = countOpenTasks(tasks);
  const done = tasks.filter((t) => t.status === "done").length;

  const stats = [
    { label: "Total tasks", value: tasks.length, icon: ListTodo },
    { label: "Open", value: open, icon: CircleDashed },
    { label: "Completed", value: done, icon: CheckCircle2 },
    { label: "Projects", value: projectCount, icon: FolderKanban },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className={cn(
            "rounded-lg border border-border/60 bg-card px-3 py-2.5",
            tasksRowHover,
          )}
        >
          <div className="flex items-center gap-1.5">
            <Icon className="size-4 shrink-0 text-muted-foreground/70" strokeWidth={1.75} />
            <span className={tasksCardLabel}>{label}</span>
          </div>
          <p className="mt-1 text-xl font-normal tracking-tight text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}
