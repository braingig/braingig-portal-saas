import { Coffee, LogIn, LogOut, Pause } from "lucide-react";
import { ClockStatusBadge } from "@/components/attendance/clock-status-badge";
import { COMPACT_CARD, SECONDARY_TEXT, SECTION_TITLE } from "@/components/attendance/attendance-styles";
import { Button } from "@/components/ui/button";
import type { ClockState } from "@/lib/attendance/constants";
import { cn } from "@/lib/utils";

type Props = {
  clockState: ClockState;
  onClockIn: () => void;
  onClockOut: () => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
  busy?: boolean;
  onLeave?: boolean;
};

export function ClockPanel({
  clockState,
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  busy,
  onLeave,
}: Props) {
  const canClockIn = !onLeave && clockState === "not_started";
  const canClockOut = clockState === "working" || clockState === "on_break";
  const canStartBreak = clockState === "working";
  const canEndBreak = clockState === "on_break";

  return (
    <section className={cn(COMPACT_CARD, "py-2.5")}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className={SECTION_TITLE}>Clock In / Out</h2>
        <ClockStatusBadge state={clockState} onLeave={onLeave} />
      </div>

      {onLeave && (
        <p className={cn(SECONDARY_TEXT, "mb-2 rounded-md border border-brand/20 bg-brand/5 px-2 py-1 text-brand")}>
          Approved leave today — clock in disabled.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" onClick={onClockIn} disabled={busy || !canClockIn} className="h-8 bg-success text-white hover:bg-success/90">
          <LogIn className="size-3.5" />
          Clock In
        </Button>
        <Button size="sm" onClick={onClockOut} disabled={busy || !canClockOut} variant="destructive" className="h-8">
          <LogOut className="size-3.5" />
          Clock Out
        </Button>
        <Button size="sm" onClick={onStartBreak} disabled={busy || !canStartBreak} variant="outline" className="h-8">
          <Coffee className="size-3.5" />
          Break
        </Button>
        <Button size="sm" onClick={onEndBreak} disabled={busy || !canEndBreak} variant="outline" className="h-8">
          <Pause className="size-3.5" />
          End Break
        </Button>
      </div>
    </section>
  );
}
