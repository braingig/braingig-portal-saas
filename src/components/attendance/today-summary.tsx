import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CARD_TITLE, CARD_VALUE, COMPACT_CARD, SECTION_TITLE } from "@/components/attendance/attendance-styles";
import type { TodaySummary } from "@/lib/attendance/types";
import { cn } from "@/lib/utils";

const CARDS = [
  { key: "present" as const, label: "Present", color: "text-success" },
  { key: "absent" as const, label: "Absent", color: "text-danger" },
  { key: "late" as const, label: "Late", color: "text-warning" },
  { key: "onLeave" as const, label: "On Leave", color: "text-brand" },
  { key: "currentlyWorking" as const, label: "Working", color: "text-foreground" },
];

type Props = {
  summary: TodaySummary;
  title?: string;
};

export function TodaySummaryCards({ summary, title = "Today's Summary" }: Props) {
  return (
    <section>
      <h2 className={cn(SECTION_TITLE, "mb-1.5")}>{title}</h2>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-5">
        {CARDS.map((card) => (
          <div key={card.key} className={COMPACT_CARD}>
            <p className={CARD_TITLE}>{card.label}</p>
            <p className={cn(CARD_VALUE, "mt-0.5", card.color)}>{summary[card.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AttendanceSectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <h2 className={SECTION_TITLE}>{title}</h2>
      {actionLabel && onAction && (
        <Button variant="ghost" size="sm" onClick={onAction} className="h-7 gap-1 px-2 text-xs text-brand hover:text-brand">
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
