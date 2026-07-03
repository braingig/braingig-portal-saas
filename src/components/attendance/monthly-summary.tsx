import { AttendanceSectionHeader } from "@/components/attendance/today-summary";
import { CARD_TITLE, CARD_VALUE, COMPACT_CARD, SECONDARY_TEXT } from "@/components/attendance/attendance-styles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMinutes } from "@/lib/attendance/date-utils";
import type { MonthlySummary } from "@/lib/attendance/types";
import { cn } from "@/lib/utils";

type PreviewProps = {
  summary: MonthlySummary;
  monthLabel: string;
  onViewAll: () => void;
};

export function MonthlySummaryPreview({ summary, monthLabel, onViewAll }: PreviewProps) {
  const cards = [
    { label: "Working Days", value: summary.workingDays },
    { label: "Present", value: summary.present },
    { label: "Late", value: summary.late },
    { label: "Absent", value: summary.absent },
  ];

  return (
    <section>
      <AttendanceSectionHeader title={`Monthly Summary · ${monthLabel}`} actionLabel="View Monthly Summary" onAction={onViewAll} />
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={COMPACT_CARD}>
            <p className={CARD_TITLE}>{card.label}</p>
            <p className={cn(CARD_VALUE, "mt-0.5 text-xl")}>{card.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: MonthlySummary;
  monthLabel: string;
};

export function MonthlySummaryDrawer({ open, onOpenChange, summary, monthLabel }: DrawerProps) {
  const detailCards = [
    { label: "Leave", value: summary.leave },
    { label: "Weekend", value: summary.weekend },
    { label: "Holiday", value: summary.holiday },
    { label: "Total Hours", value: formatMinutes(summary.totalWorkingMinutes) },
    { label: "Avg Hours", value: formatMinutes(summary.averageWorkingMinutes) },
  ];

  const breakdown = [
    { label: "Working Days", value: summary.workingDays },
    { label: "Present", value: summary.present },
    { label: "Late", value: summary.late },
    { label: "Absent", value: summary.absent },
    ...detailCards,
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base font-semibold">Monthly Summary</SheetTitle>
          <SheetDescription className="text-xs">{monthLabel}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-2 gap-1.5">
          {detailCards.map((card) => (
            <div key={card.label} className={COMPACT_CARD}>
              <p className={CARD_TITLE}>{card.label}</p>
              <p className="text-lg font-semibold">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-1.5 text-sm font-medium">Monthly Breakdown</p>
          <div className="divide-y divide-border/60 rounded-lg border border-border">
            {breakdown.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-3 py-1.5">
                <span className={SECONDARY_TEXT}>{row.label}</span>
                <span className="text-sm font-medium tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
