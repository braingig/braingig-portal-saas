import { format, parseISO } from "date-fns";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskDailyTotal } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskDetailsDailyTotalsProps = {
  weekTotals: TaskDailyTotal[];
  monthTotals: TaskDailyTotal[];
};

export function TaskDetailsDailyTotals({ weekTotals, monthTotals }: TaskDetailsDailyTotalsProps) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const totals = period === "week" ? weekTotals : monthTotals;

  return (
    <TaskDetailsSection
      title="Daily totals"
      icon={BarChart3}
      actions={
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          {(["week", "month"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                period === key
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {key === "week" ? "This week" : "This month"}
            </button>
          ))}
        </div>
      }
    >
      {totals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No time entries in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3 font-semibold">Date</th>
                <th className="pb-2 pr-3 font-semibold">Day</th>
                <th className="pb-2 pr-3 font-semibold">Total time</th>
                <th className="pb-2 pr-3 font-semibold">Entries</th>
                <th className="pb-2 font-semibold">By assignee</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((row) => (
                <tr key={row.date} className="border-b border-border align-top last:border-0">
                  <td className="py-3 pr-3 text-foreground">
                    {format(parseISO(row.date), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{row.dayLabel}</td>
                  <td className="py-3 pr-3 font-mono font-medium text-foreground">
                    {formatDurationHuman(row.totalSeconds)}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{row.entryCount}</td>
                  <td className="py-3">
                    <div className="space-y-1.5">
                      {row.byPerson.map((person) => (
                        <div
                          key={person.profile.id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="truncate text-foreground">{person.profile.full_name}</span>
                          <span className="shrink-0 font-mono text-muted-foreground">
                            {formatDurationHuman(person.seconds)}
                          </span>
                        </div>
                      ))}
                    </div>
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
