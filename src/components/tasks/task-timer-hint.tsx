import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTimerHintLabel } from "@/lib/tasks/toggle-task-timer";
import { cn } from "@/lib/utils";

type TaskTimerHintProps = {
  isTracking: boolean;
  isAssignee: boolean;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  contentClassName?: string;
};

export function TaskTimerHint({
  isTracking,
  isAssignee,
  children,
  side = "top",
  contentClassName,
}: TaskTimerHintProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex max-w-full">{children}</span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 max-w-[220px] rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs font-normal leading-snug text-muted-foreground shadow-sm",
            contentClassName,
          )}
        >
          {getTimerHintLabel(isTracking, isAssignee)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
