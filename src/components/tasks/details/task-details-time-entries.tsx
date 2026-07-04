import { format, parseISO } from "date-fns";
import { Timer } from "lucide-react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { TaskPerson } from "@/components/tasks/details/task-person";
import {
  previewTimeEmpty,
  previewTimeTable,
  previewTimeTableHead,
} from "@/components/tasks/preview/task-preview-styles";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskTimeEntryRow } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskDetailsTimeEntriesProps = {
  entries: TaskTimeEntryRow[];
  bare?: boolean;
};

export function TaskDetailsTimeEntries({ entries, bare = false }: TaskDetailsTimeEntriesProps) {
  const content = entries.length === 0 ? (
    <p className={previewTimeEmpty}>No time logged today.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className={cn(previewTimeTable, "min-w-[420px]")}>
        <thead>
          <tr className={previewTimeTableHead}>
            <th className="pr-3 font-medium">Person</th>
            <th className="pr-3 font-medium">Start</th>
            <th className="pr-3 font-medium">End</th>
            <th className="pr-3 font-medium">Duration</th>
            <th className="font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-border/20 last:border-0">
              <td className="py-1.5 pr-3">
                <TaskPerson profile={entry.profile} size="xs" />
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">
                {format(parseISO(entry.started_at), "h:mm a")}
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">
                {entry.ended_at ? format(parseISO(entry.ended_at), "h:mm a") : "—"}
              </td>
              <td className="py-1.5 pr-3 font-mono text-foreground">
                {formatDurationHuman(entry.duration_seconds ?? 0)}
              </td>
              <td className="py-1.5">
                <span
                  className={cn(
                    "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    entry.isActive
                      ? "bg-warning/15 text-warning"
                      : "bg-success/15 text-success",
                  )}
                >
                  {entry.isActive ? "Active" : "Completed"}
                </span>
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
      title="Today's time entries"
      icon={Timer}
      count={entries.length}
    >
      {content}
    </TaskDetailsSection>
  );
}
