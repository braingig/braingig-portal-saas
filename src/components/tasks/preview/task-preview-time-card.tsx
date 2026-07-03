import { Play, Square } from "lucide-react";
import { TaskPreviewHint, timerHintLabel } from "@/components/tasks/preview/task-preview-hint";
import { previewFieldValue, previewMeta } from "@/components/tasks/preview/task-preview-styles";
import { formatDurationHuman } from "@/lib/task-timer";
import { cn } from "@/lib/utils";

type TaskPreviewTimeCardProps = {
  totalSeconds: number;
  isTracking: boolean;
  sessionSeconds: number;
  canStartTimer: boolean;
  onToggleTimer: () => void;
};

export function TaskPreviewTimeCard({
  totalSeconds,
  isTracking,
  sessionSeconds,
  canStartTimer,
  onToggleTimer,
}: TaskPreviewTimeCardProps) {
  const canUseTimer = isTracking || canStartTimer;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className={previewMeta}>
          Total logged:{" "}
          <span className={cn("text-foreground", previewFieldValue)}>
            {formatDurationHuman(totalSeconds)}
          </span>
        </p>
        {isTracking && (
          <p className="mt-0.5 text-[12px] text-success">
            Running ({formatDurationHuman(sessionSeconds)})
          </p>
        )}
        {/* {!canStartTimer && !isTracking && (
          <p className={cn("mt-0.5", previewMeta)}>Assignees only</p>
        )} */}
      </div>
      <TaskPreviewHint label={timerHintLabel(isTracking, canStartTimer)} side="left">
        <button
          type="button"
          onClick={onToggleTimer}
          disabled={!canUseTimer}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] transition-all disabled:cursor-not-allowed disabled:opacity-50",
            isTracking
              ? "bg-danger text-danger-foreground hover:brightness-110"
              : "bg-brand text-brand-foreground hover:brightness-110",
          )}
        >
          {isTracking ? (
            <>
              <Square className="size-3" />
              Stop
            </>
          ) : (
            <>
              <Play className="size-3" />
              Start timer
            </>
          )}
        </button>
      </TaskPreviewHint>
    </div>
  );
}
