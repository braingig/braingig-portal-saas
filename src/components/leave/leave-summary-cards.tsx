import {
  LEAVE_CARD_LABEL,
  LEAVE_CARD_VALUE_SM,
  LEAVE_DENSE_CARD,
  LEAVE_SECTION_TITLE,
} from "@/components/leave/leave-styles";
import type { LeaveOverview } from "@/lib/leave/types";
import { cn } from "@/lib/utils";

const CARDS = [
  { key: "pending" as const, label: "Pending", color: "text-warning" },
  { key: "approved" as const, label: "Approved", color: "text-success" },
  { key: "rejected" as const, label: "Rejected", color: "text-danger" },
  { key: "onLeaveToday" as const, label: "On Leave Today", color: "text-brand" },
];

type Props = {
  overview: LeaveOverview;
};

export function LeaveSummaryCards({ overview }: Props) {
  return (
    <section>
      <h2 className={cn(LEAVE_SECTION_TITLE, "mb-1.5")}>Leave Overview</h2>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
        {CARDS.map((card) => (
          <div key={card.key} className={LEAVE_DENSE_CARD}>
            <p className={LEAVE_CARD_LABEL}>{card.label}</p>
            <p className={cn(LEAVE_CARD_VALUE_SM, "mt-0.5", card.color)}>{overview[card.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
