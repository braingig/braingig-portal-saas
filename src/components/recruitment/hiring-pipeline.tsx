import { RecruitmentEmptyState } from "@/components/recruitment/recruitment-empty-state";
import { RecruitmentSectionHeader } from "@/components/recruitment/recruitment-section-header";
import {
  RECRUIT_DENSE_CARD,
  RECRUIT_DENSE_CARD_INTERACTIVE,
  RECRUIT_SECONDARY,
} from "@/components/recruitment/recruitment-styles";
import { StageBadge } from "@/components/recruitment/stage-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PIPELINE_STAGES, STAGE_LABELS } from "@/lib/recruitment/constants";
import { candidateInitials, groupCandidatesByPipelineStage } from "@/lib/recruitment/calculations";
import type { Candidate } from "@/lib/recruitment/types";
import { cn } from "@/lib/utils";

type PreviewProps = {
  candidates: Candidate[];
  onStageClick: (stage: string) => void;
  onOpenPipeline: () => void;
};

function AvatarStack({ candidates }: { candidates: Candidate[] }) {
  const shown = candidates.slice(0, 3);
  if (!shown.length) return null;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((c) => (
        <span
          key={c.id}
          className="inline-flex size-5 items-center justify-center rounded-full border border-background bg-muted text-[9px] font-medium text-muted-foreground"
          title={c.full_name}
        >
          {candidateInitials(c.full_name)}
        </span>
      ))}
    </div>
  );
}

export function HiringPipelinePreview({ candidates, onStageClick, onOpenPipeline }: PreviewProps) {
  const grouped = groupCandidatesByPipelineStage(candidates);
  const hasAny = PIPELINE_STAGES.some((s) => grouped[s].length > 0);

  return (
    <section>
      <RecruitmentSectionHeader title="Hiring Pipeline" actionLabel="View All" onAction={onOpenPipeline} />
      <div className={hasAny ? RECRUIT_DENSE_CARD : "rounded-lg border border-border bg-card shadow-sm"}>
        {!hasAny ? (
          <RecruitmentEmptyState
            title="No candidates in pipeline."
            description="Add candidates to start tracking hiring progress."
          />
        ) : (
          <div className="grid grid-cols-2 gap-1.5 p-1.5 sm:grid-cols-3 lg:grid-cols-5">
            {PIPELINE_STAGES.map((stage) => {
              const list = grouped[stage];
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => onStageClick(stage)}
                  className={cn(RECRUIT_DENSE_CARD_INTERACTIVE, "rounded-md px-2 py-2")}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {STAGE_LABELS[stage]}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold leading-none">{list.length}</p>
                  <div className="mt-1.5 flex min-h-5 items-center">
                    <AvatarStack candidates={list} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: string | null;
  candidates: Candidate[];
  onSelect: (candidate: Candidate) => void;
};

export function PipelineStageDrawer({ open, onOpenChange, stage, candidates, onSelect }: DrawerProps) {
  const grouped = groupCandidatesByPipelineStage(candidates);
  const list = stage ? grouped[stage] ?? [] : [];
  const title = stage ? STAGE_LABELS[stage] ?? stage : "Pipeline";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {list.length} candidate{list.length === 1 ? "" : "s"} in this stage.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 divide-y divide-border rounded-lg border border-border">
          {list.length === 0 ? (
            <RecruitmentEmptyState title="No candidates." description="No one is in this stage yet." />
          ) : (
            list.map((c) => (
              <button
                key={c.id}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                onClick={() => onSelect(c)}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {candidateInitials(c.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.full_name}</p>
                  <p className={RECRUIT_SECONDARY}>{c.job_title ?? "No position"}</p>
                </div>
                <StageBadge stage={c.stage} />
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type FullPipelineDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Candidate[];
  onStageClick: (stage: string) => void;
};

export function FullPipelineDrawer({ open, onOpenChange, candidates, onStageClick }: FullPipelineDrawerProps) {
  const grouped = groupCandidatesByPipelineStage(candidates);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle>Hiring Pipeline</SheetTitle>
          <SheetDescription>All active candidates by stage.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => onStageClick(stage)}
              className={cn(RECRUIT_DENSE_CARD_INTERACTIVE, RECRUIT_DENSE_CARD, "flex w-full items-center justify-between")}
            >
              <div className="text-left">
                <p className="text-sm font-medium">{STAGE_LABELS[stage]}</p>
                <p className={RECRUIT_SECONDARY}>{grouped[stage].length} candidates</p>
              </div>
              <AvatarStack candidates={grouped[stage]} />
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
