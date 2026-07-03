import { Clock, Play, Square } from "lucide-react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { formatDurationHuman } from "@/lib/task-timer";

type TaskDetailsTimeCardProps = {
  totalSeconds: number;
  isTracking: boolean;
  sessionSeconds: number;
  canStartTimer: boolean;
  onToggleTimer: () => void;
  bare?: boolean;
};

export function TaskDetailsTimeCard({
  totalSeconds,
  isTracking,
  sessionSeconds,
  canStartTimer,
  onToggleTimer,
  bare = false,
}: TaskDetailsTimeCardProps) {
  const canUseTimer = isTracking || canStartTimer;

  const content = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs text-muted-foreground">
          Total logged:{" "}
          <span className="font-medium text-foreground">
            {formatDurationHuman(totalSeconds)}
          </span>
        </p>
        {isTracking && (
          <p className="mt-1 text-xs font-medium text-success">
            Timer running for this task… ({formatDurationHuman(sessionSeconds)})
          </p>
        )}
        {!canStartTimer && !isTracking && (
          <p className="mt-1 text-xs text-muted-foreground">
            Only assigned team members can start the timer.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onToggleTimer}
        disabled={!canUseTimer}
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
          isTracking
            ? "bg-danger text-danger-foreground hover:brightness-110"
            : "bg-brand text-brand-foreground hover:brightness-110"
        }`}
      >
        {isTracking ? (
          <>
            <Square className="size-4" />
            Stop
          </>
        ) : (
          <>
            <Play className="size-4" />
            Start timer
          </>
        )}
      </button>
    </div>
  );

  if (bare) return content;

  return (
    <TaskDetailsSection id="time-tracking" title="Time tracking" icon={Clock}>
      {content}
    </TaskDetailsSection>
  );
}
