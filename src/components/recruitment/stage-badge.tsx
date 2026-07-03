import { STAGE_LABELS, STAGE_STYLES } from "@/lib/recruitment/constants";
import { cn } from "@/lib/utils";

type Props = {
  stage: string;
  className?: string;
};

export function StageBadge({ stage, className }: Props) {
  const label = STAGE_LABELS[stage] ?? stage;
  const style = STAGE_STYLES[stage] ?? STAGE_STYLES.applied;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
