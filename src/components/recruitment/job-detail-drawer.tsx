import { RECRUIT_SECONDARY } from "@/components/recruitment/recruitment-styles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { JOB_STATUS_LABELS } from "@/lib/recruitment/constants";
import type { Candidate, JobPosting } from "@/lib/recruitment/types";
import { formatDate } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobPosting | null;
  candidates: Candidate[];
  canManage?: boolean;
  onStatusChange?: (status: string) => Promise<void>;
};

export function JobDetailDrawer({
  open,
  onOpenChange,
  job,
  candidates,
  canManage,
  onStatusChange,
}: Props) {
  if (!job) return null;

  const applicantCount = candidates.filter((c) => c.job_posting_id === job.id && c.stage !== "rejected").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle>{job.title}</SheetTitle>
          <SheetDescription>{job.department ?? "No department"}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {canManage && onStatusChange && (
            <div className="flex items-center justify-between">
              <span className={RECRUIT_SECONDARY}>Status</span>
              <select
                value={job.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
              >
                {["open", "paused", "closed"].map((s) => (
                  <option key={s} value={s}>
                    {JOB_STATUS_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DetailRow label="Open positions" value={String(job.open_positions)} />
          <DetailRow label="Closing date" value={formatDate(job.closing_date)} />
          <DetailRow label="Candidates" value={String(applicantCount)} />
          <DetailRow label="Posted" value={formatDate(job.created_at)} />

          {job.description && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Description</p>
              <p className="text-sm leading-relaxed text-foreground">{job.description}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
      <span className={RECRUIT_SECONDARY}>{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
