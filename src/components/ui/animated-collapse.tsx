import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared duration for expand/collapse across the app (ms). */
export const COLLAPSE_DURATION_MS = 300;

export const collapseTransitionClass = "duration-300 ease-in-out";

export function collapseChevronClass(open: boolean, className?: string) {
  return cn(
    "transition-transform",
    collapseTransitionClass,
    open && "rotate-180",
    className,
  );
}

type AnimatedCollapseProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Smooth height expand/collapse — keeps children mounted while animating. */
export function AnimatedCollapse({
  open,
  children,
  className,
  contentClassName,
}: AnimatedCollapseProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity]",
        collapseTransitionClass,
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
        className,
      )}
      aria-hidden={!open}
    >
      <div className={cn("min-h-0 overflow-hidden", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
