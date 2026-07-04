import { format, parseISO } from "date-fns";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import {
  previewTimeEmpty,
  previewTimeTable,
  previewTimeTableHead,
} from "@/components/tasks/preview/task-preview-styles";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskDailyTotal } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskDetailsDailyTotalsProps = {
  weekTotals: TaskDailyTotal[];
  monthTotals: TaskDailyTotal[];
  bare?: boolean;
};

export function TaskDetailsDailyTotals({ weekTotals, monthTotals, bare = false }: TaskDetailsDailyTotalsProps) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const totals = period === "week" ? weekTotals : monthTotals;

  const periodToggle = (
    <div className="inline-flex rounded-md border border-border/40 bg-surface p-0.5">
      {(["week", "month"] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setPeriod(key)}
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
            period === key
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {key === "week" ? "This week" : "This month"}
        </button>
      ))}
    </div>
  );

  const content = totals.length === 0 ? (
    <p className={previewTimeEmpty}>No time entries in this period.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className={cn(previewTimeTable, "min-w-[480px]")}>
        <thead>
          <tr className={previewTimeTableHead}>
            <th className="pr-3 font-medium">Date</th>
            <th className="pr-3 font-medium">Day</th>
            <th className="pr-3 font-medium">Total time</th>
            <th className="pr-3 font-medium">Entries</th>
            <th className="font-medium">By assignee</th>
          </tr>
        </thead>
        <tbody>
          {totals.map((row) => (
            <tr key={row.date} className="border-b border-border/20 align-top last:border-0">
              <td className="py-1.5 pr-3 text-foreground">
                {format(parseISO(row.date), "MMM d, yyyy")}
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">{row.dayLabel}</td>
              <td className="py-1.5 pr-3 font-mono text-foreground">
                {formatDurationHuman(row.totalSeconds)}
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">{row.entryCount}</td>
              <td className="py-1.5">
                <div className="space-y-0.5">
                  {row.byPerson.map((person) => (
                    <div
                      key={person.profile.id}
                      className="flex items-center justify-between gap-2 text-[11px]"
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
  );

  if (bare) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-muted-foreground">Daily totals</p>
          {periodToggle}
        </div>
        {content}
      </div>
    );
  }

  return (
    <TaskDetailsSection
      title="Daily totals"
      icon={BarChart3}
      actions={periodToggle}
    >
      {content}
    </TaskDetailsSection>
  );
}
