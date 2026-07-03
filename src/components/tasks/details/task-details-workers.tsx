import { Users } from "lucide-react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { TaskPerson } from "@/components/tasks/details/task-person";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskWorkerRow } from "@/lib/tasks/types";

type TaskDetailsWorkersProps = {
  workers: TaskWorkerRow[];
  bare?: boolean;
};

export function TaskDetailsWorkers({ workers, bare = false }: TaskDetailsWorkersProps) {
  const content = workers.length === 0 ? (
    <p className="text-sm text-muted-foreground">No one has logged time on this task yet.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] text-sm">
        <thead>
          <tr className="border-b border-border/30 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 pr-4 font-semibold">Person</th>
            <th className="pb-2 text-right font-semibold">Total time</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((row) => (
            <tr key={row.profile.id} className="border-b border-border/20 last:border-0">
              <td className="py-2.5 pr-4">
                <TaskPerson profile={row.profile} size="sm" />
              </td>
              <td className="py-2.5 text-right font-mono text-sm font-medium text-foreground">
                {formatDurationHuman(row.totalSeconds)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (bare) return content;

  return (
    <TaskDetailsSection
      title="Who's working on this task"
      icon={Users}
      description="Assignees and everyone who has logged time. Total time per person."
    >
      {content}
    </TaskDetailsSection>
  );
}
