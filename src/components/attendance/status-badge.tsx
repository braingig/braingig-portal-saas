import type { AttendanceStatus } from "@/lib/attendance/constants";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/attendance/constants";
import { cn } from "@/lib/utils";

type Props = {
  status: AttendanceStatus | string;
  className?: string;
  suffix?: string;
};

export function AttendanceStatusBadge({ status, className, suffix }: Props) {
  const key = status as AttendanceStatus;
  const style = STATUS_STYLES[key] ?? "bg-muted text-muted-foreground";
  const label = STATUS_LABELS[key] ?? status;

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", style, className)}>
      {label}
      {suffix ? ` · ${suffix}` : ""}
    </span>
  );
}
