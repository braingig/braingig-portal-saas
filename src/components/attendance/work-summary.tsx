import { AttendanceSectionHeader } from "@/components/attendance/today-summary";
import { CARD_TITLE, COMPACT_CARD } from "@/components/attendance/attendance-styles";
import type { WorkSummary } from "@/lib/attendance/types";
import { formatMinutes, formatTime } from "@/lib/attendance/date-utils";

type Props = {
  summary: WorkSummary;
};

export function WorkSummaryCard({ summary }: Props) {
  const items = [
    { label: "Check In", value: formatTime(summary.checkIn) },
    { label: "Check Out", value: formatTime(summary.checkOut) },
    { label: "Working Hours", value: formatMinutes(summary.workingMinutes) },
    { label: "Break Time", value: formatMinutes(summary.breakMinutes) },
    { label: "Overtime", value: formatMinutes(summary.overtimeMinutes) },
  ];

  return (
    <section>
      <AttendanceSectionHeader title="Today's Work Summary" />
      <div className={COMPACT_CARD}>
        <div className="flex flex-wrap divide-x divide-border/50">
          {items.map((item) => (
            <div key={item.label} className="min-w-[80px] flex-1 px-2.5 py-0.5 first:pl-0 last:pr-0">
              <p className={CARD_TITLE}>{item.label}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
