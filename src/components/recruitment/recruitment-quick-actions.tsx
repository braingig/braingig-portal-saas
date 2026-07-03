import { Briefcase, Calendar, Kanban, UserPlus } from "lucide-react";
import { RecruitmentSectionHeader } from "@/components/recruitment/recruitment-section-header";
import { RECRUIT_COMPACT_CARD, RECRUIT_SECONDARY } from "@/components/recruitment/recruitment-styles";
import { cn } from "@/lib/utils";

type Action = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
};

type Props = {
  onCreateJob: () => void;
  onAddCandidate: () => void;
  onScheduleInterview: () => void;
  onOpenPipeline: () => void;
  canManage?: boolean;
};

export function RecruitmentQuickActions({
  onCreateJob,
  onAddCandidate,
  onScheduleInterview,
  onOpenPipeline,
  canManage = true,
}: Props) {
  if (!canManage) return null;

  const actions: Action[] = [
    {
      id: "create-job",
      title: "Create Job",
      description: "Post a new open role",
      icon: <Briefcase className="size-4 text-brand" />,
      onClick: onCreateJob,
    },
    {
      id: "add-candidate",
      title: "Add Candidate",
      description: "Add someone to the pipeline",
      icon: <UserPlus className="size-4 text-brand" />,
      onClick: onAddCandidate,
    },
    {
      id: "schedule-interview",
      title: "Schedule Interview",
      description: "Book an upcoming interview",
      icon: <Calendar className="size-4 text-brand" />,
      onClick: onScheduleInterview,
    },
    {
      id: "open-pipeline",
      title: "Open Pipeline",
      description: "Browse hiring stages",
      icon: <Kanban className="size-4 text-brand" />,
      onClick: onOpenPipeline,
    },
  ];

  return (
    <section>
      <RecruitmentSectionHeader title="Quick Actions" showAction={false} />
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={cn(
              RECRUIT_COMPACT_CARD,
              "group flex w-full cursor-pointer items-center gap-3 py-2.5 text-left transition-colors",
              "hover:border-brand/30 hover:bg-brand/[0.03]",
            )}
          >
            <div className="rounded-md bg-brand/10 p-1.5 transition-colors group-hover:bg-brand/15">
              {action.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{action.title}</p>
              <p className={RECRUIT_SECONDARY}>{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
