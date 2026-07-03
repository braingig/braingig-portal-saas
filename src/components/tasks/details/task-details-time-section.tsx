import { useMemo } from "react";
import { TaskDetailsDailyTotals } from "@/components/tasks/details/task-details-daily-totals";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { TaskDetailsTimeCard } from "@/components/tasks/details/task-details-time-card";
import { TaskDetailsTimeEntries } from "@/components/tasks/details/task-details-time-entries";
import { TaskDetailsWorkers } from "@/components/tasks/details/task-details-workers";
import {
  buildDailyTotals,
  buildWorkerRows,
  getTodayEntries,
} from "@/lib/tasks/time-aggregates";
import { getActiveTaskTimer } from "@/lib/task-timer";
import type { TaskDetailProfile, TaskTimeEntry } from "@/lib/tasks/types";

type TaskDetailsTimeSectionProps = {
  taskId: string;
  timeEntries: TaskTimeEntry[];
  profiles: TaskDetailProfile[];
  assigneeIds: string[];
  trackedTotal: number;
  isTracking: boolean;
  sessionTime: number;
  isAssignee: boolean;
  currentUserId?: string;
  onToggleTimer: () => void;
};

export function TaskDetailsTimeSection({
  taskId,
  timeEntries,
  profiles,
  assigneeIds,
  trackedTotal,
  isTracking,
  sessionTime,
  isAssignee,
  currentUserId,
  onToggleTimer,
}: TaskDetailsTimeSectionProps) {
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
    <TaskDetailsSection
      id="time-tracking"
      title="Time tracking"
      description="Log time, review who worked on this task, and see daily totals."
    >
      <div className="space-y-6">
        <TaskDetailsTimeCard
          totalSeconds={trackedTotal}
          isTracking={isTracking}
          sessionSeconds={sessionTime}
          canStartTimer={isAssignee}
          onToggleTimer={onToggleTimer}
          bare
        />

        <div className="space-y-5 border-t border-border pt-5">
          <TaskDetailsWorkers workers={workers} bare />
          <TaskDetailsTimeEntries entries={todayEntries} bare />
          <TaskDetailsDailyTotals weekTotals={weekTotals} monthTotals={monthTotals} bare />
        </div>
      </div>
    </TaskDetailsSection>
  );
}
