import { Badge } from "@/components/ui/badge";
import type { ClockState } from "@/lib/attendance/constants";
import { CLOCK_STATE_LABELS } from "@/lib/attendance/constants";
import { cn } from "@/lib/utils";

const CONFIG: Record<ClockState, { dot: string; badge: string }> = {
  working: { dot: "bg-success", badge: "border-success/20 bg-success/10 text-success" },
  on_break: { dot: "bg-warning", badge: "border-warning/20 bg-warning/10 text-warning" },
  not_started: { dot: "bg-muted-foreground/50", badge: "border-border bg-muted/40 text-muted-foreground" },
  checked_out: { dot: "bg-danger", badge: "border-danger/20 bg-danger/10 text-danger" },
  on_leave: { dot: "bg-brand", badge: "border-brand/20 bg-brand/10 text-brand" },
};

type Props = {
  state: ClockState;
  onLeave?: boolean;
};

export function ClockStatusBadge({ state, onLeave }: Props) {
  const key = onLeave ? "on_leave" : state;
  const label = onLeave ? "On Leave" : CLOCK_STATE_LABELS[state];
  const { dot, badge } = CONFIG[key];

  return (
    <Badge variant="outline" className={cn("gap-1.5 border px-2 py-0.5 text-[11px] font-medium normal-case", badge)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
      {label}
    </Badge>
  );
}
