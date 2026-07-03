import { LEAVE_STATUS_LABELS, LEAVE_STATUS_STYLES } from "@/lib/leave/constants";
import type { LeaveStatus } from "@/lib/leave/types";
import { cn } from "@/lib/utils";

type Props = {
  status: LeaveStatus | string;
  className?: string;
};

export function LeaveStatusBadge({ status, className }: Props) {
  const key = status as LeaveStatus;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        LEAVE_STATUS_STYLES[key] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {LEAVE_STATUS_LABELS[key] ?? status}
    </span>
  );
}
