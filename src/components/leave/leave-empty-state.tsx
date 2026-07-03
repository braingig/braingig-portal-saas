import { LEAVE_EMPTY_INSET, LEAVE_SECONDARY } from "@/components/leave/leave-styles";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
};

export function LeaveCompactEmptyState({ title, description }: Props) {
  return (
    <div className={LEAVE_EMPTY_INSET}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className={cn(LEAVE_SECONDARY, "mt-0.5")}>{description}</p>
    </div>
  );
}
