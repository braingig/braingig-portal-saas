import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { previewHint } from "@/components/tasks/preview/task-preview-styles";

type TaskPreviewHintProps = {
  label: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

export function TaskPreviewHint({ label, children, side = "top" }: TaskPreviewHintProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex max-w-full">{children}</span>
        </TooltipTrigger>
        <TooltipContent side={side} sideOffset={6} className={previewHint}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function timerHintLabel(isTracking: boolean, canStartTimer: boolean) {
  if (isTracking) return "Stop timer";
  if (canStartTimer) return "Start timer";
  return "Assignees only";
}
