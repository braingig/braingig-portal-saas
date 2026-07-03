import { EVENT_LABELS } from "@/lib/attendance/constants";
import { formatTime } from "@/lib/attendance/date-utils";
import { SECONDARY_TEXT } from "@/components/attendance/attendance-styles";
import type { AttendanceEvent } from "@/lib/attendance/types";

type Props = {
  events: AttendanceEvent[];
  compact?: boolean;
};

export function AttendanceTimelineList({ events, compact }: Props) {
  if (events.length === 0) {
    return <p className={SECONDARY_TEXT}>No activity recorded today.</p>;
  }

  return (
    <ol className={compact ? "space-y-2" : "space-y-3"}>
      {events.map((ev) => (
        <li key={ev.id} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-[13px] text-muted-foreground">{formatTime(ev.occurred_at)}</span>
          <span className="size-1.5 shrink-0 rounded-full bg-brand" />
          <span className="text-sm">{EVENT_LABELS[ev.event_type] ?? ev.event_type}</span>
        </li>
      ))}
    </ol>
  );
}
