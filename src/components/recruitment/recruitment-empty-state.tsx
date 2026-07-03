import { RECRUIT_EMPTY_INSET, RECRUIT_SECONDARY } from "@/components/recruitment/recruitment-styles";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
};

export function RecruitmentEmptyState({ title, description }: Props) {
  return (
    <div className={RECRUIT_EMPTY_INSET}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className={cn(RECRUIT_SECONDARY, "mt-0.5")}>{description}</p>
    </div>
  );
}
