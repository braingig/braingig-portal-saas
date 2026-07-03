import { format, parseISO } from "date-fns";
import { Timer } from "lucide-react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { TaskPerson } from "@/components/tasks/details/task-person";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskTimeEntryRow } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskDetailsTimeEntriesProps = {
  entries: TaskTimeEntryRow[];
};

export function TaskDetailsTimeEntries({ entries }: TaskDetailsTimeEntriesProps) {
  return (
    <TaskDetailsSection
      title="Today's time entries"
      icon={Timer}
      count={entries.length}
    >
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No time logged today.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3 font-semibold">Person</th>
                <th className="pb-2 pr-3 font-semibold">Start</th>
                <th className="pb-2 pr-3 font-semibold">End</th>
                <th className="pb-2 pr-3 font-semibold">Duration</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-3">
                    <TaskPerson profile={entry.profile} size="sm" />
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {format(parseISO(entry.started_at), "h:mm a")}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {entry.ended_at ? format(parseISO(entry.ended_at), "h:mm a") : "—"}
                  </td>
                  <td className="py-3 pr-3 font-mono text-foreground">
                    {formatDurationHuman(entry.duration_seconds ?? 0)}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
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
      )}
    </TaskDetailsSection>
  );
}
