import { useMemo } from "react";
import { TaskDetailsDailyTotals } from "@/components/tasks/details/task-details-daily-totals";
import { TaskDetailsTimeEntries } from "@/components/tasks/details/task-details-time-entries";
import { TaskDetailsWorkers } from "@/components/tasks/details/task-details-workers";
import { previewExpandedPanel } from "@/components/tasks/preview/task-preview-styles";
import {
  buildDailyTotals,
  buildWorkerRows,
  getTodayEntries,
} from "@/lib/tasks/time-aggregates";
import { getActiveTaskTimer } from "@/lib/task-timer";
import type { TaskDetailProfile, TaskTimeEntry } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewTimeDetailsProps = {
  taskId: string;
  timeEntries: TaskTimeEntry[];
  profiles: TaskDetailProfile[];
  assigneeIds: string[];
  isTracking: boolean;
  sessionTime: number;
  currentUserId?: string;
  omitWorkers?: boolean;
};

export function TaskPreviewTimeDetails({
  taskId,
  timeEntries,
  profiles,
  assigneeIds,
  isTracking,
  sessionTime,
  currentUserId,
  omitWorkers = false,
}: TaskPreviewTimeDetailsProps) {
  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const liveTimer = useMemo(() => {
    if (!isTracking || !currentUserId) return undefined;
    const active = getActiveTaskTimer();
    if (!active || active.taskId !== taskId) return undefined;
    return {
      userId: currentUserId,
      startedAt: new Date(active.startedAt).toISOString(),
      liveSeconds: sessionTime,
    };
  }, [isTracking, currentUserId, taskId, sessionTime]);

  const workers = useMemo(
    () => buildWorkerRows(
      timeEntries,
      profileMap,
      assigneeIds,
      liveTimer ? { userId: liveTimer.userId, seconds: liveTimer.liveSeconds } : undefined,
    ),
    [timeEntries, profileMap, assigneeIds, liveTimer],
  );

  const todayEntries = useMemo(
    () => getTodayEntries(timeEntries, profileMap, liveTimer),
    [timeEntries, profileMap, liveTimer],
  );

  const weekTotals = useMemo(
    () => buildDailyTotals(timeEntries, profileMap, "week"),
    [timeEntries, profileMap],
  );

  const monthTotals = useMemo(
    () => buildDailyTotals(timeEntries, profileMap, "month"),
    [timeEntries, profileMap],
  );

  return (
    <div className={cn("mt-3 space-y-4", !omitWorkers && "border-t border-border/30 pt-3", previewExpandedPanel)}>
      {!omitWorkers && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Who&apos;s working on this task</p>
          <TaskDetailsWorkers workers={workers} bare />
        </div>
      )}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Today&apos;s time entries</p>
        <TaskDetailsTimeEntries entries={todayEntries} bare />
      </div>
      <TaskDetailsDailyTotals weekTotals={weekTotals} monthTotals={monthTotals} bare />
    </div>
  );
}
