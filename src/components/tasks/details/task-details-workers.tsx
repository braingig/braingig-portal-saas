import { Users } from "lucide-react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { TaskPerson } from "@/components/tasks/details/task-person";
import {
  previewTimeEmpty,
  previewTimeTable,
  previewTimeTableHead,
} from "@/components/tasks/preview/task-preview-styles";
import { cn } from "@/lib/utils";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskWorkerRow } from "@/lib/tasks/types";

type TaskDetailsWorkersProps = {
  workers: TaskWorkerRow[];
  bare?: boolean;
};

export function TaskDetailsWorkers({ workers, bare = false }: TaskDetailsWorkersProps) {
  const content = workers.length === 0 ? (
    <p className={previewTimeEmpty}>No one has logged time on this task yet.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className={cn(previewTimeTable, "min-w-[240px]")}>
        <thead>
          <tr className={previewTimeTableHead}>
            <th className="pr-3 font-medium">Person</th>
            <th className="text-right font-medium">Total time</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((row) => (
            <tr key={row.profile.id} className="border-b border-border/20 last:border-0">
              <td className="py-1.5 pr-3">
                <TaskPerson profile={row.profile} size="xs" />
              </td>
              <td className="py-1.5 text-right font-mono text-xs text-foreground">
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
