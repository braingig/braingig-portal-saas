import {
  RECRUIT_CARD_LABEL,
  RECRUIT_CARD_VALUE_SM,
  RECRUIT_DENSE_CARD,
  RECRUIT_SECTION_TITLE,
} from "@/components/recruitment/recruitment-styles";
import type { RecruitmentOverview } from "@/lib/recruitment/types";
import { cn } from "@/lib/utils";

const CARDS = [
  { key: "openJobs" as const, label: "Open Jobs", color: "text-brand" },
  { key: "totalCandidates" as const, label: "Total Candidates", color: "text-foreground" },
  { key: "interviewsScheduled" as const, label: "Interviews Scheduled", color: "text-warning" },
  { key: "offersSent" as const, label: "Offers Sent", color: "text-purple-600 dark:text-purple-400" },
  { key: "hired" as const, label: "Hired", color: "text-success" },
];

type Props = {
  overview: RecruitmentOverview;
};

export function RecruitmentSummaryCards({ overview }: Props) {
  return (
    <section>
      <h2 className={cn(RECRUIT_SECTION_TITLE, "mb-1.5")}>Overview</h2>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-5">
        {CARDS.map((card) => (
          <div key={card.key} className={RECRUIT_DENSE_CARD}>
            <p className={RECRUIT_CARD_LABEL}>{card.label}</p>
            <p className={cn(RECRUIT_CARD_VALUE_SM, "mt-0.5", card.color)}>{overview[card.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
