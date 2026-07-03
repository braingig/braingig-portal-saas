import { ArrowRight } from "lucide-react";
import { RECRUIT_SECTION_LINK, RECRUIT_SECTION_TITLE } from "@/components/recruitment/recruitment-styles";

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
};

export function RecruitmentSectionHeader({ title, actionLabel, onAction, showAction = true }: Props) {
  const canShow = showAction && actionLabel && onAction;
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <h2 className={RECRUIT_SECTION_TITLE}>{title}</h2>
      {canShow && (
        <button type="button" onClick={onAction} className={RECRUIT_SECTION_LINK}>
          {actionLabel}
          <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}
